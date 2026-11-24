import { describe, expect, it } from 'vitest'
import { groupHapsIntoLanes } from './timelineLanes'

describe('groupHapsIntoLanes', () => {
  it('puts each sound in its own lane, in order of first play', () => {
    // Arrange
    const haps = [
      { value: { s: 'bd' }, beginCycle: 0, durationCycles: 0.25, sourceRanges: [] },
      { value: { s: 'hh' }, beginCycle: 0.25, durationCycles: 0.25, sourceRanges: [] },
      { value: { s: 'bd' }, beginCycle: 1, durationCycles: 0.25, sourceRanges: [] }
    ]

    // Act
    const lanes = groupHapsIntoLanes(haps)

    // Assert
    expect(lanes.map((lane) => lane.name)).toEqual(['bd', 'hh'])
    expect(lanes[0]?.notes).toEqual([
      { beginCycle: 0, durationCycles: 0.25, sourceRanges: [] },
      { beginCycle: 1, durationCycles: 0.25, sourceRanges: [] }
    ])
  })

  it('names a note without a sound after the generic lane', () => {
    // Act
    const lanes = groupHapsIntoLanes([
      { value: { note: 'c3' }, beginCycle: 0, durationCycles: 1, sourceRanges: [] }
    ])

    // Assert
    expect(lanes.map((lane) => lane.name)).toEqual(['notes'])
  })

  it('points the lane at where its instrument is first defined', () => {
    // Arrange
    const haps = [
      {
        value: { s: 'bd' },
        beginCycle: 0,
        durationCycles: 1,
        sourceRanges: [{ from: 10, to: 14 }]
      },
      { value: { s: 'bd' }, beginCycle: 1, durationCycles: 1, sourceRanges: [{ from: 40, to: 46 }] }
    ]

    // Act
    const lanes = groupHapsIntoLanes(haps)

    // Assert
    expect(lanes[0]?.sourceRanges).toEqual([{ from: 10, to: 14 }])
  })
})
