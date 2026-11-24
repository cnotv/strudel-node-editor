import { describe, expect, it } from 'vitest'
import { createVolumeControl } from './playbackVolume'

const buildController = () => {
  const firstGain = { gain: { value: 1 } }
  return { firstGain, controller: { output: { destinationGain: firstGain } } }
}

describe('createVolumeControl', () => {
  it('leaves the output at full volume until told otherwise', () => {
    // Arrange
    const { controller, firstGain } = buildController()
    const volume = createVolumeControl(() => controller)

    // Act
    volume.attach()

    // Assert
    expect(firstGain.gain.value).toBe(1)
  })

  it('applies a new volume to the current output', () => {
    // Arrange
    const { controller, firstGain } = buildController()
    const volume = createVolumeControl(() => controller)

    // Act
    volume.setVolume(0.6)

    // Assert
    expect(firstGain.gain.value).toBe(0.6)
  })

  it('keeps the volume when superdough rebuilds its final gain node', () => {
    // Arrange
    const { controller } = buildController()
    const volume = createVolumeControl(() => controller)
    volume.setVolume(0.4)
    const rebuiltGain = { gain: { value: 1 } }

    // Act
    controller.output.destinationGain = rebuiltGain

    // Assert
    expect(rebuiltGain.gain.value).toBe(0.4)
  })

  it('does nothing before audio has an output', () => {
    // Arrange
    const volume = createVolumeControl(() => undefined)

    // Act
    const hooking = () => volume.setVolume(0.5)

    // Assert
    expect(hooking).not.toThrow()
  })
})
