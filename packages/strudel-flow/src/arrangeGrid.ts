import type { StrudelFlowNode } from './types'

const SILENCE = 'silence'
const SILENT_PATTERNS = new Set([SILENCE, '~', ''])

/** A cycle that plays no part. */
export const STRUDEL_FLOW_ARRANGE_SILENT = -1

/**
 * Whether a section of an arrange call plays nothing.
 * @param pattern - a section's pattern code
 * @returns true for `silence`, `~` or an empty pattern
 */
export const isStrudelFlowArrangeSilent = (pattern: string): boolean =>
  SILENT_PATTERNS.has(pattern.trim())

/**
 * Reads the sections of an arrange call as a part for every cycle.
 * @param sections - each section's cycle count and pattern code
 * @returns the parts in order of first appearance, and for each cycle the part that plays
 */
export const readStrudelFlowArrangeSequence = (
  sections: { cycles: number; pattern: string }[]
): { parts: string[]; sequence: number[] } => {
  const parts = [
    ...new Set(
      sections
        .filter(({ pattern }) => !isStrudelFlowArrangeSilent(pattern))
        .map(({ pattern }) => pattern.trim())
    )
  ]
  return {
    parts,
    sequence: sections.flatMap(({ cycles, pattern }) =>
      Array.from({ length: cycles }, () =>
        isStrudelFlowArrangeSilent(pattern)
          ? STRUDEL_FLOW_ARRANGE_SILENT
          : parts.indexOf(pattern.trim())
      )
    )
  }
}

/**
 * Joins runs of cycles that play the same part into sections.
 * @param sequence - the part playing in each cycle
 * @returns the fewest sections that play the same cycles
 */
export const compressStrudelFlowArrange = (
  sequence: number[]
): { cycles: number; part: number }[] =>
  sequence.reduce<{ cycles: number; part: number }[]>((sections, part) => {
    const last = sections.at(-1)
    return last?.part === part
      ? [...sections.slice(0, -1), { ...last, cycles: last.cycles + 1 }]
      : [...sections, { cycles: 1, part }]
  }, [])

/**
 * Plays a part in a cycle, or stops it when it already plays there.
 * @param sequence - the part playing in each cycle
 * @param part - the part to switch
 * @param cycle - the cycle to switch it in
 * @returns the sequence with that cycle changed
 */
export const toggleStrudelFlowArrangeCycle = (
  sequence: number[],
  part: number,
  cycle: number
): number[] =>
  sequence.map((playing, index) =>
    index === cycle ? (playing === part ? STRUDEL_FLOW_ARRANGE_SILENT : part) : playing
  )

/**
 * Gives an arrangement more or fewer cycles.
 * @param sequence - the part playing in each cycle
 * @param length - how many cycles it should span
 * @returns the sequence cut at that length, or padded with silent cycles
 */
export const resizeStrudelFlowArrange = (sequence: number[], length: number): number[] =>
  Array.from({ length }, (_, cycle) => sequence[cycle] ?? STRUDEL_FLOW_ARRANGE_SILENT)

/**
 * Writes an arrangement as an `arrange(...)` call.
 * @param sequence - the part playing in each cycle
 * @param partPatterns - the code of each part, in cable order
 * @returns the call, or `silence` when no cycle plays a part that exists
 */
export const writeStrudelFlowArrange = (sequence: number[], partPatterns: string[]): string => {
  const sections = compressStrudelFlowArrange(sequence).map(
    ({ cycles, part }) => `[${cycles}, ${partPatterns[part] ?? SILENCE}]`
  )
  return sections.every((section) => section.endsWith(`${SILENCE}]`))
    ? SILENCE
    : `arrange(${sections.join(', ')})`
}

const comparePosition = (first: StrudelFlowNode, second: StrudelFlowNode): number =>
  first.position.y - second.position.y || first.position.x - second.position.x

/**
 * Puts the nodes feeding an arrangement in part order: top to bottom, then left to right.
 * @param sources - the nodes cabled into the Arrange node
 * @returns the same nodes, one per part
 */
export const orderStrudelFlowArrangeParts = (sources: StrudelFlowNode[]): StrudelFlowNode[] =>
  [...sources].sort(comparePosition)
