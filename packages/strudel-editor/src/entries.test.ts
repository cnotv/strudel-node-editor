import { describe, it, expect } from 'vitest'
import * as helpersEntry from './helpers'
import * as rootEntry from './index'

const HELPER_EXPORTS = [
  'STRUDEL_SAVED_CODE_STORAGE_KEY',
  'readStrudelAddress',
  'readStrudelNoteBars',
  'useStrudelSounds',
  'writeStrudelAddress'
]

describe('package entries', () => {
  it.each(HELPER_EXPORTS)('exposes %s from the helpers entry only', (exportName) => {
    // Arrange
    const helperNames = Object.keys(helpersEntry)
    const rootNames = Object.keys(rootEntry)

    // Act
    const inHelpers = helperNames.includes(exportName)
    const inRoot = rootNames.includes(exportName)

    // Assert
    expect(inHelpers).toBe(true)
    expect(inRoot).toBe(false)
  })

  it.each(['StrudelEditor', 'StrudelCodeEditor', 'loadDefaultStrudelPlayback'])(
    'exposes %s from the root entry only',
    (exportName) => {
      // Arrange
      const helperNames = Object.keys(helpersEntry)
      const rootNames = Object.keys(rootEntry)

      // Act
      const inRoot = rootNames.includes(exportName)
      const inHelpers = helperNames.includes(exportName)

      // Assert
      expect(inRoot).toBe(true)
      expect(inHelpers).toBe(false)
    }
  )
})
