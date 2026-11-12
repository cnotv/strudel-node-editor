import { describe, expect, it } from 'vitest'
import {
  expandStrudelFlowArrange,
  readStrudelFlowArrangeRows,
  renameStrudelFlowArrangeRow,
  resizeStrudelFlowArrange,
  toggleStrudelFlowArrangeCycle
} from './arrangeGrid'

const SONG = [
  { cycles: 2, pattern: 'silence' },
  { cycles: 2, pattern: 'kick' },
  { cycles: 1, pattern: 'stack(kick, hat)' }
]

describe('arrangeGrid', () => {
  it('lists each played part once, in order, and never silence', () => {
    // Act
    const rows = readStrudelFlowArrangeRows(SONG)

    // Assert
    expect(rows).toEqual(['kick', 'stack(kick, hat)'])
  })

  it.each([
    { cycle: 0, expected: ['kick', 'silence', 'kick', 'kick', 'stack(kick, hat)'] },
    { cycle: 2, expected: ['silence', 'silence', 'silence', 'kick', 'stack(kick, hat)'] },
    { cycle: 4, expected: ['silence', 'silence', 'kick', 'kick', 'kick'] }
  ])('toggles cycle $cycle of the kick row', ({ cycle, expected }) => {
    // Act
    const sections = toggleStrudelFlowArrangeCycle(SONG, 'kick', cycle)

    // Assert
    expect(expandStrudelFlowArrange(sections)).toEqual(expected)
  })

  it('writes runs of the same part back as one section', () => {
    // Act
    const sections = toggleStrudelFlowArrangeCycle(SONG, 'kick', 1)

    // Assert
    expect(sections).toEqual([
      { cycles: 1, pattern: 'silence' },
      { cycles: 3, pattern: 'kick' },
      { cycles: 1, pattern: 'stack(kick, hat)' }
    ])
  })

  it.each([
    { length: 3, cycles: 3 },
    { length: 8, cycles: 8 }
  ])('resizes to $length cycles, padding with silence', ({ length, cycles }) => {
    // Act
    const sections = resizeStrudelFlowArrange(SONG, length)

    // Assert
    expect(expandStrudelFlowArrange(sections)).toHaveLength(cycles)
    expect(expandStrudelFlowArrange(sections).slice(5)).toEqual(
      Array(Math.max(0, length - 5)).fill('silence')
    )
  })

  it('renames a part everywhere it plays', () => {
    // Act
    const sections = renameStrudelFlowArrangeRow(SONG, 'kick', 'snare')

    // Assert
    expect(readStrudelFlowArrangeRows(sections)).toEqual(['snare', 'stack(kick, hat)'])
  })
})
