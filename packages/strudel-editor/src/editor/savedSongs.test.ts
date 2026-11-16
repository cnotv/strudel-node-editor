import { beforeEach, describe, it, expect } from 'vitest'
import { STRUDEL_SAVED_PATTERNS_STORAGE_KEY } from './config'
import { STRUDEL_SONGS } from '../helpers'
import { deleteStrudelSavedSong, readStrudelSavedSongs, saveStrudelSavedSong } from './savedSongs'

beforeEach(() => {
  localStorage.clear()
})

describe('readStrudelSavedSongs', () => {
  it.each([
    ['nothing stored', null],
    ['text that is not JSON', 'not json'],
    ['JSON that is not a list', '{"name":"a","code":"b"}']
  ])('reads %s as no songs', (_case, storedText) => {
    // Arrange
    if (storedText !== null) {
      localStorage.setItem(STRUDEL_SAVED_PATTERNS_STORAGE_KEY, storedText)
    }

    // Act
    const savedSongs = readStrudelSavedSongs()

    // Assert
    expect(savedSongs).toEqual([])
  })

  it('reads the stored songs as the library lists them, newest first', () => {
    // Arrange
    localStorage.setItem(
      STRUDEL_SAVED_PATTERNS_STORAGE_KEY,
      JSON.stringify([{ name: 'Night Drive', code: 's("bd")' }])
    )

    // Act
    const savedSongs = readStrudelSavedSongs()

    // Assert
    expect(savedSongs).toEqual([{ id: 'saved-night-drive', label: 'Night Drive', code: 's("bd")' }])
  })
})

describe('saveStrudelSavedSong', () => {
  it('stores the song under its name, newest first', () => {
    // Arrange
    saveStrudelSavedSong('First', 's("bd")')

    // Act
    saveStrudelSavedSong('Second', 's("sd")')

    // Assert
    expect(readStrudelSavedSongs()).toEqual([
      { id: 'saved-second', label: 'Second', code: 's("sd")' },
      { id: 'saved-first', label: 'First', code: 's("bd")' }
    ])
  })

  it('replaces the song a name already saved, keeping one save per name', () => {
    // Arrange
    saveStrudelSavedSong('Beat', 's("bd")')

    // Act
    saveStrudelSavedSong('Beat', 's("sd")')

    // Assert
    expect(readStrudelSavedSongs()).toEqual([{ id: 'saved-beat', label: 'Beat', code: 's("sd")' }])
  })

  it('stores nothing under a blank name', () => {
    // Arrange
    saveStrudelSavedSong('Beat', 's("bd")')

    // Act
    saveStrudelSavedSong('   ', 's("sd")')

    // Assert
    expect(readStrudelSavedSongs()).toEqual([{ id: 'saved-beat', label: 'Beat', code: 's("bd")' }])
  })
})

describe('deleteStrudelSavedSong', () => {
  it('removes the song with the id', () => {
    // Arrange
    saveStrudelSavedSong('First', 's("bd")')
    saveStrudelSavedSong('Second', 's("sd")')

    // Act
    deleteStrudelSavedSong('saved-first')

    // Assert
    expect(readStrudelSavedSongs()).toEqual([
      { id: 'saved-second', label: 'Second', code: 's("sd")' }
    ])
  })

  it('leaves every song when no song has the id', () => {
    // Arrange
    saveStrudelSavedSong('First', 's("bd")')

    // Act
    deleteStrudelSavedSong('saved-missing')

    // Assert
    expect(readStrudelSavedSongs()).toEqual([
      { id: 'saved-first', label: 'First', code: 's("bd")' }
    ])
  })
})

describe('STRUDEL_SONGS', () => {
  it('lists every song with a unique id and a label and code to play', () => {
    // Arrange
    const songs = STRUDEL_SONGS

    // Act
    const songIds = songs.map((song) => song.id)

    // Assert
    expect(new Set(songIds).size).toBe(songs.length)
    songs.forEach((song) => {
      expect(song.id.length).toBeGreaterThan(0)
      expect(song.label.length).toBeGreaterThan(0)
      expect(song.code.length).toBeGreaterThan(0)
    })
  })
})
