// @vitest-environment node
import { Buffer } from 'node:buffer'
import { describe, it, expect } from 'vitest'
import ToneMidi from '@tonejs/midi'
import { analyzeWav, analyzeMidi, checkExpectations } from './sound-report.mjs'

const RATE = 48000

const makeWav = (samples) => {
  const data = Buffer.alloc(samples.length * 2)
  samples.forEach((sample, index) => data.writeInt16LE(sample, index * 2))
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVEfmt ', 8)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(RATE, 24)
  header.writeUInt32LE(RATE * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

const tone = (seconds, amplitude) =>
  Array.from({ length: RATE * seconds }, (_, index) =>
    Math.round(amplitude * 32767 * Math.sin((2 * Math.PI * 440 * index) / RATE))
  )
const silence = (seconds) => Array.from({ length: RATE * seconds }, () => 0)

describe('analyzeWav', () => {
  it.each([
    ['a half scale tone', tone(1, 0.5), { duration: 1, peak: 0.5, silenceRatio: 0, clipped: 0 }],
    [
      'half tone, half silence',
      [...tone(1, 0.5), ...silence(1)],
      { duration: 2, peak: 0.5, silenceRatio: 0.5, clipped: 0 }
    ],
    ['pure silence', silence(1), { duration: 1, peak: 0, silenceRatio: 1, clipped: 0 }]
  ])('measures %s', (_label, samples, expected) => {
    // Arrange
    const wav = makeWav(samples)
    // Act
    const report = analyzeWav(wav)
    // Assert
    expect(report.duration).toBeCloseTo(expected.duration, 2)
    expect(report.peak).toBeCloseTo(expected.peak, 2)
    expect(report.silenceRatio).toBeCloseTo(expected.silenceRatio, 1)
    expect(report.clipped).toBe(expected.clipped)
  })

  it('counts samples at full scale as clipped', () => {
    // Arrange
    const wav = makeWav([32767, -32768, 100])
    // Act
    const report = analyzeWav(wav)
    // Assert
    expect(report.clipped).toBe(2)
  })

  it('skips extra chunks between the header and the data', () => {
    // Arrange
    const plain = makeWav(tone(1, 0.5))
    const listChunk = Buffer.concat([
      Buffer.from('LIST'),
      Buffer.from([4, 0, 0, 0]),
      Buffer.from('abcd')
    ])
    const wav = Buffer.concat([plain.subarray(0, 36), listChunk, plain.subarray(36)])
    // Act
    const report = analyzeWav(wav)
    // Assert
    expect(report.duration).toBeCloseTo(1, 2)
  })
})

describe('analyzeMidi', () => {
  it('reports tempo, track names, note counts and the drum channel', () => {
    // Arrange
    const midi = new ToneMidi.Midi()
    midi.header.setTempo(120)
    const bass = midi.addTrack()
    bass.name = 'sawtooth'
    bass.addNote({ midi: 40, time: 0, duration: 0.5 })
    bass.addNote({ midi: 43, time: 0.5, duration: 0.5 })
    const drums = midi.addTrack()
    drums.name = 'bd'
    drums.channel = 9
    drums.addNote({ midi: 36, time: 0, duration: 0.1 })
    // Act
    const report = analyzeMidi(Buffer.from(midi.toArray()))
    // Assert
    expect(report.bpm).toBe(120)
    expect(report.tracks).toEqual([
      { name: 'sawtooth', channel: 0, notes: 2 },
      { name: 'bd', channel: 9, notes: 1 }
    ])
  })
})

describe('checkExpectations', () => {
  const wav = { duration: 2, peak: 0.5, silenceRatio: 0.1, clipped: 2 }
  const midi = { bpm: 120, tracks: [{ name: 'bd', channel: 9, notes: 4 }] }

  it.each([
    ['no expectations', {}, []],
    ['a peak above the minimum', { minPeak: 0.3 }, []],
    ['a peak under the minimum', { minPeak: 0.8 }, ['peak 0.50 is under 0.80']],
    ['clipping within the limit', { maxClipped: 5 }, []],
    ['clipping over the limit', { maxClipped: 0 }, ['2 clipped samples, more than 0']],
    ['too much silence', { maxSilence: 0.05 }, ['silence 0.10 is over 0.05']],
    ['the wrong duration', { duration: 4 }, ['duration 2.00 s is not 4.00 s']],
    ['a missing track', { tracks: ['bd', 'sd'] }, ['track sd is missing from the MIDI']]
  ])('%s', (_label, expectations, failures) => {
    // Act
    const result = checkExpectations({ wav, midi }, expectations)
    // Assert
    expect(result).toEqual(failures)
  })
})
