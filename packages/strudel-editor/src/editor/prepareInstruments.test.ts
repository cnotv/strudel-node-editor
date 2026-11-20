import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { prepareInstrumentsForCode } from './strudelPlayback'

const { mockRegister } = vi.hoisted(() => ({ mockRegister: vi.fn() }))

vi.mock('./instruments/registerInstrument', () => ({ registerInstrument: mockRegister }))
vi.mock('@strudel/webaudio', () => ({
  samples: vi.fn(),
  registerSound: vi.fn(),
  soundMap: { get: () => ({}) }
}))
vi.mock('./strudelSoundLibrary', () => ({
  loadStrudelSoundLibrary: vi.fn(async () => ({ drumMachines: [] }))
}))

const renderedNames = (): string[] =>
  mockRegister.mock.calls.map(([options]) => options.preset.name)

describe('prepareInstrumentsForCode', () => {
  beforeEach(() => {
    localStorage.clear()
    mockRegister.mockReset().mockResolvedValue(undefined)
  })

  it('renders the presets the code names when the host has no active Pinia', async () => {
    // Arrange
    setActivePinia(undefined)

    // Act
    await prepareInstrumentsForCode('s("garagekit_kick")\nnote("c2").s("grungebass_note")')

    // Assert
    expect(renderedNames()).toEqual(expect.arrayContaining(['garagekit', 'grungebass']))
  })

  it('renders through the host Pinia when there is one', async () => {
    // Arrange
    setActivePinia(createPinia())

    // Act
    await prepareInstrumentsForCode('s("garagekit_kick")')

    // Assert
    expect(renderedNames()).toEqual(['garagekit'])
  })

  it('rejects naming every preset that could not be rendered', async () => {
    // Arrange
    setActivePinia(createPinia())
    mockRegister.mockRejectedValue(new Error('worker crashed'))

    // Act
    const outcome = prepareInstrumentsForCode(
      's("garagekit_kick")\nnote("c2").s("grungebass_note")'
    )

    // Assert
    await expect(outcome).rejects.toThrow(/garagekit.*worker crashed/s)
    await expect(outcome).rejects.toThrow(/grungebass/)
  })
})
