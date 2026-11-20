/**
 * Regenerates the example sprites in `documentation/static/img/sound-check/`: one vertical strip
 * of equal panels for the waveform table and one for the spectrogram table of
 * `guides/sound-check.md`, a panel for every row in the table's order. The `SoundCase` component
 * crops a panel by its index. The sounds are synthesised by ffmpeg, so the sprites are
 * deterministic, need no dev server and play nothing.
 *
 * Usage:
 *   node scripts/sound-check-examples.mjs [--out documentation/static/img/sound-check]
 * Needs `ffmpeg`. Keep the panel sizes in sync with `documentation/src/components/SoundCase`.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

const SAMPLE_RATE = 48000
const SECONDS = 2

const synth = (expression) => `aevalsrc='${expression}':d=${SECONDS}:s=${SAMPLE_RATE}`
const noise = (amplitude) => `anoisesrc=d=${SECONDS}:r=${SAMPLE_RATE}:a=${amplitude}:c=white`
const harmonics = (fundamental, count) =>
  Array.from(
    { length: count },
    (_, index) => `sin(2*PI*${fundamental * (index + 1)}*t)/${index + 1}`
  ).join('+')

const WAVEFORM_PANEL = 's=560x150'
const SPECTROGRAM_PANEL = 's=560x260'

// Panels follow the rows of the tables in the guide, top to bottom.
const SPRITES = [
  {
    name: 'waveform-cases',
    picture: `showwavespic=${WAVEFORM_PANEL}:split_channels=1`,
    sources: [
      `anullsrc=r=${SAMPLE_RATE}:d=${SECONDS}`,
      synth('clip(3*sin(2*PI*220*t),-1,1)'),
      synth('0.9*sin(2*PI*60*t)*(0.55+0.45*exp(-6*mod(t,0.5)))'),
      synth('0.9*sin(2*PI*60*t)*exp(-2.5*t)'),
      synth('0.9*sin(2*PI*220*t)|0.12*sin(2*PI*220*t)'),
      synth('0.9*sin(2*PI*80*t)*exp(-15*mod(t,0.5))*(1-eq(floor(t/0.5),2))')
    ]
  },
  {
    name: 'spectrogram-cases',
    picture: `showspectrumpic=${SPECTROGRAM_PANEL}:legend=0`,
    sources: [
      synth('0.8*(random(0)*2-1)*exp(-60*mod(t,0.25))'),
      synth('0.5*sin(2*PI*4000*t)'),
      synth(`0.3*(${harmonics(1500, 12)})`),
      synth('0.5*sin(2*PI*3000*t)*(1-between(t,0.8,1.2))'),
      synth('0.9*sin(2*PI*50*t)'),
      `${noise(0.5)},${Array.from({ length: 4 }, () => 'lowpass=f=16000').join(',')}`,
      noise(0.3),
      synth('0.25*(sin(2*PI*3000*t)+sin(2*PI*3120*t)+sin(2*PI*3240*t))')
    ]
  }
]

const runFfmpeg = (args) =>
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: ['ignore', 'ignore', 'inherit'] })

const drawPanel = (scratch, { name, picture }, source, index) => {
  const panelPath = join(scratch, `${name}-${index}.png`)
  runFfmpeg(['-f', 'lavfi', '-i', source, '-lavfi', picture, '-frames:v', '1', panelPath])
  return panelPath
}

const stackPanels = (panelPaths, outputPath) =>
  runFfmpeg([
    ...panelPaths.flatMap((panelPath) => ['-i', panelPath]),
    '-filter_complex',
    `vstack=inputs=${panelPaths.length}`,
    '-q:v',
    '4',
    '-frames:v',
    '1',
    outputPath
  ])

const { values } = parseArgs({
  options: { out: { type: 'string', default: 'documentation/static/img/sound-check' } }
})
const outputDirectory = resolve(values.out)
mkdirSync(outputDirectory, { recursive: true })
const scratch = mkdtempSync(join(tmpdir(), 'sound-check-examples-'))

SPRITES.forEach((sprite) => {
  const panelPaths = sprite.sources.map((source, index) =>
    drawPanel(scratch, sprite, source, index)
  )
  const outputPath = join(outputDirectory, `${sprite.name}.jpg`)
  stackPanels(panelPaths, outputPath)
  console.log(outputPath)
})
