import { STRUDEL_FLOW_NOTE_GRID_STEPS_PER_BEAT } from './config'
import { readStrudelFlowMidiNote } from './noteValues'
import type { StrudelFlowNoteBar } from './types'

const REST = '~'

// A grid is bars of steps, and a step is the pitches struck on it.
const emptyStepsOf = (stepsPerBar: number): string[][] =>
  Array.from({ length: stepsPerBar }, () => [])

const stepsPerBarOf = (beatsPerBar: number): number =>
  Math.round(beatsPerBar * STRUDEL_FLOW_NOTE_GRID_STEPS_PER_BEAT)

/**
 * Places each note on the step it starts. A note off the grid snaps to the nearest step, and its
 * length is not kept: the grid only knows where notes start.
 * @param bars - the bars Strudel read from the pattern
 * @param beatsPerBar - how many beats a bar holds
 * @returns one list of steps per bar, each step holding the pitches struck on it
 */
export const readStrudelFlowNoteGrid = (
  bars: StrudelFlowNoteBar[],
  beatsPerBar: number
): string[][][] => {
  const stepsPerBar = stepsPerBarOf(beatsPerBar)
  return bars.map((bar) =>
    bar.reduce<string[][]>((steps, event) => {
      const stepIndex = Math.min(
        stepsPerBar - 1,
        Math.round(event.start * STRUDEL_FLOW_NOTE_GRID_STEPS_PER_BEAT)
      )
      return steps.map((pitches, index) =>
        index === stepIndex ? [...new Set([...pitches, ...event.notes])] : pitches
      )
    }, emptyStepsOf(stepsPerBar))
  )
}

const midiOrFloor = (pitch: string): number =>
  readStrudelFlowMidiNote(pitch) ?? Number.NEGATIVE_INFINITY

/**
 * The pitches a grid plays, one row each.
 * @param grid - the grid's bars
 * @returns every pitch once, highest first
 */
export const readStrudelFlowNoteGridPitches = (grid: string[][][]): string[] =>
  [...new Set(grid.flat(2))].sort((first, second) => midiOrFloor(second) - midiOrFloor(first))

/**
 * Plays a pitch on a step, or stops it when it already plays there.
 * @param grid - the grid's bars
 * @param barIndex - the bar the step is in
 * @param stepIndex - the step within the bar
 * @param pitch - the pitch to switch
 * @returns the grid with that cell switched
 */
export const toggleStrudelFlowNoteGridStep = (
  grid: string[][][],
  barIndex: number,
  stepIndex: number,
  pitch: string
): string[][][] =>
  grid.map((bar, currentBar) =>
    currentBar !== barIndex
      ? bar
      : bar.map((pitches, currentStep) =>
          currentStep !== stepIndex
            ? pitches
            : pitches.includes(pitch)
              ? pitches.filter((playing) => playing !== pitch)
              : [...pitches, pitch]
        )
  )

const writeStep = (pitches: string[]): string =>
  pitches.length === 0 ? REST : pitches.length === 1 ? pitches[0] : `[${pitches.join(',')}]`

const writeBar = (bar: string[][]): string =>
  bar.every((pitches) => pitches.length === 0) ? REST : bar.map(writeStep).join(' ')

/**
 * Writes a grid as mini notation, a bar being one cycle.
 * @param grid - the grid's bars
 * @returns the pattern: the bar itself for one bar, `<...>` of bars for several
 */
export const writeStrudelFlowNoteGrid = (grid: string[][][]): string => {
  const bars = grid.map(writeBar)
  return bars.length === 1
    ? bars[0]
    : `<${bars.map((bar) => (bar === REST ? bar : `[${bar}]`)).join(' ')}>`
}

/**
 * Gives a grid more or fewer bars.
 * @param grid - the grid's bars
 * @param barCount - how many bars it should have
 * @returns the grid cut at that many bars, or padded with silent ones
 */
export const resizeStrudelFlowNoteGrid = (grid: string[][][], barCount: number): string[][][] =>
  Array.from(
    { length: barCount },
    (_, barIndex) => grid[barIndex] ?? emptyStepsOf(grid[0]?.length ?? 0)
  )

/**
 * Plays another pitch wherever one played.
 * @param grid - the grid's bars
 * @param pitch - the pitch to replace
 * @param renamed - the pitch to play instead
 * @returns the grid with the pitch replaced, never doubled on one step
 */
export const renameStrudelFlowNoteGridPitch = (
  grid: string[][][],
  pitch: string,
  renamed: string
): string[][][] =>
  grid.map((bar) =>
    bar.map((pitches) => [
      ...new Set(pitches.map((playing) => (playing === pitch ? renamed : playing)))
    ])
  )
