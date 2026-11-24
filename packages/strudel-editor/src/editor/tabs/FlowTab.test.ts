import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { createStrudelApiFunctionData, findStrudelApiEntry } from '../strudelApiCatalog'
import type { StrudelApiEntry } from '../types'
import FlowTab from './FlowTab.vue'

const mountFlowTab = () => mount(FlowTab)

const searchFunctions = async (wrapper: VueWrapper, query: string): Promise<void> => {
  await wrapper.find('input[aria-label="Search functions"]').setValue(query)
}

const expectedFunctionData = (name: string) => {
  const entry = findStrudelApiEntry(name)
  if (entry === null) {
    throw new Error(`${name} is not in the catalog`)
  }
  return createStrudelApiFunctionData(entry)
}

describe('FlowTab', () => {
  it('lists every function under a collapsed heading', () => {
    // Arrange / Act
    const wrapper = mountFlowTab()
    const groupTitles = wrapper
      .findAll('.strudel-flow-tab__group-title')
      .map((title) => title.text())
    const groups = wrapper.findAll('details.strudel-flow-tab__group')

    // Assert
    expect(groupTitles[0]).toBe('Start here')
    expect(groupTitles).toContain('Instruments & sources')
    expect(groups).toHaveLength(13)
    expect(groups.every((group) => group.attributes('open') === undefined)).toBe(true)
    expect(wrapper.findAll('.strudel-flow-tab__function-name')).toHaveLength(408)
  })

  it('keeps the function palette as the only list', () => {
    // Arrange / Act
    const wrapper = mountFlowTab()

    // Assert
    expect(wrapper.text()).not.toContain('Add instrument, effect and sound nodes')
    expect(wrapper.find('.strudel-flow-tab__item').exists()).toBe(false)
    expect(wrapper.findAll('button').some((button) => button.text() === 'Nodes')).toBe(false)
  })

  it('asks for a generic function node when its Add button is pressed', async () => {
    // Arrange
    const wrapper = mountFlowTab()
    await searchFunctions(wrapper, 'lpf')

    // Act
    await wrapper.find('button[aria-label="Add lpf function"]').trigger('click')

    // Assert
    expect(wrapper.emitted('addNode')).toEqual([['function', expectedFunctionData('lpf')]])
  })

  it('opens the groups a search matches', async () => {
    // Arrange
    const wrapper = mountFlowTab()

    // Act
    await searchFunctions(wrapper, 'reverb')

    // Assert
    expect(wrapper.findAll('details.strudel-flow-tab__group').length).toBeGreaterThan(0)
    expect(
      wrapper
        .findAll('details.strudel-flow-tab__group')
        .every((group) => group.attributes('open') !== undefined)
    ).toBe(true)
  })

  it('finds s when searching for its synonym sound', async () => {
    // Arrange
    const wrapper = mountFlowTab()

    // Act
    await searchFunctions(wrapper, 'sound')

    // Assert
    expect(
      wrapper.findAll('.strudel-flow-tab__function-name').map((name) => name.text())
    ).toContain('s')
  })

  it('shows an empty state for a nonsense search', async () => {
    // Arrange
    const wrapper = mountFlowTab()

    // Act
    await searchFunctions(wrapper, 'zzzzzz')

    // Assert
    expect(wrapper.find('.strudel-flow-tab__empty').text()).toContain('No function matches')
    expect(wrapper.findAll('.strudel-flow-tab__function').length).toBe(0)
  })

  it('links each function to its docs page', async () => {
    // Arrange
    const wrapper = mountFlowTab()
    const entry: StrudelApiEntry | null = findStrudelApiEntry('lpf')
    await searchFunctions(wrapper, 'lpf')

    // Act
    const link = wrapper
      .findAll('.strudel-flow-tab__function')
      .find((row) => row.find('.strudel-flow-tab__function-name').text() === 'lpf')!
      .find('.strudel-flow-tab__function-docs')

    // Assert
    expect(entry).not.toBeNull()
    expect(link.attributes('href')).toBe(entry?.docsUrl)
  })

  it('adds a start-here function', async () => {
    // Arrange
    const wrapper = mountFlowTab()

    // Act
    await wrapper
      .find('.strudel-flow-tab__start-list button[aria-label="Add s function"]')
      .trigger('click')

    // Assert
    expect(wrapper.emitted('addNode')).toEqual([['function', expectedFunctionData('s')]])
  })

  it('asks for the patch to be cleared when Reset is pressed', async () => {
    // Arrange
    const wrapper = mountFlowTab()

    // Act
    await wrapper.find('.strudel-flow-tab__reset').trigger('click')

    // Assert
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })
})
