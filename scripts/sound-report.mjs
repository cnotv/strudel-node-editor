/**
 * Measures a rendered pattern so it can be checked without listening: the WAV's length, level and
 * silence, and the MIDI's tempo and tracks. Pure functions over file buffers, used by
 * `strudel-check.mjs` and tested in `sound-report.test.mjs`.
 */
import ToneMidi from '@tonejs/midi'

const SILENCE_THRESHOLD = 10 ** (-60 / 20)
const SILENCE_WINDOW_SECONDS = 0.01
const FULL_SCALE_POSITIVE = 32767
const FULL_SCALE_NEGATIVE = -32768
const RIFF_HEADER_BYTES = 12
const CHUNK_HEADER_BYTES = 8

const findChunk = (wav, chunkName) => {
  const search = (offset) => {
    if (offset + CHUNK_HEADER_BYTES > wav.length) throw new Error(`WAV has no ${chunkName} chunk`)
    const size = wav.readUInt32LE(offset + 4)
    return wav.toString('ascii', offset, offset + 4) === chunkName
      ? { start: offset + CHUNK_HEADER_BYTES, size }
      : search(offset + CHUNK_HEADER_BYTES + size + (size % 2))
  }
  return search(RIFF_HEADER_BYTES)
}

/**
 * @param {Buffer} wav 16 bit PCM, as the editor's WAV export writes it
 * @returns {{ duration: number, peak: number, rms: number, silenceRatio: number, clipped: number }}
 */
export const analyzeWav = (wav) => {
  const format = findChunk(wav, 'fmt ')
  const channels = wav.readUInt16LE(format.start + 2)
  const sampleRate = wav.readUInt32LE(format.start + 4)
  const data = findChunk(wav, 'data')
  const sampleCount = Math.floor(Math.min(data.size, wav.length - data.start) / 2)
  const samples = Array.from({ length: sampleCount }, (_, index) =>
    wav.readInt16LE(data.start + index * 2)
  )
  const frameCount = Math.floor(sampleCount / channels)
  const windowSamples = Math.max(1, Math.round(sampleRate * SILENCE_WINDOW_SECONDS)) * channels
  const windows = Array.from({ length: Math.ceil(sampleCount / windowSamples) }, (_, index) =>
    samples.slice(index * windowSamples, (index + 1) * windowSamples)
  )
  const silentWindows = windows.filter(
    (window) => Math.max(...window.map(Math.abs)) / 32768 < SILENCE_THRESHOLD
  )
  return {
    duration: frameCount / sampleRate,
    peak: samples.reduce((peak, sample) => Math.max(peak, Math.abs(sample)), 0) / 32768,
    rms:
      Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / (sampleCount || 1)) /
      32768,
    silenceRatio: windows.length ? silentWindows.length / windows.length : 1,
    clipped: samples.filter(
      (sample) => sample >= FULL_SCALE_POSITIVE || sample <= FULL_SCALE_NEGATIVE
    ).length
  }
}

/**
 * @param {Buffer} midiFile
 * @returns {{ bpm: number, tracks: { name: string, channel: number, notes: number }[] }}
 */
export const analyzeMidi = (midiFile) => {
  const midi = new ToneMidi.Midi(midiFile)
  return {
    bpm: Math.round(midi.header.tempos[0]?.bpm ?? 120),
    tracks: midi.tracks.map((track) => ({
      name: track.name,
      channel: track.channel,
      notes: track.notes.length
    }))
  }
}

/**
 * @param {{ wav: ReturnType<typeof analyzeWav>, midi: ReturnType<typeof analyzeMidi> }} report
 * @param {{ minPeak?: number, maxClipped?: number, maxSilence?: number, duration?: number, tracks?: string[] }} expectations
 * @returns {string[]} one sentence per failed expectation, empty when all hold
 */
export const checkExpectations = ({ wav, midi }, expectations) => {
  const { minPeak, maxClipped, maxSilence, duration, tracks = [] } = expectations
  const trackNames = midi.tracks.map((track) => track.name)
  return [
    minPeak !== undefined && wav.peak < minPeak
      ? `peak ${wav.peak.toFixed(2)} is under ${minPeak.toFixed(2)}`
      : undefined,
    maxClipped !== undefined && wav.clipped > maxClipped
      ? `${wav.clipped} clipped samples, more than ${maxClipped}`
      : undefined,
    maxSilence !== undefined && wav.silenceRatio > maxSilence
      ? `silence ${wav.silenceRatio.toFixed(2)} is over ${maxSilence.toFixed(2)}`
      : undefined,
    duration !== undefined && Math.abs(wav.duration - duration) > 0.05
      ? `duration ${wav.duration.toFixed(2)} s is not ${duration.toFixed(2)} s`
      : undefined,
    ...tracks
      .filter((name) => !trackNames.includes(name))
      .map((name) => `track ${name} is missing from the MIDI`)
  ].filter(Boolean)
}
