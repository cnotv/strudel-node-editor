import type { StrudelScheduledHap, StrudelTimelineLane } from '../types'

const UNNAMED_LANE = 'notes'
// Float rounding must not turn a note that starts exactly as another ends into an overlap.
const OVERLAP_TOLERANCE = 1e-6

const readLaneName = (hap: StrudelScheduledHap): string => {
  const value = hap.value
  if (
    typeof value === 'object' &&
    value !== null &&
    's' in value &&
    typeof value.s === 'string' &&
    value.s !== ''
  ) {
    return value.s
  }
  return UNNAMED_LANE
}

// Each note takes the first row whose last note has already ended, so layers that play
// together stay apart instead of merging into one solid bar.
const placeOnRows = (haps: StrudelScheduledHap[]): number[] => {
  const ordered = haps
    .map((hap, index) => ({ hap, index }))
    .sort((a, b) => a.hap.beginCycle - b.hap.beginCycle)
  const rowEnds = ordered.reduce<{ rowEnds: number[]; rows: number[] }>(
    (state, { hap, index }) => {
      const freeRow = state.rowEnds.findIndex((end) => end <= hap.beginCycle + OVERLAP_TOLERANCE)
      const row = freeRow === -1 ? state.rowEnds.length : freeRow
      const nextEnds = Object.assign([...state.rowEnds], {
        [row]: hap.beginCycle + hap.durationCycles
      })
      return { rowEnds: nextEnds, rows: Object.assign([...state.rows], { [index]: row }) }
    },
    { rowEnds: [], rows: [] }
  )
  return rowEnds.rows
}

const laneKey = (name: string, row: number): string => (row === 0 ? name : `${name} ${row + 1}`)

/**
 * Sorts events into one lane per instrument, named by the sound the event plays. Events of
 * the same sound that play together go to further lanes, numbered `sawtooth 2`, `sawtooth 3`.
 * @param haps - the events that start inside the measured cycles
 * @returns the lanes in the order their instrument first plays
 */
export const groupHapsIntoLanes = (haps: StrudelScheduledHap[]): StrudelTimelineLane[] => {
  const hapsBySound = haps.reduce<Map<string, StrudelScheduledHap[]>>(
    (bySound, hap) =>
      bySound.set(readLaneName(hap), [...(bySound.get(readLaneName(hap)) ?? []), hap]),
    new Map()
  )
  const placed = Array.from(hapsBySound, ([sound, soundHaps]) => {
    const rows = placeOnRows(soundHaps)
    return soundHaps.map((hap, index) => ({ hap, name: laneKey(sound, rows[index] ?? 0) }))
  }).flat()
  const ordered = placed.sort((a, b) => haps.indexOf(a.hap) - haps.indexOf(b.hap))
  const lanes = ordered.reduce<Map<string, StrudelTimelineLane>>((byName, { hap, name }) => {
    const note = {
      beginCycle: hap.beginCycle,
      durationCycles: hap.durationCycles,
      sourceRanges: hap.sourceRanges
    }
    const lane = byName.get(name)
    return byName.set(
      name,
      lane === undefined
        ? { name, notes: [note], sourceRanges: hap.sourceRanges }
        : { ...lane, notes: [...lane.notes, note] }
    )
  }, new Map())
  return [...lanes.values()]
}
