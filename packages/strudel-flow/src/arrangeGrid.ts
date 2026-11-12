import type { StrudelFlowArrangeSection } from './types'

const SILENCE = 'silence'
const SILENT_PATTERNS = new Set([SILENCE, '~', ''])

/**
 * Whether a section plays nothing.
 * @param pattern - a section's pattern code
 * @returns true for `silence`, `~` or an empty pattern
 */
export const isStrudelFlowArrangeSilent = (pattern: string): boolean =>
  SILENT_PATTERNS.has(pattern.trim())

const cycleOf = (pattern: string): string =>
  isStrudelFlowArrangeSilent(pattern) ? SILENCE : pattern.trim()

/**
 * The pattern playing in each cycle, one entry per cycle, in order.
 * @param sections - the arrangement's sections
 * @returns each cycle's pattern, `silence` where nothing plays
 */
export const expandStrudelFlowArrange = (sections: StrudelFlowArrangeSection[]): string[] =>
  sections.flatMap(({ cycles, pattern }) => Array.from({ length: cycles }, () => cycleOf(pattern)))

/**
 * Joins runs of cycles that play the same pattern back into sections.
 * @param cycles - each cycle's pattern
 * @returns the fewest sections that play the same cycles
 */
export const compressStrudelFlowArrange = (cycles: string[]): StrudelFlowArrangeSection[] =>
  cycles.reduce<StrudelFlowArrangeSection[]>((sections, pattern) => {
    const last = sections.at(-1)
    return last?.pattern === pattern
      ? [...sections.slice(0, -1), { ...last, cycles: last.cycles + 1 }]
      : [...sections, { cycles: 1, pattern }]
  }, [])

/**
 * The parts an arrangement plays, one grid row each, in order of first appearance.
 * @param sections - the arrangement's sections
 * @returns each distinct pattern that is not silence
 */
export const readStrudelFlowArrangeRows = (sections: StrudelFlowArrangeSection[]): string[] =>
  [...new Set(expandStrudelFlowArrange(sections))].filter(
    (pattern) => !isStrudelFlowArrangeSilent(pattern)
  )

/**
 * Plays a part in a cycle, or silences the cycle when that part already plays there.
 * @param sections - the arrangement's sections
 * @param pattern - the part of the clicked row
 * @param cycle - the clicked cycle, from zero
 * @returns the sections after the click
 */
export const toggleStrudelFlowArrangeCycle = (
  sections: StrudelFlowArrangeSection[],
  pattern: string,
  cycle: number
): StrudelFlowArrangeSection[] =>
  compressStrudelFlowArrange(
    expandStrudelFlowArrange(sections).map((playing, index) => {
      if (index !== cycle) {
        return playing
      }
      return playing === pattern ? SILENCE : pattern
    })
  )

/**
 * Cuts or extends an arrangement to a length; added cycles are silent.
 * @param sections - the arrangement's sections
 * @param length - the cycles it should span
 * @returns the sections over exactly that many cycles
 */
export const resizeStrudelFlowArrange = (
  sections: StrudelFlowArrangeSection[],
  length: number
): StrudelFlowArrangeSection[] => {
  const cycles = expandStrudelFlowArrange(sections)
  return compressStrudelFlowArrange(Array.from({ length }, (_, index) => cycles[index] ?? SILENCE))
}

/**
 * Plays another pattern wherever a part played.
 * @param sections - the arrangement's sections
 * @param from - the part's current pattern
 * @param to - the pattern to play instead
 * @returns the sections after the rename
 */
export const renameStrudelFlowArrangeRow = (
  sections: StrudelFlowArrangeSection[],
  from: string,
  to: string
): StrudelFlowArrangeSection[] =>
  compressStrudelFlowArrange(
    expandStrudelFlowArrange(sections).map((playing) => (playing === from ? cycleOf(to) : playing))
  )
