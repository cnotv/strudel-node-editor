import { beforeEach, describe, it, expect } from 'vitest'
import {
  STRUDEL_SONGS,
  deleteStrudelSavedSong,
  readStrudelSavedSongs,
  saveStrudelSavedSong,
  writeStrudelAddress
} from '@webgamekit/strudel-editor/helpers'

// The host side of the helpers entry: a separated app reads the songs and its own saves by
// package name, without mounting the editor.
beforeEach(() => {
  localStorage.clear()
})

describe('the helpers entry a host app imports', () => {
  it('lists the built-in songs with a unique id and a label and code to play', () => {
    // Arrange
    const songs = STRUDEL_SONGS

    // Act
    const songIds = songs.map((song) => song.id)

    // Assert
    expect(songs.length).toBeGreaterThan(0)
    expect(new Set(songIds).size).toBe(songs.length)
    songs.forEach((song) => {
      expect(song.label.length).toBeGreaterThan(0)
      expect(song.code.length).toBeGreaterThan(0)
    })
  })

  it('saves a song a host wrote, lists it as saved, and opens it by its id', () => {
    // Arrange
    const songName = 'Night Drive'

    // Act
    saveStrudelSavedSong(songName, 's("bd")')
    const savedSongs = readStrudelSavedSongs()
    const address = writeStrudelAddress({}, { patternId: savedSongs[0].id })

    // Assert
    expect(savedSongs).toEqual([{ id: 'saved-night-drive', label: songName, code: 's("bd")' }])
    expect(address).toEqual({ pattern: 'saved-night-drive' })
  })

  it('deletes the saved song a host names by id', () => {
    // Arrange
    saveStrudelSavedSong('Night Drive', 's("bd")')
    const savedSongId = readStrudelSavedSongs()[0].id

    // Act
    deleteStrudelSavedSong(savedSongId)

    // Assert
    expect(readStrudelSavedSongs()).toEqual([])
  })
})
