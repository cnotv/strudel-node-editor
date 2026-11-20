// @vitest-environment node
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const BUILD_TIMEOUT_MS = 60_000
// Matches a worker started from "/assets/..." with or without new URL(), which a host serves from
// its own root, where the package's files are not.
const ABSOLUTE_WORKER_URL = /new Worker\(\s*(?:new URL\(\s*)?(?:\/\*[^*]*\*\/\s*)?["'`]\//

const readBuiltScripts = async (outputDirectory: string): Promise<Record<string, string>> => {
  const fileNames = (await readdir(outputDirectory)).filter((fileName) => fileName.endsWith('.js'))
  const sources = await Promise.all(
    fileNames.map((fileName) => readFile(join(outputDirectory, fileName), 'utf8'))
  )
  return Object.fromEntries(fileNames.map((fileName, index) => [fileName, sources[index]]))
}

describe('the built package', () => {
  const state: { outputDirectory: string; scripts: Record<string, string> } = {
    outputDirectory: '',
    scripts: {}
  }

  beforeAll(async () => {
    state.outputDirectory = await mkdtemp(join(tmpdir(), 'strudel-editor-build-'))
    await build({
      root: packageRoot,
      logLevel: 'silent',
      build: { outDir: state.outputDirectory, emptyOutDir: true, sourcemap: false }
    })
    state.scripts = await readBuiltScripts(state.outputDirectory)
  }, BUILD_TIMEOUT_MS)

  afterAll(() => rm(state.outputDirectory, { recursive: true, force: true }))

  it('loads its workers from beside itself, never from the host origin root', () => {
    // Arrange
    const workerLoaders = Object.entries(state.scripts).filter(([, source]) =>
      source.includes('new Worker(')
    )

    // Act
    const absoluteLoaders = workerLoaders
      .filter(([, source]) => ABSOLUTE_WORKER_URL.test(source))
      .map(([fileName]) => fileName)

    // Assert
    expect(workerLoaders.length).toBeGreaterThan(0)
    expect(absoluteLoaders).toEqual([])
  })
})
