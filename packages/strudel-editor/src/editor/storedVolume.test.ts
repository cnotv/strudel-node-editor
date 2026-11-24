import { describe, expect, it } from 'vitest'
import { STRUDEL_TIMELINE_DEFAULT_VOLUME, STRUDEL_VOLUME_STORAGE_KEY } from './config'
import { readStoredVolume } from './storedVolume'

describe('readStoredVolume', () => {
  it.each([
    ['nothing stored', null, STRUDEL_TIMELINE_DEFAULT_VOLUME],
    ['a stored volume', '0.3', 0.3],
    ['a stored mute', '0', 0],
    ['text', 'loud', STRUDEL_TIMELINE_DEFAULT_VOLUME],
    ['an empty string', '', STRUDEL_TIMELINE_DEFAULT_VOLUME],
    ['a volume above the range', '4', STRUDEL_TIMELINE_DEFAULT_VOLUME]
  ])('reads %s', (_, stored, expected) => {
    // Arrange
    localStorage.removeItem(STRUDEL_VOLUME_STORAGE_KEY)
    if (stored !== null) {
      localStorage.setItem(STRUDEL_VOLUME_STORAGE_KEY, stored)
    }

    // Act
    const volume = readStoredVolume()

    // Assert
    expect(volume).toBe(expected)
  })
})
