import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { INSTRUMENT_STORAGE_KEY } from './editor/instruments/config'
import {
  playStrudelSong,
  readStrudelSavedSongs,
  renderStrudelCodeToNotes,
  saveStrudelSavedSong
} from './helpers'

const { mockRegister, engine } = vi.hoisted(() => ({
  mockRegister: vi.fn(),
  engine: {
    evaluate: vi.fn(),
    stop: vi.fn(),
    replOptions: { current: null as null | { onEvalError: (error: unknown) => void } }
  }
}))

vi.mock('./editor/instruments/registerInstrument', () => ({ registerInstrument: mockRegister }))
vi.mock('./editor/strudelSoundLibrary', () => ({
  loadStrudelSoundLibrary: vi.fn(async () => ({ drumMachines: [] }))
}))
vi.mock('./editor/strudelOfflineRender', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  readScheduledHaps: () => []
}))
vi.mock('@strudel/core', () => ({
  evalScope: vi.fn(async () => undefined),
  repl: vi.fn(async (options: { onEvalError: (error: unknown) => void }) => {
    engine.replOptions.current = options
    return { evaluate: engine.evaluate, stop: engine.stop, scheduler: { cps: 0.5, now: () => 3 } }
  })
}))
vi.mock('@strudel/webaudio', () => ({
  samples: vi.fn(),
  registerSound: vi.fn(),
  soundMap: { get: () => ({}) },
  webaudioOutput: vi.fn(),
  initAudio: vi.fn(async () => undefined),
  getAudioContext: () => ({ currentTime: 0, state: 'running', resume: vi.fn() }),
  setAudioContext: vi.fn()
}))
vi.mock('@strudel/transpiler', () => ({ transpiler: vi.fn() }))
vi.mock('@strudel/mini', () => ({}))
vi.mock('@strudel/tonal', () => ({}))
vi.mock('@strudel/midi/midi.mjs', () => ({}))
vi.mock('@strudel/codemirror', () => ({ slider: vi.fn(), sliderWithID: vi.fn() }))
vi.mock('@strudel/draw', () => ({
  Drawer: vi.fn(() => {
    return { setDrawTime: vi.fn(), invalidate: vi.fn(), start: vi.fn(), stop: vi.fn() }
  }),
  cleanupDraw: vi.fn()
}))

const renderedNames = (): string[] =>
  mockRegister.mock.calls.map(([options]) => options.preset.name)

const saveOrganPreset = (name: string): void => {
  const stored = JSON.parse(localStorage.getItem(INSTRUMENT_STORAGE_KEY) ?? '{"userPresets":[]}')
  const knobs = { body: 0.5, brightness: 0.5, percussion: 0.3, drive: 0.3, vibrato: 0.4 }
  localStorage.setItem(
    INSTRUMENT_STORAGE_KEY,
    JSON.stringify({
      ...stored,
      userPresets: [...stored.userPresets, { name, kind: 'organ', knobs }]
    })
  )
}

const readSavedSongCode = (label: string): string =>
  readStrudelSavedSongs().find((song) => song.label === label)?.code ?? ''

describe('helpers entry, as a host app uses it', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    mockRegister.mockReset().mockResolvedValue(undefined)
    engine.evaluate.mockReset().mockResolvedValue({})
    engine.stop.mockReset()
  })

  describe('renderStrudelCodeToNotes', () => {
    it('writes a MIDI file and reports the tempo the song set', async () => {
      // Arrange
      const code = 's("garagekit_kick*2")'

      // Act
      const notes = await renderStrudelCodeToNotes(code)

      // Assert
      expect(notes.midi.byteLength).toBeGreaterThan(0)
      expect(notes.cyclesPerSecond).toBe(0.5)
      expect(renderedNames()).toContain('garagekit')
    })

    it('rejects when the song does not evaluate', async () => {
      // Arrange
      engine.evaluate.mockImplementation(async () => {
        engine.replOptions.current?.onEvalError(new Error('x is not defined'))
        return undefined
      })

      // Act
      const outcome = renderStrudelCodeToNotes('x')

      // Assert
      await expect(outcome).rejects.toThrow('x is not defined')
    })

    it('renders a song saved from another app after an earlier song was rendered', async () => {
      // Arrange
      await renderStrudelCodeToNotes('s("garagekit_kick")')
      saveOrganPreset('latecomer')
      saveStrudelSavedSong('From the game', 'note("c3").s("latecomer_note")')

      // Act
      await renderStrudelCodeToNotes(readSavedSongCode('From the game'))

      // Assert
      expect(renderedNames()).toContain('latecomer')
    })

    it('renders the new instrument of a saved song that was edited', async () => {
      // Arrange
      saveOrganPreset('first')
      saveStrudelSavedSong('Edited', 'note("c3").s("first_note")')
      await renderStrudelCodeToNotes(readSavedSongCode('Edited'))
      saveOrganPreset('second')
      saveStrudelSavedSong('Edited', 'note("c3").s("second_note")')

      // Act
      await renderStrudelCodeToNotes(readSavedSongCode('Edited'))

      // Assert
      expect(readStrudelSavedSongs()).toHaveLength(1)
      expect(renderedNames()).toEqual(expect.arrayContaining(['first', 'second']))
    })
  })

  describe('playStrudelSong', () => {
    it('starts the song and hands back its position and a way to stop it', async () => {
      // Arrange
      const code = 's("garagekit_kick")'

      // Act
      const liveSong = await playStrudelSong(code)
      await liveSong.stop()

      // Assert
      expect(engine.evaluate).toHaveBeenCalledWith(expect.stringContaining(code))
      expect(liveSong.readPosition()).toEqual({ cycle: 3, cyclesPerSecond: 0.5 })
      expect(engine.stop).toHaveBeenCalled()
    })

    it('plays a song saved from another app that names an instrument saved after the first play', async () => {
      // Arrange
      await playStrudelSong('s("garagekit_kick")')
      saveOrganPreset('latecomer')
      saveStrudelSavedSong('From the game', 'note("c3").s("latecomer_note")')

      // Act
      await playStrudelSong(readSavedSongCode('From the game'))

      // Assert
      expect(renderedNames()).toContain('latecomer')
    })

    it('rejects naming the instrument that could not be rendered', async () => {
      // Arrange
      mockRegister.mockRejectedValue(new Error('worker crashed'))

      // Act
      const outcome = playStrudelSong('s("garagekit_kick")')

      // Assert
      await expect(outcome).rejects.toThrow(/garagekit.*worker crashed/s)
    })

    it('rejects when the song does not evaluate', async () => {
      // Arrange
      engine.evaluate.mockImplementation(async () => {
        engine.replOptions.current?.onEvalError(new Error('x is not defined'))
      })

      // Act
      const outcome = playStrudelSong('x')

      // Assert
      await expect(outcome).rejects.toThrow('x is not defined')
    })
  })
})
