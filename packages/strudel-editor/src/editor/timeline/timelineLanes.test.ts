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
    const lanes = groupHapsIntoLanes(haps, '')

    // Assert
    expect(lanes.map((lane) => lane.name)).toEqual(['bd', 'hh'])
    expect(lanes[0]?.notes).toEqual([
      { beginCycle: 0, durationCycles: 0.25, sourceRanges: [] },
      { beginCycle: 1, durationCycles: 0.25, sourceRanges: [] }
    ])
  })

  it('numbers the lanes of one sound played by different layers of code', () => {
    // Arrange
    const haps = [
      {
        value: { s: 'sawtooth' },
        beginCycle: 0,
        durationCycles: 1,
        sourceRanges: [{ from: 1, to: 5 }]
      },
      {
        value: { s: 'sawtooth' },
        beginCycle: 0,
        durationCycles: 1,
        sourceRanges: [{ from: 20, to: 25 }]
      },
      {
        value: { s: 'sawtooth' },
        beginCycle: 1,
        durationCycles: 1,
        sourceRanges: [{ from: 1, to: 5 }]
      }
    ]

    // Act
    const lanes = groupHapsIntoLanes(haps, '')

    // Assert
    expect(lanes.map((lane) => lane.name)).toEqual(['sawtooth', 'sawtooth 2'])
    expect(lanes.map((lane) => lane.sound)).toEqual(['sawtooth', 'sawtooth'])
    expect(lanes[0]?.notes.map((note) => note.beginCycle)).toEqual([0, 1])
    expect(lanes[1]?.sourceRanges).toEqual([{ from: 20, to: 25 }])
  })

  it('names a note without a sound after the generic lane', () => {
    // Act
    const lanes = groupHapsIntoLanes(
      [{ value: { note: 'c3' }, beginCycle: 0, durationCycles: 1, sourceRanges: [] }],
      ''
    )

    // Assert
    expect(lanes.map((lane) => lane.name)).toEqual(['notes'])
  })

  it('keeps the notes of one string in one lane, though each has its own span', () => {
    // Arrange
    const code = 'note("e1 g1 a1").s("sawtooth")'
    const haps = [0, 1, 2].map((index) => ({
      value: { s: 'sawtooth' },
      beginCycle: index,
      durationCycles: 1,
      sourceRanges: [{ from: 6 + index * 3, to: 8 + index * 3 }]
    }))

    // Act
    const lanes = groupHapsIntoLanes(haps, code)

    // Assert
    expect(lanes.map((lane) => lane.name)).toEqual(['sawtooth'])
    expect(lanes[0]?.notes).toHaveLength(3)
  })

  it('points each lane of a shared definition at the string only its layer owns', () => {
    // Arrange
    const code = [
      'const fuzz = p => p.s("sawtooth")',
      'stack(fuzz(note("e1 g1")), fuzz(note("e2 g2")))'
    ].join('\n')
    const definition = { from: code.indexOf('sawtooth'), to: code.indexOf('sawtooth') + 8 }
    const first = { from: code.indexOf('e1'), to: code.indexOf('e1') + 2 }
    const second = { from: code.indexOf('e2'), to: code.indexOf('e2') + 2 }
    const haps = [first, second].map((own) => ({
      value: { s: 'sawtooth' },
      beginCycle: 0,
      durationCycles: 1,
      sourceRanges: [definition, own]
    }))

    // Act
    const lanes = groupHapsIntoLanes(haps, code)

    // Assert
    const literalOf = (range: { from: number; to: number } | undefined): string =>
      range === undefined ? '' : code.slice(range.from, range.to)
    expect(lanes.map((lane) => lane.sourceRanges.map(literalOf))).toEqual([
      ['"e1 g1"'],
      ['"e2 g2"']
    ])
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
    const lanes = groupHapsIntoLanes(haps, '')

    // Assert
    expect(lanes[0]?.sourceRanges).toEqual([{ from: 10, to: 14 }])
  })
})
