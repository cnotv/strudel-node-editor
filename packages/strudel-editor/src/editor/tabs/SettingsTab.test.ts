import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Select } from '../../components/ui/select'
import {
  STRUDEL_AI_DEFAULT_COMPOSE_MODEL,
  STRUDEL_AI_DEFAULT_SOUND_MODEL,
  STRUDEL_AI_STORAGE_KEY_COMPOSE_MODEL
} from '../ai/config'
import { loadOpenRouterModels } from '../ai/openRouterModels'
import { useAiSettings } from '../ai/useAiSettings'
import SettingsTab from './SettingsTab.vue'
import type { OpenRouterModelOption } from '../ai/types'

vi.mock('../ai/openRouterModels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ai/openRouterModels')>()
  return { ...actual, loadOpenRouterModels: vi.fn() }
})

const MODEL_OPTIONS: OpenRouterModelOption[] = [
  { value: STRUDEL_AI_DEFAULT_COMPOSE_MODEL, label: 'Claude Sonnet 5.5' },
  { value: STRUDEL_AI_DEFAULT_SOUND_MODEL, label: 'Claude Haiku 5.5' },
  { value: 'vendor/alpha', label: 'Alpha Model' },
  { value: 'vendor/beta', label: 'Beta Model' }
]

const mountSettings = (): ReturnType<typeof mount> => mount(SettingsTab)

const readSelectValues = (wrapper: ReturnType<typeof mountSettings>): string[] => {
  const options = wrapper.findAllComponents(Select)[0]?.props('options') ?? []
  return options.map((option: OpenRouterModelOption) => option.value)
}

describe('SettingsTab models', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.mocked(loadOpenRouterModels).mockResolvedValue(MODEL_OPTIONS)
  })

  it('offers every loaded model and filters them by name', async () => {
    // Arrange
    const wrapper = mountSettings()

    // Act
    await flushPromises()
    await wrapper.find('input[aria-label="Filter models"]').setValue('beta')
    await nextTick()

    // Assert
    expect(wrapper.text()).toContain('4 models available.')
    expect(readSelectValues(wrapper)).toContain('vendor/beta')
    expect(readSelectValues(wrapper)).not.toContain('vendor/alpha')
    wrapper.unmount()
  })

  it('replaces a stored model the loaded list no longer offers', async () => {
    // Arrange
    localStorage.setItem(STRUDEL_AI_STORAGE_KEY_COMPOSE_MODEL, 'vendor/removed')
    const wrapper = mountSettings()

    // Act
    await flushPromises()

    // Assert
    expect(useAiSettings().composeModel).toBe(STRUDEL_AI_DEFAULT_COMPOSE_MODEL)
    wrapper.unmount()
  })
})
