import type { StrudelSourceRange } from '../types'

/**
 * Picks the span that defines an instrument out of everything an event came from: the one whose
 * text names the sound, since a mask or a control chained on adds spans of its own.
 * @param ranges - every span the event came from, the pattern it was built on first
 * @param laneName - the sound the lane is named after
 * @param code - the code the spans point into
 * @returns the span naming the sound, else the first, else null
 */
export const pickDefinitionRange = (
  ranges: StrudelSourceRange[],
  laneName: string,
  code: string
): StrudelSourceRange | null =>
  ranges.find((range) => code.slice(range.from, range.to).includes(laneName)) ?? ranges[0] ?? null
