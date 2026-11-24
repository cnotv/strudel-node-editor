import { describe, expect, it } from 'vitest'
import strudelDocumentation from './codeEditor/strudelDocumentation.json'
import { STRUDEL_API_GROUP_DEFINITIONS, STRUDEL_API_HIDDEN_NAMES } from './strudelApiGroups'
import {
  STRUDEL_API_ENTRIES,
  createStrudelApiFunctionData,
  findStrudelApiEntry,
  groupStrudelApiEntries,
  matchesStrudelApiSearch
} from './strudelApiCatalog'

const documentedNames = strudelDocumentation.map((documentation) => documentation.name)
const visibleNames = STRUDEL_API_GROUP_DEFINITIONS.flatMap((group) => group.names)
const listedNames = [...visibleNames, ...STRUDEL_API_HIDDEN_NAMES]

describe('strudelApiCatalog', () => {
  it('accounts for every documented name in exactly one group or the hidden list', () => {
    // Arrange / Act
    const uniqueListedNames = new Set(listedNames)

    // Assert
    expect(uniqueListedNames.size).toBe(listedNames.length)
    expect([...listedNames].sort()).toEqual([...documentedNames].sort())
  })

  it('lists every visible function in documentation order', () => {
    // Arrange
    const hiddenNames = new Set(STRUDEL_API_HIDDEN_NAMES)

    // Act
    const entryNames = STRUDEL_API_ENTRIES.map((entry) => entry.name)

    // Assert
    expect(entryNames).toEqual(
      documentedNames.filter((documentedName) => !hiddenNames.has(documentedName))
    )
  })

  it('keeps setup and internals out of the list', () => {
    // Arrange
    const entryNames = STRUDEL_API_ENTRIES.map((entry) => entry.name)

    // Assert
    expect(STRUDEL_API_HIDDEN_NAMES).toContain('setcpm')
    expect(STRUDEL_API_HIDDEN_NAMES).toContain('samples')
    expect(entryNames).not.toContain('setcpm')
    expect(entryNames).not.toContain('samples')
  })

  it('groups every function under a heading with its count', () => {
    // Arrange / Act
    const groups = groupStrudelApiEntries(STRUDEL_API_ENTRIES)

    // Assert
    expect(groups.map((group) => group.id)).toEqual(
      STRUDEL_API_GROUP_DEFINITIONS.map((group) => group.id)
    )
    expect(groups.reduce((count, group) => count + group.entries.length, 0)).toBe(
      STRUDEL_API_ENTRIES.length
    )
  })

  it('finds a function by its synonym and matches it in a search', () => {
    // Arrange
    const soundEntry = findStrudelApiEntry('sound')

    // Assert
    expect(soundEntry?.name).toBe('s')
    expect(soundEntry !== null && matchesStrudelApiSearch(soundEntry, 'sound')).toBe(true)
  })

  it('matches a description and returns nothing for a nonsense query', () => {
    // Arrange
    const lpfEntry = findStrudelApiEntry('lpf')
    const nonsenseMatches = STRUDEL_API_ENTRIES.filter((entry) =>
      matchesStrudelApiSearch(entry, 'zzzzzz')
    )

    // Assert
    expect(lpfEntry !== null && matchesStrudelApiSearch(lpfEntry, 'cutoff')).toBe(true)
    expect(nonsenseMatches).toEqual([])
  })

  it('links every function to its learn page', () => {
    // Assert
    expect(findStrudelApiEntry('lpf')?.docsUrl).toBe('https://strudel.cc/learn/effects/#lpf')
    expect(
      STRUDEL_API_ENTRIES.every((entry) => entry.docsUrl.startsWith('https://strudel.cc/learn/'))
    ).toBe(true)
  })

  it('builds a generic function node with a control per documented argument', () => {
    // Arrange
    const lpfEntry = findStrudelApiEntry('lpf')!

    // Act
    const data = createStrudelApiFunctionData(lpfEntry)

    // Assert
    expect(data.kind).toBe('function')
    expect(data.name).toBe('lpf')
    expect(data.docsUrl).toBe(lpfEntry.docsUrl)
    expect(data.parameters.map((parameter) => parameter.name)).toEqual(
      lpfEntry.params.map((parameter) => parameter.name)
    )
    expect(data.parameters[0].kind).toBe('number')
  })
})
