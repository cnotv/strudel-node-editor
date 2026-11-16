import { beforeAll, describe, expect, it, vi } from 'vitest'
import {
  fetchOpenRouterModels,
  loadOpenRouterModels,
  readReasoningEffortForModel
} from './openRouterModels'

const buildModel = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'vendor/model',
  name: 'Vendor: Model',
  supported_parameters: ['structured_outputs', 'response_format'],
  architecture: { output_modalities: ['text'] },
  endpoints: ['/api/v1/chat/completions'],
  top_provider: { max_completion_tokens: 10000 },
  ...overrides
})

const respondWith = (data: unknown[]): typeof fetch =>
  vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ data })))

describe('fetchOpenRouterModels', () => {
  it('keeps only models that can answer strict JSON within the answer budget', async () => {
    // Arrange
    const fetchImplementation = respondWith([
      buildModel({
        id: 'vendor/alpha',
        name: 'Vendor: Alpha',
        reasoning: { mandatory: true, supported_efforts: ['high', 'low'] }
      }),
      buildModel({ id: 'vendor/zeta', name: 'Vendor: Zeta' }),
      buildModel({ id: 'vendor/no-schema', supported_parameters: ['response_format'] }),
      buildModel({ id: 'vendor/no-chat', endpoints: [] }),
      buildModel({
        id: 'vendor/wrong-output',
        architecture: { output_modalities: ['image'] }
      }),
      buildModel({ id: 'vendor/small', top_provider: { max_completion_tokens: 2048 } }),
      'not a model'
    ])

    // Act
    const options = await fetchOpenRouterModels(fetchImplementation)

    // Assert
    expect(options.map(({ value }) => value)).toEqual(['vendor/alpha', 'vendor/zeta'])
    expect(options[0]?.reasoning).toEqual({
      mandatory: true,
      defaultEnabled: false,
      supportedEfforts: ['high', 'low']
    })
  })

  it('throws when the list cannot be loaded', async () => {
    // Arrange
    const fetchImplementation = vi.fn<typeof fetch>(async () => new Response('', { status: 500 }))

    // Act and Assert
    await expect(fetchOpenRouterModels(fetchImplementation)).rejects.toThrow(
      'Could not load the OpenRouter model list.'
    )
  })
})

describe('reasoning before the model list loads', () => {
  it.each([
    ['anthropic/claude-sonnet-5.5', 'low'],
    ['google/gemini-3.8-flash', 'low'],
    ['deepseek/deepseek-v4.1-flash', 'none'],
    ['qwen/qwen3.8-flash', 'none'],
    ['openai/gpt-5.4-mini', 'none'],
    ['anthropic/claude-haiku-5.5', 'none']
  ])('knows the fallback model %s needs %s', (model, effort) => {
    // Act and Assert
    expect(readReasoningEffortForModel(model)).toBe(effort)
  })

  it('leaves a model it knows nothing about at its default', () => {
    // Act and Assert
    expect(readReasoningEffortForModel('vendor/unknown')).toBeUndefined()
  })
})

describe('reasoning from the model list', () => {
  const models = [
    buildModel({
      id: 'vendor/mandatory-low',
      reasoning: { mandatory: true, supported_efforts: ['high', 'low'] }
    }),
    buildModel({
      id: 'vendor/mandatory-high',
      reasoning: { mandatory: true, supported_efforts: ['high'] }
    }),
    buildModel({ id: 'vendor/mandatory-none', reasoning: { mandatory: true } }),
    buildModel({
      id: 'vendor/on-by-default',
      reasoning: { default_enabled: true, supported_efforts: ['high', 'none'] }
    }),
    buildModel({ id: 'vendor/on-by-default-empty', reasoning: { default_enabled: true } }),
    buildModel({
      id: 'vendor/off-by-default',
      reasoning: { default_enabled: false, supported_efforts: ['high'] }
    })
  ]

  beforeAll(async () => {
    await loadOpenRouterModels(respondWith(models))
  })

  it.each([
    ['a mandatory model that accepts low', 'vendor/mandatory-low', 'low'],
    ['a mandatory model with only high', 'vendor/mandatory-high', 'high'],
    ['a mandatory model with no effort list', 'vendor/mandatory-none', undefined],
    ['a model that can turn thinking off', 'vendor/on-by-default', 'none'],
    ['a default-thinking model with no effort list', 'vendor/on-by-default-empty', 'none'],
    ['a model that is off by default', 'vendor/off-by-default', undefined]
  ])('reads %s from the model list', (_case, model, expectedEffort) => {
    // Act and Assert
    expect(readReasoningEffortForModel(model)).toBe(expectedEffort)
  })
})
