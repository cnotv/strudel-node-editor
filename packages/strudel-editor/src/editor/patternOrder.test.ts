import { describe, expect, it } from 'vitest'
import {
  movePatternAfter,
  movePatternBefore,
  readStoredPatternOrder,
  sortPatternsByStoredOrder
} from './patternOrder'
import type { StrudelExample } from './types'

const PATTERNS: StrudelExample[] = [
  { id: 'alpha', label: 'Alpha', code: '' },
  { id: 'bravo', label: 'Bravo', code: '' },
  { id: 'charlie', label: 'Charlie', code: '' }
]

describe('patternOrder', () => {
  it('puts the stored ids first and the patterns it does not know after them', () => {
    // Arrange / Act
    const labels = sortPatternsByStoredOrder(PATTERNS, ['charlie', 'alpha']).map(
      (pattern) => pattern.label
    )

    // Assert
    expect(labels).toEqual(['Charlie', 'Alpha', 'Bravo'])
  })

  it('drops stored ids that no pattern has any more', () => {
    // Arrange / Act
    const labels = sortPatternsByStoredOrder(PATTERNS, ['deleted', 'bravo']).map(
      (pattern) => pattern.label
    )

    // Assert
    expect(labels).toEqual(['Bravo', 'Alpha', 'Charlie'])
  })

  it.each([
    ['before', movePatternBefore, ['bravo', 'alpha', 'charlie']],
    ['after', movePatternAfter, ['alpha', 'charlie', 'bravo']]
  ] as const)('moves a pattern %s another', (placement, move, expectedIds) => {
    // Arrange
    const patternIds = PATTERNS.map((pattern) => pattern.id)
    const draggedPatternId = 'bravo'
    const targetPatternId = placement === 'before' ? 'alpha' : 'charlie'

    // Act
    const movedIds = move(patternIds, draggedPatternId, targetPatternId)

    // Assert
    expect(movedIds).toEqual(expectedIds)
  })

  it('leaves the order alone when one of the ids is missing', () => {
    // Arrange
    const patternIds = PATTERNS.map((pattern) => pattern.id)

    // Act
    const movedIds = movePatternBefore(patternIds, 'missing', 'bravo')

    // Assert
    expect(movedIds).toEqual(patternIds)
  })

  it.each([
    [null, []],
    ['not json', []],
    ['{"order":["alpha"]}', []],
    ['["charlie", 3, "alpha"]', ['charlie', 'alpha']]
  ])('reads %o as the stored order %o', (storedText, expectedIds) => {
    // Arrange / Act
    const storedIds = readStoredPatternOrder(storedText)

    // Assert
    expect(storedIds).toEqual(expectedIds)
  })
})
