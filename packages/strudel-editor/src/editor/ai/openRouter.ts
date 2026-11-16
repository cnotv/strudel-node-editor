import { isRecordModule } from '../strudelModules'
import {
  STRUDEL_AI_ERRORS,
  STRUDEL_AI_MAX_TOKENS,
  STRUDEL_AI_OPENROUTER_URL,
  STRUDEL_AI_STATUS_ERRORS
} from './config'
import { readReasoningEffortForModel } from './openRouterModels'
import type { OpenRouterRequestOptions } from './types'

/**
 * The model a dropdown should show. The full list loads at runtime, so any saved id is kept;
 * Settings replaces one that the list no longer offers.
 * @param storedModel - the model id kept in local storage, if any
 * @param defaultModel - the model to use when nothing is stored
 * @returns the stored model, or the default
 */
export const readStoredOpenRouterModel = (
  storedModel: string | null,
  defaultModel: string
): string =>
  storedModel !== null && storedModel.trim().length > 0 ? storedModel.trim() : defaultModel

/**
 * The response format that makes the model answer with an object matching the schema.
 * @param name - a name for the schema, letters, digits and underscores
 * @param schema - the JSON schema the answer must match
 * @returns the `response_format` field of a chat completion body
 */
export const buildStrictJsonFormat = (
  name: string,
  schema: Record<string, unknown>
): Record<string, unknown> => ({
  type: 'json_schema',
  json_schema: { name, strict: true, schema }
})

const readFirstChoice = (responseBody: unknown): unknown =>
  isRecordModule(responseBody) && Array.isArray(responseBody.choices)
    ? responseBody.choices[0]
    : undefined

const readMessageContent = (responseBody: unknown): string => {
  const firstChoice = readFirstChoice(responseBody)
  const message = isRecordModule(firstChoice) ? firstChoice.message : undefined
  const content = isRecordModule(message) ? message.content : undefined
  if (typeof content !== 'string') {
    throw new Error(STRUDEL_AI_ERRORS.badAnswer)
  }
  return content
}

const parseJsonObject = (text: string): Record<string, unknown> => {
  const parsed: unknown = (() => {
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(STRUDEL_AI_ERRORS.badAnswer)
    }
  })()
  if (!isRecordModule(parsed) || Array.isArray(parsed)) {
    throw new Error(STRUDEL_AI_ERRORS.badAnswer)
  }
  return parsed
}

/**
 * Reads the JSON object a chat completion answered with.
 * @param responseBody - the parsed OpenRouter response
 * @returns the object in the first choice's message
 * @throws {Error} a readable error when the model ran out of tokens before answering, when there
 * is no message or when it is not a JSON object
 */
export const readOpenRouterJsonAnswer = (responseBody: unknown): Record<string, unknown> => {
  const firstChoice = readFirstChoice(responseBody)
  if (isRecordModule(firstChoice) && firstChoice.finish_reason === 'length') {
    throw new Error(STRUDEL_AI_ERRORS.truncated)
  }
  return parseJsonObject(readMessageContent(responseBody))
}

const readStatusMessage = (status: number): string => {
  const errorKey = STRUDEL_AI_STATUS_ERRORS[status]
  return errorKey === undefined
    ? `${STRUDEL_AI_ERRORS.other} (${status}).`
    : STRUDEL_AI_ERRORS[errorKey]
}

const readRefusalReason = async (response: Response): Promise<string> => {
  const refusalBody: unknown = await response.json().catch(() => null)
  const refusal = isRecordModule(refusalBody) ? refusalBody.error : undefined
  const reason = isRecordModule(refusal) ? refusal.message : undefined
  return typeof reason === 'string' && reason.length > 0
    ? ` ${STRUDEL_AI_ERRORS.reason} ${reason}`
    : ''
}

/**
 * Posts a chat completion to OpenRouter and reads its JSON answer. The key goes only in the
 * Authorization header of this one request to OpenRouter.
 * @param options - the player's own key, the request body and, for tests, a fetch
 * @returns the JSON object the model answered with
 * @throws {Error} a readable error for a missing or refused key, no credit, a network failure or
 * a bad answer
 */
export const askOpenRouter = async ({
  apiKey,
  body,
  fetchImplementation = fetch
}: OpenRouterRequestOptions): Promise<Record<string, unknown>> => {
  if (apiKey.trim().length === 0) {
    throw new Error(STRUDEL_AI_ERRORS.noKey)
  }
  const reasoningEffort = readReasoningEffortForModel(body.model)
  const response = await fetchImplementation(STRUDEL_AI_OPENROUTER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey.trim()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      max_tokens: STRUDEL_AI_MAX_TOKENS,
      ...(reasoningEffort === undefined ? {} : { reasoning: { effort: reasoningEffort } }),
      ...body
    })
  }).catch(() => {
    throw new Error(STRUDEL_AI_ERRORS.network)
  })
  if (!response.ok) {
    throw new Error(`${readStatusMessage(response.status)}${await readRefusalReason(response)}`)
  }
  return readOpenRouterJsonAnswer(await response.json().catch(() => null))
}
