import { describe, expect, it } from 'vitest'
import { groupHapsIntoLanes } from './timelineLanes'

describe('groupHapsIntoLanes', () => {
  it('puts each sound in its own lane, in order of first play', () => {
    // Arrange
    const haps = [
      { value: { s: 'bd' }, beginCycle: 0, durationCycles: 0.25 },
      { value: { s: 'hh' }, beginCycle: 0.25, durationCycles: 0.25 },
      { value: { s: 'bd' }, beginCycle: 1, durationCycles: 0.25 }
    ]

    // Act
    const lanes = groupHapsIntoLanes(haps)

    // Assert
    expect(lanes.map((lane) => lane.name)).toEqual(['bd', 'hh'])
    expect(lanes[0]?.notes).toEqual([
      { beginCycle: 0, durationCycles: 0.25 },
      { beginCycle: 1, durationCycles: 0.25 }
    ])
  })

  it('names a note without a sound after the generic lane', () => {
    // Act
    const lanes = groupHapsIntoLanes([{ value: { note: 'c3' }, beginCycle: 0, durationCycles: 1 }])

    // Assert
    expect(lanes.map((lane) => lane.name)).toEqual(['notes'])
  })
})
