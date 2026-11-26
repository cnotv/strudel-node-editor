import type { StrudelSourceRange } from '../types'

const readWordAt = (code: string, position: number): StrudelSourceRange => {
  const before = code.slice(0, position).match(/[\w$]*$/)?.[0] ?? ''
  const after = code.slice(position).match(/^[\w$]*/)?.[0] ?? ''
  return { from: position - before.length, to: position + after.length }
}

/**
 * Finds where the variable under a click is declared, for Ctrl+click to jump to.
 * @param code - the pattern code
 * @param position - where in the code the click landed
 * @returns the span of the name in its `const`, `let` or `var`, or null when the word is not a
 * declared variable or the click is already on that name
 */
export const findVariableDefinition = (
  code: string,
  position: number
): StrudelSourceRange | null => {
  const word = readWordAt(code, position)
  const name = code.slice(word.from, word.to)
  if (name === '') {
    return null
  }
  const declaration = new RegExp(`^(?:const|let|var)\\s+(${name.replace(/\$/g, '\\$')})\\s*=`, 'm')
  const match = declaration.exec(code)
  if (match === null) {
    return null
  }
  const from = match.index + match[0].indexOf(name, match[0].search(/\s/))
  return from === word.from ? null : { from, to: from + name.length }
}
