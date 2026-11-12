import { describe, expect, it } from 'vitest'
import {
  readStrudelFlowNoteGrid,
  readStrudelFlowNoteGridPitches,
  renameStrudelFlowNoteGridPitch,
  resizeStrudelFlowNoteGrid,
  toggleStrudelFlowNoteGridStep,
  writeStrudelFlowNoteGrid
} from './noteGrid'
import type { StrudelFlowNoteBar } from './types'

const BEATS_PER_BAR = 4
const emptyBar = (): string[][] => Array.from({ length: 8 }, () => [])

describe('readStrudelFlowNoteGrid', () => {
  it('puts each note on the step it starts, two steps to a beat', () => {
    // Arrange
    const bars: StrudelFlowNoteBar[] = [
      [
        { notes: ['c3'], start: 0, beats: 1 },
        { notes: ['e3', 'g3'], start: 1.5, beats: 0.5 }
      ]
    ]

    // Act
    const grid = readStrudelFlowNoteGrid(bars, BEATS_PER_BAR)

    // Assert
    expect(grid).toHaveLength(1)
    expect(grid[0][0]).toEqual(['c3'])
    expect(grid[0][3]).toEqual(['e3', 'g3'])
    expect(grid[0][1]).toEqual([])
  })

  it('keeps an empty bar as a bar of rests', () => {
    // Arrange / Act
    const grid = readStrudelFlowNoteGrid([[], []], BEATS_PER_BAR)

    // Assert
    expect(grid).toEqual([emptyBar(), emptyBar()])
  })
})

describe('readStrudelFlowNoteGridPitches', () => {
  it('lists each pitch once, highest first', () => {
    // Arrange
    const grid = [emptyBar(), emptyBar()]
    grid[0][0] = ['c3', 'g3']
    grid[1][2] = ['c3', 'e3']

    // Act
    const pitches = readStrudelFlowNoteGridPitches(grid)

    // Assert
    expect(pitches).toEqual(['g3', 'e3', 'c3'])
  })
})

describe('toggleStrudelFlowNoteGridStep', () => {
  it('switches a pitch on at a step, then off again', () => {
    // Arrange
    const grid = [emptyBar()]

    // Act
    const on = toggleStrudelFlowNoteGridStep(grid, 0, 2, 'c3')
    const off = toggleStrudelFlowNoteGridStep(on, 0, 2, 'c3')

    // Assert
    expect(on[0][2]).toEqual(['c3'])
    expect(off[0][2]).toEqual([])
  })
})

describe('writeStrudelFlowNoteGrid', () => {
  it.each([
    ['one bar', [['c3', [], 'e3', [], [], [], [], []]], 'c3 ~ e3 ~ ~ ~ ~ ~'],
    ['a chord step', [[['c3', 'e3'], [], [], [], [], [], [], []]], '[c3,e3] ~ ~ ~ ~ ~ ~ ~'],
    ['an empty bar', [[[], [], [], [], [], [], [], []]], '~']
  ])('writes %s', (_name, shape, expected) => {
    // Arrange
    const grid = shape.map((bar) => bar.map((step) => (Array.isArray(step) ? step : [step])))

    // Act
    const pattern = writeStrudelFlowNoteGrid(grid)

    // Assert
    expect(pattern).toBe(expected)
  })

  it('wraps several bars in angle brackets, one bracket a bar', () => {
    // Arrange
    const grid = [emptyBar(), emptyBar()]
    grid[1][0] = ['a2']

    // Act
    const pattern = writeStrudelFlowNoteGrid(grid)

    // Assert
    expect(pattern).toBe('<~ [a2 ~ ~ ~ ~ ~ ~ ~]>')
  })
})

describe('resizeStrudelFlowNoteGrid', () => {
  it('adds empty bars and cuts bars off the end', () => {
    // Arrange
    const grid = [emptyBar()]

    // Act
    const longer = resizeStrudelFlowNoteGrid(grid, 3)
    const shorter = resizeStrudelFlowNoteGrid(longer, 1)

    // Assert
    expect(longer).toHaveLength(3)
    expect(shorter).toEqual(grid)
  })
})

describe('renameStrudelFlowNoteGridPitch', () => {
  it('plays the new pitch wherever the old one played', () => {
    // Arrange
    const grid = [emptyBar()]
    grid[0][1] = ['c3', 'e3']

    // Act
    const renamed = renameStrudelFlowNoteGridPitch(grid, 'c3', 'd3')

    // Assert
    expect(renamed[0][1]).toEqual(['d3', 'e3'])
  })
})
