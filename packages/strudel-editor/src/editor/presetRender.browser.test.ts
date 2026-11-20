import { describe, expect, it } from 'vitest'
import { setActivePinia } from 'pinia'
import { loadDefaultStrudelPlayback } from './strudelPlayback'
import { EXPORT_DEFAULT_OPTIONS } from './config'

const WAV_HEADER_BYTES = 44
const PCM_MAX_VALUE = 0x7fff
const SILENCE_PEAK = 0.001

const readWavPeak = (file: Uint8Array): number => {
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength)
  const sampleCount = (file.byteLength - WAV_HEADER_BYTES) / Int16Array.BYTES_PER_ELEMENT
  return (
    Array.from({ length: sampleCount }, (_, index) =>
      Math.abs(view.getInt16(WAV_HEADER_BYTES + index * Int16Array.BYTES_PER_ELEMENT, true))
    ).reduce((peak, sample) => Math.max(peak, sample), 0) / PCM_MAX_VALUE
  )
}

describe('built-in instrument presets render offline', () => {
  it(
    'sounds through renderToWavBytes with no active Pinia and no editor mounted',
    { timeout: 120000 },
    async () => {
      // Arrange
      setActivePinia(undefined)
      const playback = await loadDefaultStrudelPlayback({
        onEvaluated: () => undefined,
        onFrame: () => undefined,
        onStopped: () => undefined,
        getDrawContext: () => null
      })

      // Act
      const result = await playback.renderToWavBytes(
        'setcps(1)\nstack(s("garagekit_kick*2"), note("c2 e2").s("grungebass_note"))',
        { ...EXPORT_DEFAULT_OPTIONS, endCycle: 1 }
      )

      // Assert
      expect(result.errorMessage).toBeUndefined()
      expect(result.file?.byteLength).toBeGreaterThan(WAV_HEADER_BYTES)
      expect(readWavPeak(new Uint8Array(result.file ?? []))).toBeGreaterThan(SILENCE_PEAK)
    }
  )
})
