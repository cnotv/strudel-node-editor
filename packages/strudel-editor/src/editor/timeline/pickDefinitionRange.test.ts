import { describe, expect, it } from 'vitest'
import { pickDefinitionRange } from './pickDefinitionRange'

const code = 'const kit = "<0 1>"\n$: s("bd ~ sd").mask(kit)'
const kitRange = { from: 12, to: 19 }
const bassRange = { from: code.indexOf('"bd'), to: code.indexOf('sd"') + 3 }

describe('pickDefinitionRange', () => {
  it.each([
    ['the span that names the sound, not a chained mask', [kitRange, bassRange], 'bd', bassRange],
    ['the first span when none names the sound', [kitRange, bassRange], 'notes', kitRange],
    ['nothing when the event has no span', [], 'bd', null]
  ])('picks %s', (_, ranges, laneName, expected) => {
    // Act
    const picked = pickDefinitionRange(ranges, laneName, code)

    // Assert
    expect(picked).toEqual(expected)
  })
})
