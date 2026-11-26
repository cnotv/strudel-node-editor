import { describe, expect, it } from 'vitest'
import { findVariableLanes } from './findVariableLanes'
import type { StrudelTimelineLane } from '../types'

const buildLane = (name: string, from: number, to: number): StrudelTimelineLane => ({
  name,
  sound: name,
  notes: [],
  sourceRanges: [{ from, to }]
})

const code = [
  'const stab = s("triangle")',
  'const lead = s("supersaw")',
  'const mix = stack(',
  '  lead.gain(.3),',
  '  stab',
  ')'
].join('\n')

const triangleLane = buildLane('triangle', code.indexOf('triangle'), code.indexOf('triangle') + 8)
const supersawLane = buildLane('supersaw', code.indexOf('supersaw'), code.indexOf('supersaw') + 8)

describe('findVariableLanes', () => {
  it('finds the lane whose code the variable defines', () => {
    // Arrange
    const lanes = [triangleLane, supersawLane]

    // Act
    const names = findVariableLanes(code, code.indexOf('stab') + 1, lanes)

    // Assert
    expect(names).toEqual(['triangle'])
  })

  it('follows the variables a stack is built from', () => {
    // Arrange
    const lanes = [triangleLane, supersawLane]

    // Act
    const names = findVariableLanes(code, code.lastIndexOf('mix'), lanes)

    // Assert
    expect(names).toEqual(['triangle', 'supersaw'])
  })

  it('finds nothing for a word that is not a defined variable', () => {
    // Act
    const names = findVariableLanes(code, code.indexOf('stack') + 1, [triangleLane])

    // Assert
    expect(names).toEqual([])
  })
})
