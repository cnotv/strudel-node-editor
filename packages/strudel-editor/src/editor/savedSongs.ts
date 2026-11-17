import { readStorage, writeStorage } from '../utils/storage'
import { STRUDEL_SAVED_PATTERNS_STORAGE_KEY } from './config'
import {
  readSavedPatterns,
  removeSavedPattern,
  toSavedPatternExamples,
  upsertSavedPattern
} from './savedPatterns'
import type { StrudelExample } from './types'

/**
 * The songs saved under a name in this browser, as the Pattern library lists them, so a host can
 * show them beside the built-in songs without mounting the editor.
 * @returns the saved songs, newest first
 */
export const readStrudelSavedSongs = (): StrudelExample[] =>
  toSavedPatternExamples(readSavedPatterns(readStorage(STRUDEL_SAVED_PATTERNS_STORAGE_KEY)))

/**
 * Saves code under a name in the storage the editor reads, replacing a save with the same name,
 * so a host can offer its own save button. A blank name saves nothing.
 * @param name - the name to save under
 * @param code - the code to save
 */
export const saveStrudelSavedSong = (name: string, code: string): void => {
  const storedSongs = readSavedPatterns(readStorage(STRUDEL_SAVED_PATTERNS_STORAGE_KEY))
  writeStorage(
    STRUDEL_SAVED_PATTERNS_STORAGE_KEY,
    JSON.stringify(upsertSavedPattern(storedSongs, name, code))
  )
}

/**
 * Deletes the saved song with an id, so a host can offer its own delete button.
 * @param savedSongId - the id the song is linked by, `saved-` and the name it was saved under
 */
export const deleteStrudelSavedSong = (savedSongId: string): void => {
  const storedSongs = readSavedPatterns(readStorage(STRUDEL_SAVED_PATTERNS_STORAGE_KEY))
  writeStorage(
    STRUDEL_SAVED_PATTERNS_STORAGE_KEY,
    JSON.stringify(removeSavedPattern(storedSongs, savedSongId))
  )
}
