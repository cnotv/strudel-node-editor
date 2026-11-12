import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StrudelFlowNoteGrid from './StrudelFlowNoteGrid.vue'
import type { StrudelFlowNoteBar } from '../../types'

const BARS: StrudelFlowNoteBar[] = [[{ notes: ['c3'], start: 0, beats: 1 }]]
const mountGrid = () => mount(StrudelFlowNoteGrid, { props: { bars: BARS, beatsPerBar: 4 } })

describe('StrudelFlowNoteGrid', () => {
  it('lights the step a note starts on', () => {
    // Arrange / Act
    const wrapper = mountGrid()

    // Assert
    const first = wrapper.find('button[aria-label="c3 bar 1 step 1"]')
    expect(first.attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('button[aria-label="c3 bar 1 step 2"]').attributes('aria-pressed')).toBe(
      'false'
    )
  })

  it('writes the pattern back when a step is switched on', async () => {
    // Arrange
    const wrapper = mountGrid()

    // Act
    await wrapper.find('button[aria-label="c3 bar 1 step 3"]').trigger('click')

    // Assert
    expect(wrapper.emitted('update:pattern')).toEqual([['c3 ~ c3 ~ ~ ~ ~ ~']])
  })

  it('adds a bar when the Bars stepper goes up', async () => {
    // Arrange
    const wrapper = mountGrid()

    // Act
    await wrapper
      .find('button[aria-label*="ncrease"], button[aria-label*="ncrement"]')
      .trigger('click')

    // Assert
    expect(wrapper.emitted('update:pattern')?.[0]).toEqual(['<[c3 ~ ~ ~ ~ ~ ~ ~] ~>'])
  })
})
