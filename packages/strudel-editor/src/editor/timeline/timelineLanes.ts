import type { StrudelScheduledHap, StrudelTimelineLane } from '../types'

const UNNAMED_LANE = 'notes'

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

const laneLabel = (sound: string, layerIndex: number): string =>
  layerIndex === 0 ? sound : `${sound} ${layerIndex + 1}`

/**
 * Sorts events into one lane per layer, named by the sound the event plays. Layers that share
 * a sound are told apart by the code they came from and numbered `sawtooth`, `sawtooth 2`,
 * so each lane selects its own code.
 * @param haps - the events that start inside the measured cycles
 * @returns the lanes in the order their layer first plays
 */
export const groupHapsIntoLanes = (haps: StrudelScheduledHap[]): StrudelTimelineLane[] => {
  const layersBySound = new Map<string, string[]>()
  const lanesByLayer = haps.reduce<Map<string, StrudelTimelineLane>>((lanes, hap) => {
    const sound = readLaneName(hap)
    const layerKey = JSON.stringify(hap.sourceRanges)
    const layers = layersBySound.get(sound) ?? []
    const layerIndex = layers.includes(layerKey) ? layers.indexOf(layerKey) : layers.length
    layersBySound.set(sound, layers.includes(layerKey) ? layers : [...layers, layerKey])
    const laneKey = `${sound}\n${layerKey}`
    const note = {
      beginCycle: hap.beginCycle,
      durationCycles: hap.durationCycles,
      sourceRanges: hap.sourceRanges
    }
    const lane = lanes.get(laneKey)
    return lanes.set(
      laneKey,
      lane === undefined
        ? {
            name: laneLabel(sound, layerIndex),
            sound,
            notes: [note],
            sourceRanges: hap.sourceRanges
          }
        : { ...lane, notes: [...lane.notes, note] }
    )
  }, new Map())
  return [...lanesByLayer.values()]
}
