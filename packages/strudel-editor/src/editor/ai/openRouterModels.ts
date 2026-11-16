import { isRecordModule } from '../strudelModules'
import {
  STRUDEL_AI_FALLBACK_MODEL_OPTIONS,
  STRUDEL_AI_MAX_TOKENS,
  STRUDEL_AI_OPENROUTER_MODELS_URL,
  STRUDEL_AI_REASONING_EFFORT_BY_MODEL
} from './config'
import type { OpenRouterModelOption, OpenRouterReasoning } from './types'

/** The order from the least to the most thinking a model may do. */
const EFFORT_ORDER = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []

const readReasoning = (value: unknown): OpenRouterReasoning | undefined => {
  if (!isRecordModule(value)) {
    return undefined
  }
  return {
    mandatory: value.mandatory === true,
    defaultEnabled: value.default_enabled === true,
    supportedEfforts: readStringArray(value.supported_efforts)
  }
}

/**
 * The least thinking a model allows, leaving the rest of the cap for its answer.
 * @param reasoning - the model's reasoning metadata
 * @returns the effort, or undefined when the model lists none
 */
const readSmallestEffort = (reasoning: OpenRouterReasoning): string | undefined =>
  EFFORT_ORDER.find((effort) => reasoning.supportedEfforts.includes(effort))

/**
 * The effort to ask a model for when it reasons.
 * @param reasoning - the model's reasoning metadata
 * @returns `none` when thinking can be turned off, the smallest allowed effort when it cannot,
 * or undefined when the model does not reason by default
 */
const readReasoningEffort = (reasoning: OpenRouterReasoning): string | undefined => {
  if (reasoning.mandatory) {
    return readSmallestEffort(reasoning)
  }
  if (reasoning.defaultEnabled) {
    return reasoning.supportedEfforts.length === 0 || reasoning.supportedEfforts.includes('none')
      ? 'none'
      : readSmallestEffort(reasoning)
  }
  return undefined
}

const readModelOption = (value: unknown): OpenRouterModelOption | undefined => {
  if (!isRecordModule(value)) {
    return undefined
  }
  const {
    id,
    name,
    supported_parameters,
    architecture,
    endpoints,
    top_provider: topProvider
  } = value
  if (typeof id !== 'string' || id.length === 0 || typeof name !== 'string' || name.length === 0) {
    return undefined
  }
  const supportedParameters = readStringArray(supported_parameters)
  const outputModalities = isRecordModule(architecture)
    ? readStringArray(architecture.output_modalities)
    : []
  const maxCompletionTokens = isRecordModule(topProvider)
    ? topProvider.max_completion_tokens
    : undefined
  const canAnswerJson =
    supportedParameters.includes('structured_outputs') &&
    supportedParameters.includes('response_format') &&
    outputModalities.includes('text') &&
    readStringArray(endpoints).includes('/api/v1/chat/completions')
  const hasAnswerRoom =
    typeof maxCompletionTokens !== 'number' || maxCompletionTokens >= STRUDEL_AI_MAX_TOKENS
  if (!canAnswerJson || !hasAnswerRoom) {
    return undefined
  }
  const reasoning = readReasoning(value.reasoning)
  return {
    value: id,
    label: name,
    ...(reasoning === undefined ? {} : { reasoning })
  }
}

/**
 * Every OpenRouter model the editor can ask for a strict JSON answer, with its reasoning needs.
 * @param fetchImplementation - the fetch to use
 * @returns the models, sorted by name
 * @throws {Error} when the list cannot be loaded
 */
export const fetchOpenRouterModels = async (
  fetchImplementation: typeof fetch = fetch
): Promise<OpenRouterModelOption[]> => {
  const response = await fetchImplementation(STRUDEL_AI_OPENROUTER_MODELS_URL)
  if (!response.ok) {
    throw new Error('Could not load the OpenRouter model list.')
  }
  const body: unknown = await response.json().catch(() => null)
  const data = isRecordModule(body) && Array.isArray(body.data) ? body.data : []
  return data
    .flatMap((value) => {
      const option = readModelOption(value)
      return option === undefined ? [] : [option]
    })
    .toSorted((first, second) => first.label.localeCompare(second.label))
}

const modelCatalog: {
  loaded: boolean
  options: OpenRouterModelOption[]
  reasoningByModel: Map<string, OpenRouterReasoning>
  loading: Promise<OpenRouterModelOption[]> | null
} = {
  loaded: false,
  options: [],
  reasoningByModel: new Map(),
  loading: null
}

const rememberModels = (options: OpenRouterModelOption[]): void => {
  modelCatalog.options = options
  modelCatalog.reasoningByModel = new Map(
    options.flatMap(({ value, reasoning }) =>
      reasoning === undefined ? [] : [[value, reasoning] as const]
    )
  )
  modelCatalog.loaded = true
}

/**
 * The OpenRouter model list, loaded once for this page.
 * @param fetchImplementation - the fetch to use on the first call
 * @returns every model the editor can use
 * @throws {Error} when the list cannot be loaded
 */
export const loadOpenRouterModels = async (
  fetchImplementation: typeof fetch = fetch
): Promise<OpenRouterModelOption[]> => {
  if (modelCatalog.loaded) {
    return modelCatalog.options
  }
  if (modelCatalog.loading !== null) {
    return modelCatalog.loading
  }
  const loading = fetchOpenRouterModels(fetchImplementation)
    .then((options) => {
      rememberModels(options)
      return options
    })
    .catch((error: unknown) => {
      modelCatalog.loading = null
      throw error
    })
  modelCatalog.loading = loading
  return loading
}

/**
 * Loads the model list before an unknown model's request, so its reasoning metadata is known.
 * @param model - the model the request will use
 * @returns once the list is loaded or the attempt failed
 */
export const ensureOpenRouterModels = async (model: string): Promise<void> => {
  if (
    modelCatalog.loaded ||
    STRUDEL_AI_FALLBACK_MODEL_OPTIONS.some(({ value }) => value === model)
  ) {
    return
  }
  await loadOpenRouterModels().catch(() => undefined)
}

/**
 * The reasoning effort to send for a model.
 * @param model - the model id from the request
 * @returns the effort, or undefined when the request should not name one
 */
export const readReasoningEffortForModel = (model: unknown): string | undefined => {
  if (typeof model !== 'string') {
    return undefined
  }
  const reasoning = modelCatalog.reasoningByModel.get(model)
  if (reasoning !== undefined) {
    return readReasoningEffort(reasoning)
  }
  const knownEffort = Object.hasOwn(STRUDEL_AI_REASONING_EFFORT_BY_MODEL, model)
    ? STRUDEL_AI_REASONING_EFFORT_BY_MODEL[model]
    : undefined
  if (knownEffort !== undefined) {
    return knownEffort
  }
  return STRUDEL_AI_FALLBACK_MODEL_OPTIONS.some(({ value }) => value === model) ? 'none' : undefined
}
