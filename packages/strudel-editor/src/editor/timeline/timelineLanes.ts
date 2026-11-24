import type { StrudelScheduledHap, StrudelTimelineLane } from '../types'

const UNNAMED_LANE = 'notes'

const readLaneName = (hap: StrudelScheduledHap): string => {
  const value = hap.value
  if (typeof value === 'object' && value !== null && 's' in value && typeof value.s === 'string') {
    return value.s
  }
  return UNNAMED_LANE
}

/**
 * Sorts events into one lane per instrument, named by the sound the event plays.
 * @param haps - the events that start inside the measured cycles
 * @returns the lanes in the order their instrument first plays
 */
export const groupHapsIntoLanes = (haps: StrudelScheduledHap[]): StrudelTimelineLane[] =>
  haps.reduce<StrudelTimelineLane[]>((lanes, hap) => {
    const name = readLaneName(hap)
    const note = { beginCycle: hap.beginCycle, durationCycles: hap.durationCycles }
    const existing = lanes.find((lane) => lane.name === name)
    return existing === undefined
      ? [...lanes, { name, notes: [note] }]
      : lanes.map((lane) => (lane === existing ? { ...lane, notes: [...lane.notes, note] } : lane))
  }, [])
