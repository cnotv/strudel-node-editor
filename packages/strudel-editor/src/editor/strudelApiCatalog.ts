import { isStrudelFlowCombinerName } from '@webgamekit/strudel-flow'
import type {
  StrudelFlowFunctionData,
  StrudelFlowFunctionParameter
} from '@webgamekit/strudel-flow'
import strudelDocumentation from './codeEditor/strudelDocumentation.json'
import { STRUDEL_API_GROUP_DEFINITIONS } from './strudelApiGroups'
import type {
  StrudelApiEntry,
  StrudelApiGroupEntries,
  StrudelApiGroupId,
  StrudelFunctionDocumentation,
  StrudelFunctionParameter
} from './types'

const GROUP_BY_NAME = new Map<string, StrudelApiGroupId>(
  STRUDEL_API_GROUP_DEFINITIONS.flatMap((group) =>
    group.names.map((name): [string, StrudelApiGroupId] => [name, group.id])
  )
)

const GROUP_BY_ID = new Map(STRUDEL_API_GROUP_DEFINITIONS.map((group) => [group.id, group]))

const identifierCharacter = /[\w$]/

const isStringQuote = (character: string): boolean =>
  character === '"' || character === "'" || character === '`'

const isCommentStart = (code: string, index: number): boolean =>
  code[index] === '/' && (code[index + 1] === '/' || code[index + 1] === '*')

// A quoted string is skipped whole, escapes included, so a bracket inside it never counts.
const skipString = (code: string, start: number): number => {
  const quote = code[start]
  const step = (index: number): number =>
    index >= code.length
      ? code.length
      : code[index] === '\\'
        ? step(index + 2)
        : code[index] === quote
          ? index + 1
          : step(index + 1)
  return step(start + 1)
}

const skipComment = (code: string, start: number): number => {
  if (code[start + 1] === '/') {
    const end = code.indexOf('\n', start)
    return end === -1 ? code.length : end
  }
  const end = code.indexOf('*/', start + 2)
  return end === -1 ? code.length : end + 2
}

const skipWhitespace = (text: string, index: number): number =>
  index < text.length && /\s/.test(text[index]) ? skipWhitespace(text, index + 1) : index

/**
 * The text inside the parentheses that open at `openIndex`.
 * @param code - the source text
 * @param openIndex - where the opening parenthesis is
 * @param index - the position being read
 * @param depth - how many parentheses are open at that position
 * @returns the inner text, or null when the parentheses never close
 */
const readBalancedParentheses = (
  code: string,
  openIndex: number,
  index = openIndex,
  depth = 0
): string | null => {
  if (index >= code.length) {
    return null
  }
  const character = code[index]
  if (isStringQuote(character)) {
    return readBalancedParentheses(code, openIndex, skipString(code, index), depth)
  }
  if (isCommentStart(code, index)) {
    return readBalancedParentheses(code, openIndex, skipComment(code, index), depth)
  }
  if (character === '(') {
    return readBalancedParentheses(code, openIndex, index + 1, depth + 1)
  }
  if (character === ')') {
    const nextDepth = depth - 1
    return nextDepth === 0
      ? code.slice(openIndex + 1, index)
      : readBalancedParentheses(code, openIndex, index + 1, nextDepth)
  }
  return readBalancedParentheses(code, openIndex, index + 1, depth)
}

const findCallArgumentsFrom = (example: string, name: string, index: number): string | null => {
  if (index >= example.length) {
    return null
  }
  const character = example[index]
  if (isStringQuote(character)) {
    return findCallArgumentsFrom(example, name, skipString(example, index))
  }
  if (isCommentStart(example, index)) {
    return findCallArgumentsFrom(example, name, skipComment(example, index))
  }
  const before = example[index - 1] ?? ''
  const after = example[index + name.length] ?? ''
  const isWholeName =
    example.startsWith(name, index) &&
    !identifierCharacter.test(before) &&
    !identifierCharacter.test(after)
  if (isWholeName) {
    const openIndex = skipWhitespace(example, index + name.length)
    if (example[openIndex] === '(') {
      return readBalancedParentheses(example, openIndex)
    }
  }
  return findCallArgumentsFrom(example, name, index + 1)
}

/**
 * The arguments of the first `name(...)` call in an example.
 * @param example - the documented example
 * @param name - the function name to find
 * @returns the argument text, or null when the example has no such call
 */
const findCallArguments = (example: string, name: string): string | null =>
  findCallArgumentsFrom(example, name, 0)

const splitArgumentsFrom = (
  argumentsText: string,
  index: number,
  depth: number,
  start: number,
  found: string[]
): string[] => {
  if (index >= argumentsText.length) {
    return [...found, argumentsText.slice(start).trim()]
  }
  const character = argumentsText[index]
  if (isStringQuote(character)) {
    return splitArgumentsFrom(argumentsText, skipString(argumentsText, index), depth, start, found)
  }
  if (isCommentStart(argumentsText, index)) {
    return splitArgumentsFrom(argumentsText, skipComment(argumentsText, index), depth, start, found)
  }
  if ('([{'.includes(character)) {
    return splitArgumentsFrom(argumentsText, index + 1, depth + 1, start, found)
  }
  if (')]}'.includes(character)) {
    return splitArgumentsFrom(argumentsText, index + 1, depth - 1, start, found)
  }
  return character === ',' && depth === 0
    ? splitArgumentsFrom(argumentsText, index + 1, depth, index + 1, [
        ...found,
        argumentsText.slice(start, index).trim()
      ])
    : splitArgumentsFrom(argumentsText, index + 1, depth, start, found)
}

/**
 * The top-level comma separated arguments of a call, keeping nested commas and strings whole.
 * @param argumentsText - the text between the call's parentheses
 * @returns one string per argument
 */
const splitArguments = (argumentsText: string): string[] =>
  argumentsText.trim().length === 0 ? [] : splitArgumentsFrom(argumentsText, 0, 0, 0, [])

const readExampleArguments = (functionDocumentation: StrudelFunctionDocumentation): string[] => {
  const names = [functionDocumentation.name, ...functionDocumentation.synonyms]
  const argumentsText = functionDocumentation.examples
    .flatMap((example) => names.map((name) => findCallArguments(example, name)))
    .find((found) => found !== null)
  return argumentsText === undefined || argumentsText === null ? [] : splitArguments(argumentsText)
}

const firstNumber = (text: string): number | null => {
  const match = /-?\d+(?:\.\d+)?/.exec(text)
  return match === null ? null : Number(match[0])
}

const readDocumentedRange = (description: string): { min: number; max: number } | null => {
  const match = /between (-?\d+(?:\.\d+)?) and (-?\d+(?:\.\d+)?)/i.exec(description)
  return match === null ? null : { min: Number(match[1]), max: Number(match[2]) }
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const createParameter = (
  documentation: StrudelFunctionParameter,
  argument: string | undefined
): StrudelFlowFunctionParameter => {
  const written = argument ?? ''
  const type = documentation.type.toLowerCase()
  const shared = { name: documentation.name, label: documentation.name }
  if (type.includes('number')) {
    const seed = firstNumber(written) ?? 0
    const range = readDocumentedRange(documentation.description)
    const min = range?.min ?? 0
    const max = range?.max ?? Math.max(seed * 2, 1)
    const step = max - min > 100 ? 1 : Number.isInteger(seed) ? 1 : 0.01
    return { kind: 'number', ...shared, min, max, step, value: clamp(seed, min, max) }
  }
  if (type.includes('boolean')) {
    return { kind: 'boolean', ...shared, value: written.trim() !== 'false' }
  }
  return { kind: 'text', ...shared, value: written }
}

/** Every documented function the list shows, in alphabetical order, with the page that documents it. */
export const STRUDEL_API_ENTRIES: StrudelApiEntry[] = strudelDocumentation.flatMap(
  (functionDocumentation) => {
    const group = GROUP_BY_NAME.get(functionDocumentation.name)
    const groupDefinition = group === undefined ? undefined : GROUP_BY_ID.get(group)
    return groupDefinition === undefined
      ? []
      : [
          {
            ...functionDocumentation,
            group: groupDefinition.id,
            docsUrl: `${groupDefinition.docsUrl}#${functionDocumentation.name.toLowerCase()}`
          }
        ]
  }
)

/**
 * The documented function a name or synonym refers to.
 * @param name - a function name or one of its synonyms
 * @returns the entry, or null when no visible function is called that
 */
export const findStrudelApiEntry = (name: string): StrudelApiEntry | null =>
  STRUDEL_API_ENTRIES.find((entry) => entry.name === name || entry.synonyms.includes(name)) ?? null

/**
 * Whether a function matches what has been typed: its name, a synonym or its description.
 * @param entry - the function
 * @param query - the search text
 * @returns true for an empty query, or when one of the texts contains it
 */
export const matchesStrudelApiSearch = (entry: StrudelApiEntry, query: string): boolean => {
  const search = query.trim().toLowerCase()
  return (
    search === '' ||
    [entry.name, ...entry.synonyms, entry.description].some((text) =>
      text.toLowerCase().includes(search)
    )
  )
}

/**
 * The functions under their headings, headings without a function left out.
 * @param entries - the functions to place, already searched
 * @returns the headings in their catalog order, each with its functions
 */
export const groupStrudelApiEntries = (entries: StrudelApiEntry[]): StrudelApiGroupEntries[] =>
  STRUDEL_API_GROUP_DEFINITIONS.map((group) => ({
    id: group.id,
    label: group.label,
    hint: group.hint,
    docsUrl: group.docsUrl,
    entries: entries.filter((entry) => entry.group === group.id)
  })).filter((group) => group.entries.length > 0)

/**
 * The generic node Add creates for a function: its call, a control per documented argument, and
 * the page that explains it. The example only seeds the controls; nothing else from it is used.
 * @param entry - the documented function
 * @returns fresh node data for a function node
 */
export const createStrudelApiFunctionData = (entry: StrudelApiEntry): StrudelFlowFunctionData => {
  const exampleArguments = isStrudelFlowCombinerName(entry.name) ? [] : readExampleArguments(entry)
  const parameters = isStrudelFlowCombinerName(entry.name)
    ? []
    : entry.params.length > 0
      ? entry.params.map((parameter, index) => createParameter(parameter, exampleArguments[index]))
      : exampleArguments.length === 0
        ? []
        : [
            {
              kind: 'text' as const,
              name: 'arguments',
              label: 'arguments',
              value: exampleArguments.join(', ')
            }
          ]
  return {
    kind: 'function',
    name: entry.name,
    description: entry.description,
    docsUrl: entry.docsUrl,
    parameters
  }
}
