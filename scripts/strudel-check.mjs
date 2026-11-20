/**
 * The sound's equivalent of a screenshot: renders a pattern muted through the editor's export,
 * measures the WAV and the MIDI, and draws a spectrogram and a waveform to attach to a pull
 * request. Exits non-zero when an expectation fails, so a sound change can be checked without
 * listening.
 *
 * Needs the dev server running (`pnpm dev --port <port> --strictPort`) and `ffmpeg`.
 *
 * Usage:
 *   node scripts/strudel-check.mjs <pattern.strudel> --out-dir <dir> [--url http://localhost:5317]
 *     [--cycles 1 | --once] [--min-peak 0.1] [--max-clipped 0] [--max-silence 0.5]
 *     [--duration 2] [--tracks bd,sawtooth]
 * Writes <name>.wav, <name>.mid, <name>.spectrogram.png, <name>.waveform.png and
 * <name>.report.json into the output directory.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { analyzeMidi, analyzeWav, checkExpectations } from './sound-report.mjs'

const EXPORT_SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'strudel-export.mjs')

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'out-dir': { type: 'string' },
    url: { type: 'string', default: 'http://localhost:5317' },
    cycles: { type: 'string', default: '1' },
    once: { type: 'boolean', default: false },
    'min-peak': { type: 'string' },
    'max-clipped': { type: 'string' },
    'max-silence': { type: 'string' },
    duration: { type: 'string' },
    tracks: { type: 'string' }
  }
})

const [patternFile] = positionals
if (!patternFile || !values['out-dir']) {
  console.error('Usage: node scripts/strudel-check.mjs <pattern> --out-dir <dir>')
  process.exit(1)
}

const outputDirectory = resolve(values['out-dir'])
const name = basename(patternFile, extname(patternFile))
const outputPath = (suffix) => join(outputDirectory, `${name}${suffix}`)
const toNumber = (text) => (text === undefined ? undefined : Number(text))
mkdirSync(outputDirectory, { recursive: true })

const render = (extension) =>
  execFileSync(
    'node',
    [
      EXPORT_SCRIPT,
      patternFile,
      '--out',
      outputPath(extension),
      '--url',
      values.url,
      ...(values.once ? ['--once'] : ['--cycles', values.cycles])
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] }
  )

const draw = (filter, suffix) =>
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-v',
      'error',
      '-i',
      outputPath('.wav'),
      '-lavfi',
      filter,
      '-frames:v',
      '1',
      outputPath(suffix)
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] }
  )

render('.wav')
render('.mid')
draw('showspectrumpic=s=1200x400:legend=1', '.spectrogram.png')
draw('showwavespic=s=1200x240', '.waveform.png')

const report = {
  wav: analyzeWav(readFileSync(outputPath('.wav'))),
  midi: analyzeMidi(readFileSync(outputPath('.mid')))
}
const failures = checkExpectations(report, {
  minPeak: toNumber(values['min-peak']),
  maxClipped: toNumber(values['max-clipped']),
  maxSilence: toNumber(values['max-silence']),
  duration: toNumber(values.duration),
  tracks: values.tracks?.split(',')
})
writeFileSync(outputPath('.report.json'), JSON.stringify({ ...report, failures }, null, 2))

console.log(JSON.stringify(report, null, 2))
failures.forEach((failure) => console.error(`FAIL: ${failure}`))
process.exitCode = failures.length ? 1 : 0
