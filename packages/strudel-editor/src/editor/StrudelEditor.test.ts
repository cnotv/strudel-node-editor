import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import StrudelEditor from './StrudelEditor.vue'
import ExportTab from './tabs/ExportTab.vue'
import PatternLibrary from './tabs/PatternLibrary.vue'
import {
  STRUDEL_EXAMPLES,
  STRUDEL_SAVED_CODE_STORAGE_KEY,
  STRUDEL_SAVED_PATTERNS_STORAGE_KEY
} from './config'
import { ELECTRO_TUNES } from './songs'
import type { StrudelCodeMirrorOptions } from './types'

const defaultSongCode = ELECTRO_TUNES.find(({ id }) => id === 'uptown-strut')?.code ?? ''

// Vue Flow needs a real layout engine; the browser tests mount it. This stand-in proves the
// view switches between the editor and the canvas while the graph state stays in the view.
vi.mock('@webgamekit/strudel-flow', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    StrudelFlowEditor: {
      name: 'StrudelFlowEditorStub',
      template: '<div class="strudel-flow-editor-stub" />'
    }
  }
})

const { mockPreviewSound, mockEvaluateCode } = vi.hoisted(() => ({
  mockPreviewSound: vi.fn(),
  mockEvaluateCode: vi.fn(async () => ({ success: true }))
}))

// The sound library fetches manifests over the network; the browser tests load the real one.
vi.mock('./strudelSoundLibrary', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./strudelSoundLibrary')>()
  return {
    ...actual,
    loadStrudelSoundLibrary: async () => ({ drumMachines: {} }),
    readStrudelSoundEntries: async () => [
      {
        name: 'bd',
        label: 'Bass drum',
        group: 'Dirt samples',
        type: 'sample',
        tag: '',
        sampleCount: 24
      },
      {
        name: 'casio',
        label: 'Casio',
        group: 'Dirt samples',
        type: 'sample',
        tag: '',
        sampleCount: 3
      },
      {
        name: 'rolandtr909_bd',
        label: 'Bass drum',
        group: 'Roland TR909',
        type: 'sample',
        tag: 'drum-machines',
        sampleCount: 4
      }
    ]
  }
})
vi.mock('./strudelPlayback', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./strudelPlayback')>()),
  previewStrudelSound: mockPreviewSound.mockResolvedValue(undefined),
  loadDefaultStrudelPlayback: async () => ({
    evaluateCode: mockEvaluateCode,
    stopPlayback: async () => undefined,
    readPosition: () => ({ cycle: 0, cyclesPerSecond: 0.5 }),
    seekToCycle: () => undefined,
    measureLoop: () => 1,
    measureLanes: () => [],
    setVolume: () => undefined
  })
}))

// CodeMirror and the Strudel engine only load in a real browser; the browser tests cover
// them. This stand-in keeps the code in a textarea so the view wiring can be checked.
vi.mock('./codeEditor/createStrudelCodeMirror', () => ({
  createStrudelCodeMirror: (options: StrudelCodeMirrorOptions) => {
    const codeField = document.createElement('textarea')
    codeField.className = 'fake-strudel-code'
    codeField.value = options.initialCode
    codeField.addEventListener('input', () => options.onCodeChange(codeField.value))
    options.parent.append(codeField)
    return {
      setCode: (patternCode: string) => {
        const changed = codeField.value !== patternCode
        codeField.value = patternCode
        return changed
      },
      applyEvaluation: () => undefined,
      highlight: () => undefined,
      clearHighlights: () => undefined,
      selectRange: (from: number, to: number) => codeField.setSelectionRange(from, to),
      destroy: () => codeField.remove()
    }
  }
}))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }]
})

// A wrapper left mounted keeps reacting to the shared router, so a later test that opens flow
// mode would open it in every earlier wrapper too, each on a full song.
const mountedWrappers: { unmount: () => void }[] = []

const clearSavedState = async (): Promise<void> => {
  mountedWrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  await router.replace('/')
  localStorage.clear()
}

const readEditorCode = (wrapper: Awaited<ReturnType<typeof mountEditorView>>): string =>
  wrapper.find<HTMLTextAreaElement>('.fake-strudel-code').element.value

const mountEditorView = async () => {
  const wrapper = mount(StrudelEditor, { global: { plugins: [router] } })
  mountedWrappers.push(wrapper)
  // The editor module loads through a dynamic import, which outlasts a promise flush.
  await vi.waitFor(() => {
    expect(wrapper.find('.fake-strudel-code').exists()).toBe(true)
  })
  return wrapper
}

const openDrawer = async (
  wrapper: Awaited<ReturnType<typeof mountEditorView>>,
  label: string
): Promise<void> => {
  await wrapper.find(`button[aria-label="${label}"]`).trigger('click')
}

const clickMode = async (
  wrapper: Awaited<ReturnType<typeof mountEditorView>>,
  label: string
): Promise<void> => {
  const modeToggle = wrapper.get('button[aria-label="Flow editor"]')
  const isFlowMode = modeToggle.attributes('aria-pressed') === 'true'
  if (isFlowMode !== (label === 'Flow')) {
    await modeToggle.trigger('click')
  }
}

describe('StrudelEditor view', () => {
  // The flow pickers list the instrument presets from their store.
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(clearSavedState)

  it('renders the code with no top play button, and keeps the license note in the drawer', async () => {
    // Arrange
    const wrapper = await mountEditorView()

    // Act
    const playButtonsBefore = wrapper.findAll('.strudel-editor__play')
    const drawerBefore = wrapper.find('.strudel-editor__drawer').exists()
    await openDrawer(wrapper, 'Settings')

    // Assert
    expect(wrapper.find('.fake-strudel-code').exists()).toBe(true)
    expect(playButtonsBefore).toHaveLength(0)
    expect(drawerBefore).toBe(false)
    expect(wrapper.find('.strudel-editor__license').text()).toContain('AGPL-3.0')
    expect(wrapper.find('.strudel-editor__license a').attributes('href')).toBe(
      'https://codeberg.org/uzu/strudel'
    )
  })

  it.each([
    ['an example menu over the code', '.strudel-editor__code > [role="combobox"]'],
    ['a status line', '.strudel-editor__status'],
    ['an error while nothing has failed', '.strudel-editor__error']
  ])('shows no %s', async (_part, selector) => {
    // Arrange
    const wrapper = await mountEditorView()

    // Act
    const part = wrapper.find(selector)

    // Assert
    expect(part.exists()).toBe(false)
  })

  it('starts with the default example code in the editor', async () => {
    // Arrange
    const wrapper = await mountEditorView()

    // Act
    const codeField = wrapper.find<HTMLTextAreaElement>('.fake-strudel-code')

    // Assert
    expect(codeField.element.value).toBe(defaultSongCode)
  })

  it('updates the code as the player types', async () => {
    // Arrange
    const wrapper = await mountEditorView()
    const codeField = wrapper.find('.fake-strudel-code')

    // Act
    await codeField.setValue('s("hh*8")')

    // Assert
    expect((codeField.element as HTMLTextAreaElement).value).toBe('s("hh*8")')
  })

  it('puts the tools in the toolbar as icons, with the help button for hints', async () => {
    // Arrange
    const wrapper = await mountEditorView()

    // Act
    const toolLabels = wrapper
      .findAll('.strudel-editor__toolbar button')
      .map((button) => button.attributes('aria-label'))

    // Assert
    expect(toolLabels).toEqual([
      'Import',
      'Export',
      'MIDI',
      'Sounds',
      'Instruments',
      'Compose',
      'Console',
      'Settings',
      'Functions',
      'Hints'
    ])
  })

  it('lists the sounds by group and readable name, filters them, and previews one', async () => {
    // Arrange
    const wrapper = await mountEditorView()
    await openDrawer(wrapper, 'Sounds')
    await flushPromises()
    const readSoundGroups = (): string[][] =>
      wrapper
        .findAll('.strudel-sounds__group')
        .map((group) => [
          group.get('.strudel-sounds__group-title').text(),
          ...group.findAll('li').map((item) => item.text().replace(/\s+/g, ' '))
        ])

    // Act
    const allSounds = readSoundGroups()
    await wrapper
      .findAll('.button-selector__btn')
      .find((filterButton) => filterButton.text() === 'drum machines')
      ?.trigger('click')
    const drumMachineSounds = readSoundGroups()
    await wrapper.find('[aria-label="Preview Bass drum, rolandtr909_bd"]').trigger('click')

    // Assert
    expect(allSounds).toEqual([
      ['Dirt samples', 'Bass drum bd (24)', 'Casio (3)'],
      ['Roland TR909', 'Bass drum rolandtr909_bd (4)']
    ])
    expect(drumMachineSounds).toEqual([['Roland TR909', 'Bass drum rolandtr909_bd (4)']])
    expect(mockPreviewSound).toHaveBeenCalledWith('rolandtr909_bd', 'sample')
  })

  it('opens the hints in a drawer from the help button and closes it again', async () => {
    // Arrange
    const wrapper = await mountEditorView()

    // Act
    const hintsBefore = wrapper.find('.strudel-hints').exists()
    await openDrawer(wrapper, 'Hints')
    const hintsOpen = wrapper.find('.strudel-hints').exists()
    await openDrawer(wrapper, 'Hints')

    // Assert
    expect(hintsBefore).toBe(false)
    expect(hintsOpen).toBe(true)
    expect(wrapper.find('.strudel-editor__drawer').exists()).toBe(false)
  })

  it('splits the import drawer into music, sounds and import sub-tabs', async () => {
    // Arrange
    const wrapper = await mountEditorView()

    // Act
    await openDrawer(wrapper, 'Import')
    const subTabLabels = wrapper
      .findAll('.strudel-editor__drawer-tabs button')
      .map((button) => button.attributes('aria-label'))
    const musicGroups = wrapper
      .findAll('.strudel-patterns__group-title')
      .map((title) => title.text())
    const musicLinks = wrapper.findAll('.strudel-patterns__link')
    await wrapper.find('.strudel-editor__drawer-tabs button[aria-label="Sounds"]').trigger('click')
    const soundGroups = wrapper
      .findAll('.strudel-patterns__group-title')
      .map((title) => title.text())
    const soundLinks = wrapper.findAll('.strudel-patterns__link')
    await wrapper.find('.strudel-editor__drawer-tabs button[aria-label="Import"]').trigger('click')

    // Assert
    expect(subTabLabels).toEqual(['Music', 'Sounds', 'Import'])
    expect(musicGroups).toEqual([`Songs (${ELECTRO_TUNES.length})`])
    expect(musicLinks.map((link) => [link.text(), link.attributes('href')])).toEqual(
      ELECTRO_TUNES.map((song) => [song.label, `/?pattern=${song.id}`])
    )
    expect(soundGroups).toEqual([`Examples (${STRUDEL_EXAMPLES.length})`])
    expect(soundLinks.map((link) => [link.text(), link.attributes('href')])).toEqual(
      STRUDEL_EXAMPLES.map((example) => [example.label, `/?pattern=${example.id}`])
    )
    expect(wrapper.find('.strudel-import').exists()).toBe(true)
  })

  it('lists the songs', () => {
    // Arrange / Act
    const labels = ELECTRO_TUNES.map((song) => song.label)

    // Assert
    expect(labels).toEqual([
      'Lift Off (trance)',
      'Wire Fence (breakbeat)',
      'Neon Drive (synthwave)',
      'Dust and Diesel (stoner rock)',
      'Sun Bleached (stoner rock)',
      'Rust and Rain (grunge)',
      'Paper Skies (grunge)',
      'Uptown Strut (funk)',
      'Blue Hour (jazz)',
      'Acid Doom (psytrance doom)',
      'Late Fusion (jazz funk)',
      'Psy Funk Jazz (psytrance funk jazz)',
      'Doom Thrash Psy (psytrance doom thrash)',
      'Black Neon (drum and bass synthwave)'
    ])
  })

  it('saves the code under the export name, lists it first in import, and deletes it', async () => {
    // Arrange
    const wrapper = await mountEditorView()
    await wrapper.find('.fake-strudel-code').setValue('s("cp*3")')
    await openDrawer(wrapper, 'Export')
    const saveButton = wrapper
      .findAll('.strudel-export__button')
      .find((button) => button.text() === 'Save pattern')
    const disabledWithoutName = saveButton?.attributes('disabled') !== undefined

    // Act
    await wrapper.find('.strudel-export input').setValue('My beat')
    await saveButton?.trigger('click')
    await openDrawer(wrapper, 'Import')
    const savedLink = wrapper.find('.strudel-patterns__link')
    const savedIcon = wrapper.find('.strudel-patterns__saved-icon')
    await wrapper.find('button[aria-label="Delete My beat"]').trigger('click')

    // Assert
    expect(disabledWithoutName).toBe(true)
    expect(savedIcon.exists()).toBe(true)
    expect([savedLink.text(), savedLink.attributes('href')]).toEqual([
      'My beat',
      '/?pattern=saved-my-beat'
    ])
    expect(wrapper.find('button[aria-label="Delete My beat"]').exists()).toBe(false)
  })

  it.each([
    ['an example', STRUDEL_EXAMPLES.at(-1)],
    ['an electro tune', ELECTRO_TUNES[0]]
  ])('loads %s when the address moves to it', async (_kind, pattern) => {
    // Arrange
    const wrapper = await mountEditorView()

    // Act
    await router.push({ query: { pattern: pattern?.id } })

    // Assert
    await vi.waitFor(() => {
      expect(readEditorCode(wrapper)).toBe(pattern?.code)
    })
  })

  it('plays a song as soon as it is clicked', async () => {
    // Arrange
    mockEvaluateCode.mockClear()
    const wrapper = await mountEditorView()
    await openDrawer(wrapper, 'Import')
    const songLink = wrapper
      .findAll('.strudel-patterns__link')
      .find((link) => link.attributes('href') === `/?pattern=${ELECTRO_TUNES[1].id}`)

    // Act
    await songLink?.trigger('click')

    // Assert
    await vi.waitFor(() => {
      expect(mockEvaluateCode).toHaveBeenCalledWith(ELECTRO_TUNES[1].code)
    })
    expect(readEditorCode(wrapper)).toBe(ELECTRO_TUNES[1].code)
  })

  it('stays silent when the address opens a pattern', async () => {
    // Arrange
    mockEvaluateCode.mockClear()
    const wrapper = await mountEditorView()

    // Act
    await router.push({ query: { pattern: ELECTRO_TUNES[1].id } })
    await vi.waitFor(() => {
      expect(readEditorCode(wrapper)).toBe(ELECTRO_TUNES[1].code)
    })
    await flushPromises()

    // Assert
    expect(mockEvaluateCode).not.toHaveBeenCalled()
  })

  it('opens on the pattern its address names', async () => {
    // Arrange
    await router.replace({ query: { pattern: ELECTRO_TUNES[0].id } })

    // Act
    const wrapper = await mountEditorView()

    // Assert
    expect(readEditorCode(wrapper)).toBe(ELECTRO_TUNES[0].code)
  })

  it.each([
    ['the code saved on the last visit', '', 's("cp*3")'],
    [
      'the pattern its address names, over saved code',
      `/?pattern=${ELECTRO_TUNES[0].id}`,
      ELECTRO_TUNES[0].code
    ]
  ])('opens on %s', async (_case, address, expectedCode) => {
    // Arrange
    localStorage.setItem(STRUDEL_SAVED_CODE_STORAGE_KEY, 's("cp*3")')
    await router.replace(address || '/')

    // Act
    const wrapper = await mountEditorView()

    // Assert
    expect(readEditorCode(wrapper)).toBe(expectedCode)
  })

  it('keeps the default example for an address that names no pattern', async () => {
    // Arrange
    await router.replace({ query: { pattern: 'no-such-pattern' } })

    // Act
    const wrapper = await mountEditorView()

    // Assert
    expect(readEditorCode(wrapper)).toBe(defaultSongCode)
  })

  it.each([
    ['a tab', '/?tab=midi', 'MIDI', defaultSongCode, { tab: 'midi' }],
    [
      'a tab and a pattern',
      `/?tab=export&pattern=${ELECTRO_TUNES[0].id}`,
      'Export',
      ELECTRO_TUNES[0].code,
      { tab: 'export', pattern: ELECTRO_TUNES[0].id }
    ],
    ['an old tab anchor', '/#export', 'Export', defaultSongCode, { tab: 'export' }],
    [
      'an old pattern anchor',
      `/#${ELECTRO_TUNES[0].id}`,
      null,
      ELECTRO_TUNES[0].code,
      { pattern: ELECTRO_TUNES[0].id }
    ]
  ])(
    'opens on %s named by the address',
    async (_case, address, drawerTitle, expectedCode, expectedQuery) => {
      // Arrange
      await router.replace(address)

      // Act
      const wrapper = await mountEditorView()

      // Assert
      await vi.waitFor(() => {
        expect(router.currentRoute.value.query).toEqual(expectedQuery)
        expect(router.currentRoute.value.hash).toBe('')
        expect(readEditorCode(wrapper)).toBe(expectedCode)
      })
      const drawerHeading = wrapper.find('.strudel-editor__drawer-title')
      expect(drawerHeading.exists() ? drawerHeading.text() : null).toBe(drawerTitle)
    }
  )

  it('writes the drawer it opens into the address, beside the pattern, and clears it on close', async () => {
    // Arrange
    await router.replace({ query: { pattern: ELECTRO_TUNES[0].id } })
    const wrapper = await mountEditorView()

    // Act
    await openDrawer(wrapper, 'Export')
    await flushPromises()
    const openedQuery = router.currentRoute.value.query
    await openDrawer(wrapper, 'Export')
    await flushPromises()

    // Assert
    expect(openedQuery).toEqual({ pattern: ELECTRO_TUNES[0].id, tab: 'export' })
    expect(router.currentRoute.value.query).toEqual({ pattern: ELECTRO_TUNES[0].id })
  })

  it('opens in flow mode when the address names it, and drops the key on a switch to code', async () => {
    // Arrange
    await router.replace({ query: { mode: 'flow' } })
    const wrapper = await mountEditorView()
    await flushPromises()
    const openedInFlow = wrapper.find('.strudel-editor__flow').exists()

    // Act
    await router.replace({ query: {} })
    await flushPromises()

    // Assert
    expect(openedInFlow).toBe(true)
    expect(wrapper.find('.strudel-editor__flow').exists()).toBe(false)
    expect(router.currentRoute.value.query).toEqual({})
  })

  it('writes the flow mode into the address when it opens', async () => {
    // Arrange
    await router.replace({ query: { pattern: ELECTRO_TUNES[0].id } })
    const wrapper = await mountEditorView()

    // Act
    await router.replace({ query: { pattern: ELECTRO_TUNES[0].id, mode: 'flow' } })
    await flushPromises()

    // Assert
    expect(wrapper.find('.strudel-editor__flow').exists()).toBe(true)
    expect(router.currentRoute.value.query).toEqual({ pattern: ELECTRO_TUNES[0].id, mode: 'flow' })
  })

  it('opens the import tab from the link in the MIDI tab', async () => {
    // Arrange
    await router.replace({ query: { tab: 'midi' } })
    const wrapper = await mountEditorView()

    // Act
    await wrapper.find('.strudel-midi__link').trigger('click')

    // Assert
    await vi.waitFor(() => {
      expect(wrapper.find('.strudel-editor__drawer-title').text()).toBe('Import')
    })
    expect(router.currentRoute.value.query).toEqual({ tab: 'import' })
  })

  it('keeps edits made since a pattern was picked when only the tab in the address changes', async () => {
    // Arrange
    await router.replace({ query: { pattern: ELECTRO_TUNES[0].id } })
    const wrapper = await mountEditorView()
    await wrapper.find('.fake-strudel-code').setValue('s("cp*3")')

    // Act
    await router.push({ query: { pattern: ELECTRO_TUNES[0].id, tab: 'midi' } })
    await flushPromises()

    // Assert
    expect(wrapper.find('.strudel-editor__drawer-title').text()).toBe('MIDI')
    expect(readEditorCode(wrapper)).toBe('s("cp*3")')
  })

  it('opens the console drawer', async () => {
    // Arrange
    const wrapper = await mountEditorView()

    // Act
    await openDrawer(wrapper, 'Console')

    // Assert
    expect(wrapper.find('.strudel-console').exists()).toBe(true)
  })

  it('opens flow mode on the code as it is and writes the code once the patch changes', async () => {
    // Arrange
    localStorage.setItem(STRUDEL_SAVED_CODE_STORAGE_KEY, STRUDEL_EXAMPLES[0].code)
    const wrapper = await mountEditorView()
    const originalCode = readEditorCode(wrapper)

    // Act
    await clickMode(wrapper, 'Flow')
    await vi.waitFor(() => {
      expect(wrapper.find('.strudel-flow-editor-stub').exists()).toBe(true)
    })
    await openDrawer(wrapper, 'Functions')
    const codeOnOpen = readEditorCode(wrapper)
    // The palette renders with the flow tab, which can land a tick after the canvas on a slow run.
    await vi.waitFor(() => {
      expect(wrapper.find('button[aria-label="Add note function"]').exists()).toBe(true)
    })
    await wrapper.find('button[aria-label="Add note function"]').trigger('click')
    await flushPromises()
    const codeAfterAdd = readEditorCode(wrapper)
    await clickMode(wrapper, 'Code')

    // Assert
    expect(codeOnOpen).toBe(originalCode)
    expect(codeAfterAdd).toContain('$: s("bd sd, hh*8")')
    expect(codeAfterAdd).toContain('$: note(')
    expect(wrapper.find('.strudel-flow-editor-stub').exists()).toBe(false)
    expect(readEditorCode(wrapper)).toBe(codeAfterAdd)
  })

  it('rebuilds the graph from code and keeps the same code when flow mode opens', async () => {
    // Arrange
    const wrapper = await mountEditorView()
    const code = ['setcpm(100/4)', '$: n("[0 2] [4]").scale("D4:minor").sound("sine")'].join('\n')

    // Act
    await wrapper.find('.fake-strudel-code').setValue(code)
    await clickMode(wrapper, 'Flow')
    await vi.waitFor(() => {
      expect(wrapper.find('.strudel-flow-editor-stub').exists()).toBe(true)
    })
    await clickMode(wrapper, 'Code')

    // Assert
    expect(readEditorCode(wrapper)).toBe(code)
  })

  it('shows a flow error in the main editor area instead of the side panel', async () => {
    // Arrange
    localStorage.setItem(STRUDEL_SAVED_CODE_STORAGE_KEY, '')
    const wrapper = await mountEditorView()

    // Act
    await clickMode(wrapper, 'Flow')
    await vi.waitFor(() => {
      expect(wrapper.find('.strudel-editor__error').exists()).toBe(true)
    })

    // Assert
    expect(wrapper.find('.strudel-editor__error').text()).toContain('instrument')
    expect(wrapper.find('.strudel-flow-tab [role="alert"]').exists()).toBe(false)
  })

  it('previews an instrument preset from a flow picker before its sounds are registered', async () => {
    // Arrange
    const wrapper = await mountEditorView()
    await clickMode(wrapper, 'Flow')
    await vi.waitFor(() => {
      expect(wrapper.find('.strudel-flow-editor-stub').exists()).toBe(true)
    })
    const flowEditor = wrapper.findComponent({ name: 'StrudelFlowEditorStub' })
    const previewSound = flowEditor.vm.$attrs['preview-sound']

    // Act
    if (typeof previewSound === 'function') {
      previewSound('chainsaw_chord')
    }

    // Assert
    expect(mockPreviewSound).toHaveBeenCalledWith('chainsaw_chord', 'sample')
  })

  it('returns to code mode when a listed pattern is picked from flow mode', async () => {
    // Arrange
    const wrapper = await mountEditorView()
    await clickMode(wrapper, 'Flow')
    await vi.waitFor(() => {
      expect(wrapper.find('.strudel-flow-editor-stub').exists()).toBe(true)
    })

    // Act
    await openDrawer(wrapper, 'Import')
    const flowStayedOpen = wrapper.find('.strudel-flow-editor-stub').exists()
    await wrapper.find('.strudel-editor__drawer-tabs button[aria-label="Sounds"]').trigger('click')
    await wrapper.find('.strudel-patterns__link').trigger('click')

    // Assert
    expect(flowStayedOpen).toBe(true)
    expect(wrapper.find('.strudel-flow-editor-stub').exists()).toBe(false)
    expect(readEditorCode(wrapper)).toBe(STRUDEL_EXAMPLES[0].code)
  })

  it('opens the settings drawer', async () => {
    // Arrange
    const wrapper = await mountEditorView()

    // Act
    await openDrawer(wrapper, 'Settings')

    // Assert
    expect(wrapper.find('.strudel-settings').exists()).toBe(true)
  })

  it('shows the Functions tool in code mode and in flow mode', async () => {
    // Arrange
    const wrapper = await mountEditorView()

    // Act
    const inCodeMode = wrapper.find('button[aria-label="Functions"]').exists()
    await clickMode(wrapper, 'Flow')
    const inFlowMode = wrapper.find('button[aria-label="Functions"]').exists()

    // Assert
    expect(inCodeMode).toBe(true)
    expect(inFlowMode).toBe(true)
  })
})

describe('host events', () => {
  it('emits the code it starts with, then each change', async () => {
    // Arrange
    const wrapper = await mountEditorView()

    // Act
    wrapper.find<HTMLTextAreaElement>('.fake-strudel-code').setValue('s("sd")')
    await nextTick()

    // Assert
    expect(wrapper.emitted('update:code')?.[0]).toEqual([defaultSongCode])
    expect(wrapper.emitted('update:code')?.at(-1)).toEqual(['s("sd")'])
  })

  it('shows the code a host passes in v-model:code', async () => {
    // Arrange
    const wrapper = mount(StrudelEditor, {
      props: { code: 's("hh")' },
      global: { plugins: [router] }
    })
    mountedWrappers.push(wrapper)
    await vi.waitFor(() => {
      expect(wrapper.find('.fake-strudel-code').exists()).toBe(true)
    })

    // Act
    await wrapper.setProps({ code: 's("cp")' })

    // Assert
    expect(readEditorCode(wrapper)).toBe('s("cp")')
  })

  it('emits the saved songs after a save', async () => {
    // Arrange
    const wrapper = await mountEditorView()
    await router.replace('/?tab=export')
    await vi.waitFor(() => {
      expect(wrapper.findComponent(ExportTab).exists()).toBe(true)
    })

    // Act
    wrapper.findComponent(ExportTab).vm.$emit('save', 'Night Drive')

    // Assert
    expect(wrapper.emitted('saved')?.[0]).toEqual([
      [{ id: 'saved-night-drive', label: 'Night Drive', code: readEditorCode(wrapper) }]
    ])
  })

  it('emits the saved songs after a delete', async () => {
    // Arrange
    localStorage.setItem(
      STRUDEL_SAVED_PATTERNS_STORAGE_KEY,
      JSON.stringify([{ name: 'Night Drive', code: 's("bd")' }])
    )
    const wrapper = await mountEditorView()
    await router.replace('/?tab=import')
    await vi.waitFor(() => {
      expect(wrapper.findComponent(PatternLibrary).exists()).toBe(true)
    })

    // Act
    wrapper.findComponent(PatternLibrary).vm.$emit('delete', 'saved-night-drive')

    // Assert
    expect(wrapper.emitted('saved')?.[0]).toEqual([[]])
  })
})
