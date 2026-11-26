import type { StrudelTimelineLane } from '../types'

const IDENTIFIER_CHARACTER = /[\w$]/
const OPENING = '([{'
const CLOSING = ')]}'

const readWordAt = (code: string, position: number): string => {
  const isWordAt = (index: number): boolean => IDENTIFIER_CHARACTER.test(code.charAt(index))
  const start = Array.from({ length: position }, (_, offset) => position - 1 - offset).find(
    (index) => !isWordAt(index)
  )
  const wordStart = (start ?? -1) + 1
  const wordEnd = code.slice(position).search(/[^\w$]/)
  return code.slice(wordStart, wordEnd === -1 ? code.length : position + wordEnd)
}

type ScanState = { depth: number; quote: string; end: number }

// Brackets inside a string, such as the `[e4,b4]` of a mini-notation, do not nest the code.
const scanStatementEnd = (code: string, from: number): number =>
  [...code.slice(from)].reduce<ScanState>(
    (state, character, offset) => {
      if (state.end !== -1) {
        return state
      }
      if (state.quote !== '') {
        return { ...state, quote: character === state.quote ? '' : state.quote }
      }
      if ('"\'`'.includes(character)) {
        return { ...state, quote: character }
      }
      const depth =
        state.depth + (OPENING.includes(character) ? 1 : 0) - (CLOSING.includes(character) ? 1 : 0)
      return character === '\n' && depth === 0
        ? { ...state, depth, end: from + offset }
        : { ...state, depth }
    },
    { depth: 0, quote: '', end: -1 }
  ).end

type Definition = { from: number; to: number }

const findDefinition = (code: string, name: string): Definition | null => {
  const escaped = name.replace(/\$/g, '\\$&')
  const match = new RegExp(`^(?:const|let|var)\\s+${escaped}\\s*=`, 'm').exec(code)
  if (match === null) {
    return null
  }
  const end = scanStatementEnd(code, match.index)
  return { from: match.index, to: end === -1 ? code.length : end }
}

const collectDefinitions = (code: string, name: string, visited: string[]): Definition[] => {
  const definition = findDefinition(code, name)
  if (definition === null || visited.includes(name)) {
    return []
  }
  const body = code.slice(definition.from, definition.to)
  const referenced = [...new Set(body.match(/[\w$]+/g) ?? [])].filter((word) => word !== name)
  return [
    definition,
    ...referenced.flatMap((word) => collectDefinitions(code, word, [...visited, name]))
  ]
}

/**
 * Finds the timeline lanes a variable in the code produces, so Ctrl+click on a variable can
 * point at its instruments even when the same code is reused in several places.
 * @param code - the pattern code
 * @param position - where in the code the click landed
 * @param lanes - the lanes of the measured pattern
 * @returns the names of the lanes whose code lies inside the variable or the variables it uses
 */
export const findVariableLanes = (
  code: string,
  position: number,
  lanes: StrudelTimelineLane[]
): string[] => {
  const definitions = collectDefinitions(code, readWordAt(code, position), [])
  return lanes
    .filter((lane) =>
      lane.sourceRanges.some((range) =>
        definitions.some((definition) => range.from >= definition.from && range.to <= definition.to)
      )
    )
    .map((lane) => lane.name)
}
