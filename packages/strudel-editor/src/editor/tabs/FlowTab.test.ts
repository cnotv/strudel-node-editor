import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { findStrudelApiEntry } from '../strudelApiCatalog'
import FlowTab from './FlowTab.vue'

const mountFlowTab = () => mount(FlowTab)

const findButton = (wrapper: VueWrapper, label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label)

const switchView = async (wrapper: VueWrapper, label: 'Nodes' | 'Functions'): Promise<void> => {
  await findButton(wrapper, label)?.trigger('click')
}

const searchFunctions = async (wrapper: VueWrapper, query: string): Promise<void> => {
  await wrapper.find('input[aria-label="Search functions"]').setValue(query)
}

const mockClipboard = (writeText: ReturnType<typeof vi.fn>): void => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
}

describe('FlowTab', () => {
  it('lists every instrument, effect and sound node under its category', () => {
    // Arrange
    const wrapper = mountFlowTab()

    // Act
    const groupTitles = wrapper
      .findAll('.strudel-flow-tab__group-title')
      .map((title) => title.text())
    const itemTitles = wrapper.findAll('.strudel-flow-tab__item-title').map((title) => title.text())

    // Assert
    expect(groupTitles).toEqual(['Instruments', 'Effects', 'Sounds'])
    expect(itemTitles).toEqual([
      'Pad',
      'Beats',
      'Chords',
      'Notes',
      'Samples',
      'Code',
      'Arrange',
      'Filter',
      'Delay',
      'Space',
      'Gain',
      'Level',
      'Mask',
      'Struct',
      'Slow',
      'Voicing',
      'Envelope',
      'Visualizer',
      'Effect',
      'Voice'
    ])
  })

  it('asks for a node when its Add button is pressed', async () => {
    // Arrange
    const wrapper = mountFlowTab()

    // Act
    await wrapper.find('button[aria-label="Add Beats node"]').trigger('click')

    // Assert
    expect(wrapper.emitted('addNode')).toEqual([['beats']])
  })

  it('does not duplicate the generated code in the side panel', () => {
    // Arrange / Act
    const wrapper = mountFlowTab()

    // Assert
    expect(wrapper.text()).not.toContain('Generated code')
    expect(wrapper.find('pre').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('asks for the starter patch when Reset is pressed', async () => {
    // Arrange
    const wrapper = mountFlowTab()

    // Act
    await wrapper.find('.strudel-flow-tab__reset').trigger('click')

    // Assert
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })

  it('credits Strudel Flow by xyflow with links to the app, its makers and its source', () => {
    // Arrange / Act
    const wrapper = mountFlowTab()

    // Assert
    const links = wrapper
      .findAll('.strudel-flow-tab__credit a')
      .map((link) => link.attributes('href'))
    expect(links).toEqual([
      'https://xyflow.com/strudel-flow',
      'https://xyflow.com',
      'https://github.com/xyflow/strudel-flow'
    ])
  })

  it('keeps the node list when switching to functions and back', async () => {
    // Arrange
    const wrapper = mountFlowTab()
    const nodeTitles = wrapper.findAll('.strudel-flow-tab__item-title').map((title) => title.text())

    // Act
    await switchView(wrapper, 'Functions')
    await switchView(wrapper, 'Nodes')

    // Assert
    expect(wrapper.findAll('.strudel-flow-tab__item-title').map((title) => title.text())).toEqual(
      nodeTitles
    )
  })

  it('lists functions in groups with their counts and start-here shortcuts', async () => {
    // Arrange
    const wrapper = mountFlowTab()

    // Act
    await switchView(wrapper, 'Functions')

    // Assert
    const groupTitles = wrapper
      .findAll('.strudel-flow-tab__group-title')
      .map((title) => title.text())
    expect(groupTitles[0]).toContain('Start here')
    expect(groupTitles[1]).toContain('Instruments & sources')
    expect(groupTitles[1]).toContain('32')
    expect(wrapper.findAll('.strudel-flow-tab__function-name').length).toBe(408)
  })

  it('finds s when searching for its synonym sound', async () => {
    // Arrange
    const wrapper = mountFlowTab()
    await switchView(wrapper, 'Functions')

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
    await switchView(wrapper, 'Functions')

    // Act
    await searchFunctions(wrapper, 'zzzzzz')

    // Assert
    expect(wrapper.find('.strudel-flow-tab__empty').text()).toContain('No function matches')
    expect(wrapper.findAll('.strudel-flow-tab__function').length).toBe(0)
  })

  it('adds the mapped node kind for a function a node covers', async () => {
    // Arrange
    const wrapper = mountFlowTab()
    await switchView(wrapper, 'Functions')
    await searchFunctions(wrapper, 'lpf')

    // Act
    await wrapper.find('button[aria-label="Add lpf as Filter"]').trigger('click')

    // Assert
    expect(wrapper.emitted('addNode')).toEqual([['filter']])
  })

  it('adds a Code node holding the documented example for an unmapped function', async () => {
    // Arrange
    const wrapper = mountFlowTab()
    const stackExample = findStrudelApiEntry('stack')?.examples[0]
    await switchView(wrapper, 'Functions')
    await searchFunctions(wrapper, 'stack')

    // Act
    await wrapper.find('button[aria-label="Add stack as Code"]').trigger('click')

    // Assert
    expect(wrapper.emitted('addNode')).toEqual([['code', { kind: 'code', code: stackExample }]])
  })

  it('copies a function example', async () => {
    // Arrange
    const writeText = vi.fn().mockResolvedValue(undefined)
    mockClipboard(writeText)
    const wrapper = mountFlowTab()
    const stackExample = findStrudelApiEntry('stack')?.examples[0] ?? ''
    await switchView(wrapper, 'Functions')
    await searchFunctions(wrapper, 'stack')

    // Act
    await wrapper.find('button[aria-label="Copy stack example"]').trigger('click')
    await flushPromises()

    // Assert
    expect(writeText).toHaveBeenCalledWith(stackExample)
  })

  it('adds a start-here function', async () => {
    // Arrange
    const wrapper = mountFlowTab()
    await switchView(wrapper, 'Functions')

    // Act
    await wrapper
      .find('.strudel-flow-tab__workshop-list button[aria-label="Add s as Samples"]')
      .trigger('click')

    // Assert
    expect(wrapper.emitted('addNode')).toEqual([['samples']])
  })
})
