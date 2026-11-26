import type { StrudelScheduledHap, StrudelSourceRange, StrudelTimelineLane } from '../types'

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

const STRING_LITERAL = /"(?:[^\n"\\]|\\.)*"|'(?:[^\n'\\]|\\.)*'|`(?:[^\\`]|\\.)*`/g

// Every note of a string has a span of its own, so a layer is told apart by the strings its
// notes came from, not by the notes.
const readOwners = (code: string, ranges: StrudelSourceRange[]): StrudelSourceRange[] => {
  const literals = Array.from(code.matchAll(STRING_LITERAL), (match) => ({
    from: match.index,
    to: match.index + match[0].length
  }))
  return ranges.map(
    (range) =>
      literals.find((literal) => range.from >= literal.from && range.to <= literal.to) ?? range
  )
}

const readLayerKey = (code: string, ranges: StrudelSourceRange[]): string =>
  JSON.stringify(readOwners(code, ranges).map((owner) => [owner.from, owner.to]))

const isSameRange = (first: StrudelSourceRange, second: StrudelSourceRange): boolean =>
  first.from === second.from && first.to === second.to

// A definition such as `mellowFuzz = p => p.s("sawtooth")` is shared by every layer that calls
// it; the string only one layer owns is what says which of them a lane is.
const pickOwnRanges = (
  lane: StrudelTimelineLane,
  siblings: StrudelTimelineLane[],
  code: string
): StrudelSourceRange[] => {
  const siblingOwners = siblings.map((sibling) => readOwners(code, sibling.sourceRanges))
  const ownRanges = readOwners(code, lane.sourceRanges).filter((owner) =>
    siblingOwners.some((owners) => !owners.some((other) => isSameRange(owner, other)))
  )
  return ownRanges.length === 0 ? lane.sourceRanges : ownRanges
}

const laneLabel = (sound: string, layerIndex: number): string =>
  layerIndex === 0 ? sound : `${sound} ${layerIndex + 1}`

/**
 * Sorts events into one lane per layer, named by the sound the event plays. Layers that share
 * a sound are told apart by the code they came from and numbered `sawtooth`, `sawtooth 2`,
 * so each lane selects its own code.
 * @param haps - the events that start inside the measured cycles
 * @param code - the code the events came from, to tell the layers of one sound apart
 * @returns the lanes in the order their layer first plays
 */
export const groupHapsIntoLanes = (
  haps: StrudelScheduledHap[],
  code: string
): StrudelTimelineLane[] => {
  const layersBySound = new Map<string, string[]>()
  const lanesByLayer = haps.reduce<Map<string, StrudelTimelineLane>>((lanes, hap) => {
    const sound = readLaneName(hap)
    const layerKey = readLayerKey(code, hap.sourceRanges)
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
  const lanes = [...lanesByLayer.values()]
  return lanes.map((lane) => ({
    ...lane,
    sourceRanges: pickOwnRanges(
      lane,
      lanes.filter((sibling) => sibling !== lane && sibling.sound === lane.sound),
      code
    )
  }))
}
