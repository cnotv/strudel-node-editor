import { describe, expect, it } from 'vitest'
import { findVariableDefinition } from './findVariableDefinition'

const code = ['const stab = s("triangle")', 'const mix = stack(', '  stab.gain(.3)', ')'].join('\n')

describe('findVariableDefinition', () => {
  it('finds the name where the variable is declared', () => {
    // Act
    const range = findVariableDefinition(code, code.lastIndexOf('stab') + 2)

    // Assert
    expect(range).toEqual({ from: code.indexOf('stab'), to: code.indexOf('stab') + 4 })
  })

  it('finds nothing for a word that is not a declared variable', () => {
    // Act
    const range = findVariableDefinition(code, code.indexOf('stack') + 1)

    // Assert
    expect(range).toBeNull()
  })

  it('finds nothing when the click is on the declaration itself', () => {
    // Act
    const range = findVariableDefinition(code, code.indexOf('stab') + 1)

    // Assert
    expect(range).toBeNull()
  })
})
