import type { StrudelFlowNodeKind } from '@webgamekit/strudel-flow'
import strudelDocumentation from './codeEditor/strudelDocumentation.json'
import { STRUDEL_API_GROUP_DEFINITIONS, STRUDEL_API_NODE_BY_NAME } from './strudelApiGroups'
import type {
  StrudelApiAddTarget,
  StrudelApiEntry,
  StrudelApiGroupEntries,
  StrudelApiGroupId,
  StrudelFunctionDocumentation
} from './types'

const GROUP_BY_NAME = new Map<string, StrudelApiGroupId>(
  STRUDEL_API_GROUP_DEFINITIONS.flatMap((group) =>
    group.names.map((name): [string, StrudelApiGroupId] => [name, group.id])
  )
)

const findNodeKind = (
  functionDocumentation: StrudelFunctionDocumentation
): Exclude<StrudelFlowNodeKind, 'code'> | undefined =>
  [functionDocumentation.name, ...functionDocumentation.synonyms]
    .map((name) => STRUDEL_API_NODE_BY_NAME[name])
    .find((kind) => kind !== undefined)

const findAddTarget = (
  functionDocumentation: StrudelFunctionDocumentation
): StrudelApiAddTarget | null => {
  const kind = findNodeKind(functionDocumentation)
  if (kind !== undefined) {
    return { kind }
  }
  const example = functionDocumentation.examples[0]
  return example === undefined ? null : { kind: 'code', code: example }
}

/** Every documented function the list shows, in alphabetical order, with what Add creates for it. */
export const STRUDEL_API_ENTRIES: StrudelApiEntry[] = strudelDocumentation.flatMap(
  (functionDocumentation) => {
    const group = GROUP_BY_NAME.get(functionDocumentation.name)
    return group === undefined
      ? []
      : [{ ...functionDocumentation, group, add: findAddTarget(functionDocumentation) }]
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
    entries: entries.filter((entry) => entry.group === group.id)
  })).filter((group) => group.entries.length > 0)
