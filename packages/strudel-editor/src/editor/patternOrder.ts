import type { StrudelExample } from './types'

/**
 * The stored pattern order, ignoring anything that is not a list of ids.
 * @param storedText - the stored JSON, or null when nothing is stored
 * @returns the pattern ids in the stored order
 */
export const readStoredPatternOrder = (storedText: string | null): string[] => {
  if (storedText === null) {
    return []
  }
  try {
    const parsed: unknown = JSON.parse(storedText)
    return Array.isArray(parsed)
      ? parsed.filter((patternId): patternId is string => typeof patternId === 'string')
      : []
  } catch {
    return []
  }
}

/**
 * The patterns in the order kept between visits, with anything not stored yet after them.
 * @param patterns - the patterns to sort
 * @param storedOrder - the pattern ids in the order the player dragged them into
 * @returns the patterns in that order, then the rest in the order they came
 */
export const sortPatternsByStoredOrder = (
  patterns: StrudelExample[],
  storedOrder: string[]
): StrudelExample[] => {
  const patternsById = new Map(patterns.map((pattern) => [pattern.id, pattern]))
  const storedPatterns = storedOrder.flatMap((patternId) => {
    const pattern = patternsById.get(patternId)
    return pattern === undefined ? [] : [pattern]
  })
  const storedIds = new Set(storedPatterns.map((pattern) => pattern.id))
  return [...storedPatterns, ...patterns.filter((pattern) => !storedIds.has(pattern.id))]
}

/**
 * The dragged pattern placed just before another, as a list of ids.
 * @param patternIds - the ids in the order they are shown
 * @param draggedPatternId - the id being moved
 * @param targetPatternId - the id it is dropped on
 * @returns the new order, or the same order when one of the ids is missing
 */
export const movePatternBefore = (
  patternIds: string[],
  draggedPatternId: string,
  targetPatternId: string
): string[] => {
  if (draggedPatternId === targetPatternId) {
    return patternIds
  }
  const remainingIds = patternIds.filter((patternId) => patternId !== draggedPatternId)
  const targetIndex = remainingIds.indexOf(targetPatternId)
  if (targetIndex < 0 || remainingIds.length === patternIds.length) {
    return patternIds
  }
  return [
    ...remainingIds.slice(0, targetIndex),
    draggedPatternId,
    ...remainingIds.slice(targetIndex)
  ]
}

/**
 * The dragged pattern placed just after another, as a list of ids.
 * @param patternIds - the ids in the order they are shown
 * @param draggedPatternId - the id being moved
 * @param targetPatternId - the id it is dropped on
 * @returns the new order, or the same order when one of the ids is missing
 */
export const movePatternAfter = (
  patternIds: string[],
  draggedPatternId: string,
  targetPatternId: string
): string[] => {
  if (draggedPatternId === targetPatternId) {
    return patternIds
  }
  const remainingIds = patternIds.filter((patternId) => patternId !== draggedPatternId)
  const targetIndex = remainingIds.indexOf(targetPatternId)
  if (targetIndex < 0 || remainingIds.length === patternIds.length) {
    return patternIds
  }
  return [
    ...remainingIds.slice(0, targetIndex + 1),
    draggedPatternId,
    ...remainingIds.slice(targetIndex + 1)
  ]
}
