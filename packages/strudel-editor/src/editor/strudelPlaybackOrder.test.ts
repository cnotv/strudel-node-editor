import { beforeEach, describe, expect, it, vi } from 'vitest'

const engine = vi.hoisted(() => ({
  calls: [] as string[],
  holdFirstExport: null as Promise<void> | null
}))

vi.mock('./instruments/useInstruments', () => ({
  useInstruments: () => ({ ensureRenderedForCode: async () => undefined })
}))
vi.mock('./strudelSoundLibrary', () => ({ loadStrudelSoundLibrary: async () => undefined }))
vi.mock('@strudel/mini', () => ({}))
vi.mock('@strudel/tonal', () => ({}))
vi.mock('@strudel/midi/midi.mjs', () => ({}))
vi.mock('@strudel/codemirror', () => ({ slider: () => undefined, sliderWithID: () => undefined }))
vi.mock('@strudel/transpiler', () => ({ transpiler: () => undefined }))
vi.mock('@strudel/draw', () => ({
  cleanupDraw: () => undefined,
  Drawer: function Drawer() {
    return { setDrawTime: () => undefined, invalidate: () => undefined }
  }
}))
vi.mock('@strudel/webaudio', () => ({
  initAudio: async () => undefined,
  getAudioContext: () => ({ currentTime: 0 }),
  setAudioContext: () => undefined,
  webaudioOutput: () => undefined,
  getSuperdoughAudioController: () => undefined
}))
vi.mock('@strudel/core', () => ({
  evalScope: async () => undefined,
  repl: () => ({
    scheduler: { cps: 0.5, now: () => 0 },
    stop: async () => undefined,
    evaluate: async (code: string, autostart?: boolean) => {
      const kind = autostart === false ? 'export' : 'live'
      engine.calls.push(`${kind} ${code.split('\n').at(-1)}`)
      if (kind === 'export' && engine.holdFirstExport !== null) {
        const hold = engine.holdFirstExport
        engine.holdFirstExport = null
        await hold
      }
      return { queryArc: () => [] }
    }
  })
}))

const createGate = () => {
  const gate: { open: () => void } = { open: () => undefined }
  const promise = new Promise<void>((resolve) => {
    gate.open = resolve
  })
  return { promise, resolve: () => gate.open() }
}

describe('playStrudelSong and renderStrudelCodeToNotes', () => {
  beforeEach(() => {
    engine.calls.length = 0
    engine.holdFirstExport = null
  })

  it('plays a song before the note renders waiting behind a render that is running', async () => {
    // Arrange
    const { playStrudelSong, renderStrudelCodeToNotes } = await import('./strudelPlayback')
    await renderStrudelCodeToNotes('warmup')
    engine.calls.length = 0
    const releaseRender = createGate()
    engine.holdFirstExport = releaseRender.promise

    // Act
    const running = renderStrudelCodeToNotes('first')
    const waiting = renderStrudelCodeToNotes('second')
    await vi.waitFor(() => expect(engine.calls).toHaveLength(1))
    const playing = playStrudelSong('live')
    releaseRender.resolve()
    await Promise.all([running, waiting, playing])

    // Assert
    expect(engine.calls.filter((call) => call.startsWith('live'))).toEqual(['live live'])
    expect(engine.calls.indexOf('live live')).toBeLessThan(engine.calls.indexOf('export second'))
    expect(engine.calls.at(-1)).toBe('export second')
  })

  it('renders the notes again after the song, with the tempo the render read', async () => {
    // Arrange
    const { playStrudelSong, renderStrudelCodeToNotes } = await import('./strudelPlayback')
    const releaseRender = createGate()
    engine.holdFirstExport = releaseRender.promise

    // Act
    const rendering = renderStrudelCodeToNotes('chart')
    await vi.waitFor(() => expect(engine.calls).toHaveLength(1))
    const playing = playStrudelSong('live')
    releaseRender.resolve()
    const [rendered] = await Promise.all([rendering, playing])

    // Assert
    expect(engine.calls).toEqual(['export chart', 'live live', 'export chart', 'export chart'])
    expect(rendered.cyclesPerSecond).toBe(0.5)
  })
})
