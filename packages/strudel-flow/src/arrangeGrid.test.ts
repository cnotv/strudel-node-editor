import { describe, expect, it } from 'vitest'
import {
  compressStrudelFlowArrange,
  orderStrudelFlowArrangeParts,
  readStrudelFlowArrangeSequence,
  resizeStrudelFlowArrange,
  toggleStrudelFlowArrangeCycle,
  writeStrudelFlowArrange
} from './arrangeGrid'
import type { StrudelFlowNode } from './types'

describe('readStrudelFlowArrangeSequence', () => {
  it('gives each distinct pattern a part and silence no part', () => {
    // Arrange
    const sections = [
      { cycles: 2, pattern: 'intro' },
      { cycles: 1, pattern: 'silence' },
      { cycles: 2, pattern: 'verse' },
      { cycles: 1, pattern: 'intro' }
    ]

    // Act
    const result = readStrudelFlowArrangeSequence(sections)

    // Assert
    expect(result.parts).toEqual(['intro', 'verse'])
    expect(result.sequence).toEqual([0, 0, -1, 1, 1, 0])
  })
})

describe('compressStrudelFlowArrange', () => {
  it('joins neighbouring cycles of one part', () => {
    // Arrange / Act
    const sections = compressStrudelFlowArrange([0, 0, -1, 1, 1, 1])

    // Assert
    expect(sections).toEqual([
      { cycles: 2, part: 0 },
      { cycles: 1, part: -1 },
      { cycles: 3, part: 1 }
    ])
  })
})

describe('toggleStrudelFlowArrangeCycle', () => {
  it.each([
    ['switches a part on in a silent cycle', [0, -1], 1, 1, [0, 1]],
    ['replaces the part that played', [0, 0], 1, 1, [0, 1]],
    ['stops a part that already plays', [0, 1], 1, 1, [0, -1]]
  ])('%s', (_name, sequence, part, cycle, expected) => {
    // Arrange / Act
    const toggled = toggleStrudelFlowArrangeCycle(sequence, part, cycle)

    // Assert
    expect(toggled).toEqual(expected)
  })
})

describe('resizeStrudelFlowArrange', () => {
  it('pads with silence and cuts from the end', () => {
    // Arrange
    const sequence = [0, 1]

    // Act
    const longer = resizeStrudelFlowArrange(sequence, 4)
    const shorter = resizeStrudelFlowArrange(longer, 1)

    // Assert
    expect(longer).toEqual([0, 1, -1, -1])
    expect(shorter).toEqual([0])
  })
})

describe('writeStrudelFlowArrange', () => {
  it('writes sections from the parts in cable order', () => {
    // Arrange / Act
    const code = writeStrudelFlowArrange([0, 0, -1, 1], ['s("bd")', 'note("c")'])

    // Assert
    expect(code).toBe('arrange([2, s("bd")], [1, silence], [1, note("c")])')
  })

  it('plays silence when no cycle has a part', () => {
    // Arrange / Act
    const code = writeStrudelFlowArrange([-1, 3], ['s("bd")'])

    // Assert
    expect(code).toBe('silence')
  })
})

describe('orderStrudelFlowArrangeParts', () => {
  it('orders top to bottom, then left to right', () => {
    // Arrange
    const at = (id: string, x: number, y: number): StrudelFlowNode => ({
      id,
      type: 'strudel',
      position: { x, y },
      data: { kind: 'code', code: '' }
    })

    // Act
    const ordered = orderStrudelFlowArrangeParts([at('c', 0, 200), at('b', 50, 0), at('a', 0, 0)])

    // Assert
    expect(ordered.map((node) => node.id)).toEqual(['a', 'b', 'c'])
  })
})
