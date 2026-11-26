import type {
  DrumSound,
  ImportCodeOptions,
  StrudelExample,
  StrudelExportOptions,
  StrudelInstrumentRole,
  StrudelMusicStyle,
  StrudelPatternIdea,
  StrudelSampleBank,
  StrudelSoundFilter,
  StrudelTabId,
  StrudelVisualName,
  TranscriptionStage
} from './types'

/**
 * The Strudel audio engine stays under AGPL-3.0-or-later while this repo is MIT.
 * Depending on it here means a deployed build of this view carries that obligation.
 */
export const STRUDEL_LICENSE = 'AGPL-3.0-or-later'

export const STRUDEL_ENGINE_URL = 'https://codeberg.org/uzu/strudel'

export const STRUDEL_EXAMPLES: StrudelExample[] = [
  {
    id: 'first-beat',
    label: 'First beat',
    code: 's("bd sd, hh*8")'
  },
  {
    id: 'four-floor',
    label: 'Four floor',
    code: 's("bd*4, hh*8, sd(3,4)")'
  },
  {
    id: 'bass-jux',
    label: 'Bass jux',
    code: 's("bd*2,hh(3,4),jvbass(5,8,1)").jux(rev)'
  },
  {
    id: 'soft-melody',
    label: 'Soft melody',
    code: 'note("c3 [e3 g3] a3 [g3 e3]").s("triangle").lpf(800)'
  },
  {
    id: 'coin',
    label: 'Coin',
    code: 'note("b5 e6@3 ~@4").s("square").decay(.4).sustain(0).gain(.4).fast(2)'
  },
  {
    id: 'sliders-and-scopes',
    label: 'Sliders and scopes',
    code: `// Drag the sliders while it plays; the pianoroll and scope draw under their lines.
$: note("<c3 eb3 g3 bb3>*8").s("sawtooth")
  .lpf(slider(1200, 200, 4000))
  .delay(slider(0.4))
  .pan(rand)
  ._pianoroll()
$: note("<c2 c2 g1 bb1>").s("square").lpf(400)
  ._scope()
$: s("bd*4, [~ hh]*4")`
  },
  {
    id: 'punchcard-drums',
    label: 'Punchcard drums',
    code: `// One row per drum and one block per hit; the blocks light up as they play.
stack(
  s("bd*2 [~ bd] ~").color("lightpink"),
  s("~ sd ~ sd").color("plum"),
  s("hh*8").gain(.6).color("lightblue"),
  s("~ ~ ~ cp").color("palegreen")
)._punchcard()`
  },
  {
    id: 'punchcard-vs-pianoroll',
    label: 'Punchcard vs pianoroll',
    code: `// From strudel.cc's visual feedback guide: both draw the same notes as a pianoroll.
// _punchcard draws the pattern after everything chained onto it, so the cyan shows.
// _pianoroll draws the pattern as it stands at that call, so its notes stay white.
$: note("c a f e").color("white")
  ._punchcard()
  .color("cyan")
$: note("c a f e").color("white")
  ._pianoroll()
  .color("cyan")`
  },
  {
    id: 'scope',
    label: 'Scope',
    code: `// From strudel.cc's visual feedback guide: the scope draws the waveform as it sounds.
// A sawtooth climbs and drops, so its scope is a row of ramps.
$: s("sawtooth")._scope()
// Options: thickness, scale (height), pos (0 top to 1 bottom), align and trigger.
// The line takes its colour from .color(), which the scope reads off the pattern.
$: note("<c4 eb4 g4 bb4>*2").s("triangle").gain(.6).color("plum")
  ._scope({ thickness: 2, scale: .5 })`
  },
  {
    id: 'spiral',
    label: 'Spiral',
    code: `// The spiral turns once per cycle and draws each note along it as it plays.
$: note("c2 a2 eb2")
  .euclid(5, 8)
  .s("sawtooth")
  .lpenv(4).lpf(300)
  .color("plum")
  ._spiral({ steady: .96, inset: 2, colorizeInactive: 1 })
$: s("bd*4, [~ hh]*4").gain(.8)`
  },
  {
    id: 'pitch-wheel',
    label: 'Pitch wheel',
    code: `// The twelve pitch classes sit round a wheel; the notes playing now join into a shape.
chord("<Cm7 Fm7 Ab^7 G7>")
  .voicing()
  .s("triangle")
  .room(.4)
  .color("lightblue")
  ._pitchwheel()`
  },
  {
    id: 'spectrum',
    label: 'Spectrum',
    code: `// The spectrum shows how loud each frequency is, scrolling as the sound changes.
n("<0 4 <2 3> 1>*3")
  .off(1/8, add(n(5)))
  .off(1/5, add(n(7)))
  .scale("d3:minor:pentatonic")
  .s("sine")
  .dec(.3).room(.5)
  .color("palegreen")
  ._spectrum()`
  },
  {
    id: 'pianoroll-behind',
    label: 'Pianoroll behind the code',
    code: `// Without the underscore, a visual fills the editor behind the code.
$: stack(
  note("<[c3,eb3,g3] [ab2,c3,eb3] [bb2,d3,f3] [g2,bb2,d3]>")
    .s("sawtooth").lpf(1200).release(.3).gain(.5).color("thistle"),
  note("<c2 ab1 bb1 g1>*8").s("square").lpf(400).gain(.6).color("lightpink"),
  note("<[g4 eb4] [c5 ~] [d5 f5] [~ bb4]>*2").s("triangle").delay(.3).color("lightblue")
).pianoroll({ cycles: 4, playhead: .5, fold: 0, minMidi: 30, maxMidi: 84 })
$: s("bd*4, [~ hh]*4").gain(.8)`
  },
  {
    id: 'stoner-riff',
    label: 'Stoner riff',
    code: `// Stoner riff: a downtuned fuzz riff in C at 72 BPM
// Sixteen bars: two bars of guitar alone, the riff, a lifted answer, a slow breakdown and a last hit.
// Instruments: guitars stoner_chord and stoner_mute, bass sawtooth, drums default kit
setcpm(18)

const roots = arrange(
  [8, "<c2 c2 ds2 f2>"],
  [4, "<ds2 fs2 f2 c2>"],
  [3, "c2"],
  [1, "c2"]
)
const riffHits = "x ~ ~ ~ ~ ~ x ~ ~ ~ x ~ ~ ~ ~ ~"
const chordHits = arrange([14, riffHits], [2, "x ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~"])
const chugHits = arrange([14, "~ x x ~ x x ~ ~ ~ ~ x x ~ ~ ~ ~"], [2, silence])
const bassHits = "x ~ x x ~ ~ x ~ x ~ x ~ ~ x ~ ~"
const drummed = arrange([2, "0"], [13, "1"], [1, "0"])
const lastBar = arrange([15, silence], [1, "x"])

$: note(roots).s("stoner_chord").struct(chordHits).cut(1).gain(.4)
$: note(roots).s("stoner_mute").struct(chugHits).gain(.32)
$: note(roots).add(note(-12)).s("sawtooth").struct(bassHits).lpf(300).decay(.25).sustain(.2).gain(.7)
$: s("bd").struct(riffHits).mask(drummed).gain(.4)
$: s("sd").struct("~ ~ ~ ~ x ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~").mask(drummed).gain(.4)
$: s("hh*8").mask(drummed).gain(.2)
$: s("cr").struct(lastBar).gain(.25)`
  }
]

export const DEFAULT_STRUDEL_EXAMPLE_ID = 'uptown-strut'
/** The repository link at the bottom of the drawer. */
export const STRUDEL_REPOSITORY_URL = 'https://github.com/cnotv/strudel-node-editor'
/** The embedding guide, linked beside the repository. */
export const STRUDEL_DOCUMENTATION_URL = 'https://cnotv.github.io/strudel-node-editor/'
/** Strudel's own reference, linked beside this editor's guide. */
export const STRUDEL_OFFICIAL_DOCUMENTATION_URL = 'https://strudel.cc/learn/getting-started/'
/** Where the code on screen is kept between visits. */
/** Where the volume is remembered; an agent or script that drives the page writes "0" here first, so nothing plays aloud. */
export const STRUDEL_VOLUME_STORAGE_KEY = 'strudel-editor-volume'
export const STRUDEL_SAVED_CODE_STORAGE_KEY = 'strudel-editor-code'
/** Where the patterns saved under a name are kept. */
export const STRUDEL_SAVED_PATTERNS_STORAGE_KEY = 'strudel-editor-saved-patterns'
/** Where the order the player dragged the songs into is kept. */
export const STRUDEL_SONG_ORDER_STORAGE_KEY = 'strudel-editor-song-order'
/** The query key naming the pattern on screen, as in `?pattern=lift-off`. */
export const STRUDEL_PATTERN_QUERY_KEY = 'pattern'
/** The query key naming the open drawer tab, as in `?tab=export`. */
export const STRUDEL_TAB_QUERY_KEY = 'tab'
/** The query key naming the editor mode, as in `?mode=flow`; code is the default and has none. */
export const STRUDEL_MODE_QUERY_KEY = 'mode'
/** Starts every saved pattern's id, so none can collide with an example's or a tune's. */
export const STRUDEL_SAVED_PATTERN_ID_PREFIX = 'saved-'
/** The id of a saved pattern whose name has no letters or digits to make one from. */
export const STRUDEL_SAVED_PATTERN_FALLBACK_SLUG = 'pattern'

/**
 * Every bank strudel.cc preloads, plus dirt-samples, which the shipped examples play. Loaded
 * once, before the first evaluation, or every trigger fails with "sound not found". The lists
 * download together but register in this order, and a later bank wins a name two banks share:
 * dirt-samples is last, so `bd`, `sd`, `hh` and the other names it shares with the uzu drum kit
 * stay the kit the examples were written for. The CDN folders are the ones strudel.cc reads
 * from, faster than the GitHub folders the manifests name.
 */
export const STRUDEL_SAMPLE_BANKS: StrudelSampleBank[] = [
  {
    label: 'Piano',
    manifestUrl: 'https://strudel.b-cdn.net/piano.json',
    baseUrl: 'https://strudel.b-cdn.net/piano/'
  },
  {
    label: 'VCSL instruments',
    manifestUrl: 'https://strudel.b-cdn.net/vcsl.json',
    baseUrl: 'https://strudel.b-cdn.net/VCSL/'
  },
  {
    label: 'Drum machines',
    manifestUrl: 'https://strudel.b-cdn.net/tidal-drum-machines.json',
    baseUrl: 'https://strudel.b-cdn.net/tidal-drum-machines/machines/',
    tag: 'drum-machines',
    groupsByMachine: true
  },
  {
    label: 'Uzu drum kit',
    manifestUrl: 'https://strudel.b-cdn.net/uzu-drumkit.json',
    baseUrl: 'https://strudel.b-cdn.net/uzu-drumkit/',
    tag: 'drum-machines'
  },
  {
    label: 'Wavetables',
    manifestUrl: 'https://strudel.b-cdn.net/uzu-wavetables.json',
    baseUrl: 'https://strudel.b-cdn.net/uzu-wavetables/',
    namePrefix: 'wt_'
  },
  {
    label: 'Mridangam',
    manifestUrl: 'https://strudel.b-cdn.net/mridangam.json',
    baseUrl: 'https://strudel.b-cdn.net/mrid/',
    tag: 'drum-machines',
    namePrefix: 'mridangam_'
  },
  {
    label: 'Dirt samples',
    manifestUrl: 'https://raw.githubusercontent.com/tidalcycles/dirt-samples/main/strudel.json',
    baseUrl: 'https://raw.githubusercontent.com/tidalcycles/dirt-samples/main/'
  }
]

/** The sounds tab's filters, the ones strudel.cc's sounds tab offers. */
export const STRUDEL_SOUND_FILTERS: { id: StrudelSoundFilter; label: string }[] = [
  { id: 'all', label: 'all' },
  { id: 'samples', label: 'samples' },
  { id: 'drum-machines', label: 'drum machines' },
  { id: 'synths', label: 'synths' },
  { id: 'wavetables', label: 'wavetables' }
]

/** The tag strudel.cc gives drum machine banks, which the filters split from other samples. */
export const STRUDEL_DRUM_MACHINES_TAG = 'drum-machines'

/**
 * What the drum abbreviations stand for, as the sounds tab names them. A drum machine sound is
 * named after its part (`RolandTR909_bd`), and so is a plain kit sample (`bd`, `808bd`).
 */
export const STRUDEL_DRUM_PART_NAMES: Record<string, string> = {
  bd: 'bass drum',
  sd: 'snare drum',
  hh: 'closed hi-hat',
  oh: 'open hi-hat',
  cp: 'clap',
  rim: 'rimshot',
  lt: 'low tom',
  mt: 'mid tom',
  ht: 'high tom',
  cr: 'crash',
  rd: 'ride',
  cb: 'cowbell',
  sh: 'shaker',
  tb: 'tambourine',
  perc: 'percussion',
  misc: 'miscellaneous',
  fx: 'effects',
  brk: 'breakbeat'
}

/** The sixteen General MIDI families, eight programs each, that group the `gm_*` soundfonts. */
export const STRUDEL_GENERAL_MIDI_FAMILIES = [
  'Pianos',
  'Chromatic percussion',
  'Organs',
  'Guitars',
  'Basses',
  'Strings',
  'Ensembles',
  'Brass',
  'Reeds',
  'Pipes',
  'Synth leads',
  'Synth pads',
  'Synth effects',
  'World instruments',
  'Percussive',
  'Sound effects'
]

/** General MIDI programs per family; a soundfont's family is its program divided by this. */
export const STRUDEL_GENERAL_MIDI_FAMILY_SIZE = 8

/** The group of the built-in oscillators and noise, which come from no sample bank. */
export const STRUDEL_SYNTHS_GROUP_LABEL = 'Synths'

/** How long a sound plays when its name is clicked in the sounds tab, in seconds. */
export const STRUDEL_SOUND_PREVIEW_SECONDS = 0.5

/** The note a synth or soundfont previews at, A3, since unlike a sample it has no pitch of its own. */
export const STRUDEL_SOUND_PREVIEW_NOTE = 57

/** Lead time before a preview starts, so the first scheduled sample is not clipped. */
export const STRUDEL_SOUND_PREVIEW_LEAD_SECONDS = 0.05

/** Short names such as `.bank("TR909")` for the drum machines, applied once they are loaded. */
export const STRUDEL_BANK_ALIASES_URL = 'https://strudel.b-cdn.net/tidal-drum-machines-alias.json'

/** Strudel's own tempo before a pattern sets one: one cycle every two seconds. */
export const DEFAULT_CPS = 0.5

/** One cycle by default: a sound effect or a single bar, played once. */
export const EXPORT_DEFAULT_OPTIONS: StrudelExportOptions = {
  format: 'wav',
  startCycle: 0,
  endCycle: 1,
  sampleRate: 48000,
  fileName: ''
}
/** The finest repetition the export looks for: a sound played up to sixteen times a cycle. */
export const STRUDEL_MAX_REPETITIONS_PER_CYCLE = 16
/** The longest song the export measures, in cycles: a piece that has not repeated by then keeps the count it has. */
export const STRUDEL_MAX_SONG_CYCLES = 64
/** The quiet after the last keystroke before the open export tab measures the code again. */
export const STRUDEL_EXPORT_MEASURE_DELAY_MS = 600
/** The narrowest a cycle may be drawn on the timeline, in pixels; a longer song scrolls sideways. */
export const STRUDEL_TIMELINE_MIN_CYCLE_WIDTH = 48
/** The furthest a touch on the timeline may wander, in pixels, and still count as a tap that seeks. */
export const STRUDEL_TIMELINE_TAP_SLOP = 8
/** How close the playhead may get to the edge, in pixels, before the following timeline scrolls it back to the middle. */
export const STRUDEL_TIMELINE_FOLLOW_MARGIN = 24
/** The three ways the timeline follows playback, in the order the switch shows them. */
export const STRUDEL_TIMELINE_PROGRESSION_OPTIONS = [
  { value: 'static', label: 'Fixed' },
  { value: 'follow', label: 'Follow' },
  { value: 'centered', label: 'Centre' }
] as const
/** The volume a first visit starts at, and the one the sound button restores after a mute. */
export const STRUDEL_TIMELINE_DEFAULT_VOLUME = 0.8
/** Below this the speaker icon shows one wave, above it two. */
export const STRUDEL_TIMELINE_LOW_VOLUME = 0.5
/** The finest point the timeline seeks to: a sixteenth of a bar. */
export const STRUDEL_TIMELINE_SEEK_STEP = 0.0625
export const EXPORT_FORMAT_OPTIONS = [
  { value: 'wav', label: 'WAV' },
  { value: 'midi', label: 'MIDI' }
]
/** General MIDI percussion keys for the drum sample names Strudel's banks share. */
export const STRUDEL_DRUM_MIDI_NOTES: Record<string, number> = {
  bd: 36,
  rim: 37,
  sd: 38,
  cp: 39,
  lt: 41,
  hh: 42,
  mt: 45,
  oh: 46,
  ht: 48,
  cr: 49,
  rd: 51,
  cb: 56,
  sh: 70
}
/** MIDI channel 10, counted from zero as files store it, is percussion in General MIDI. */
export const MIDI_DRUM_CHANNEL = 9
/** Strudel counts a cycle as one bar of four beats, which `setcpm(bpm / 4)` assumes too. */
export const STRUDEL_BEATS_PER_CYCLE = 4
export const STRUDEL_EXPORT_DEFAULT_VELOCITY = 0.8
export const EXPORT_SAMPLE_RATE_OPTIONS = [
  { value: '44100', label: '44.1 kHz' },
  { value: '48000', label: '48 kHz' },
  { value: '96000', label: '96 kHz' }
]

/** How long typing or a canvas edit settles before the code and the graph follow each other. */
export const FLOW_SYNC_DELAY_MS = 300

export const STRUDEL_TABS: { id: StrudelTabId; label: string }[] = [
  { id: 'import', label: 'Import' },
  { id: 'export', label: 'Export' },
  { id: 'midi', label: 'MIDI' },
  { id: 'sounds', label: 'Sounds' },
  { id: 'instruments', label: 'Instruments' },
  { id: 'compose', label: 'Compose' },
  { id: 'console', label: 'Console' },
  { id: 'settings', label: 'Settings' },
  { id: 'flow', label: 'Functions' },
  { id: 'hints', label: 'Hints' }
]

/** Analysis runs on mono audio resampled to this rate; it keeps hi-hats below Nyquist. */
export const TRANSCRIPTION_SAMPLE_RATE = 22050
export const TRANSCRIPTION_MAX_SECONDS = 90
export const TRANSCRIPTION_MAX_BARS = 64
export const TRANSCRIPTION_ACCEPTED_TYPES =
  'audio/*,.mp3,.wav,.ogg,.m4a,.flac,.mid,.midi,image/png,image/jpeg,image/webp'
/** A screenshot larger than this is refused, since every pixel is held in memory twice. */
export const TAB_IMAGE_MAX_PIXELS = 16000000

export const ONSET_FRAME_SIZE = 1024
export const ONSET_HOP_SIZE = 512
export const ONSET_THRESHOLD_RADIUS_FRAMES = 8
export const ONSET_THRESHOLD_OFFSET = 0.1

/** Four times the onset frame, so neighbouring bass semitones land in different bins. */
export const PITCH_FRAME_SIZE = 4096

export const TEMPO_MIN_BPM = 70
export const TEMPO_MAX_BPM = 180
/** Centre of the log-tempo prior that breaks ties between related tempos. */
export const TEMPO_PRIOR_CENTER_BPM = 120
export const TEMPO_PRIOR_WIDTH_OCTAVES = 1

export const MIDI_DEFAULT_BEATS_PER_MINUTE = 120
/** General MIDI percussion keys folded onto the three drums the transcription writes. */
export const MIDI_DRUM_SOUNDS: Record<number, DrumSound> = {
  35: 'bd',
  36: 'bd',
  37: 'sd',
  38: 'sd',
  39: 'sd',
  40: 'sd',
  42: 'hh',
  44: 'hh',
  46: 'hh'
}

export const STEPS_PER_BEAT = 4
export const STEPS_PER_BAR = 16

export const DRUM_LOW_BAND_MAX_HZ = 150
export const DRUM_HIGH_BAND_MIN_HZ = 5000
export const DRUM_KICK_MIN_SHARE = 0.4
export const DRUM_HAT_MIN_SHARE = 0.3
export const DRUM_SNARE_MIN_SHARE = 0.5

export const BASS_MIN_HZ = 40
export const BASS_MAX_HZ = 250
/** A bass peak quieter than this fraction of the loudest bin is treated as no bass. */
export const BASS_MIN_RELATIVE_LEVEL = 0.25

export const CHROMA_MIN_HZ = 110
export const CHROMA_MAX_HZ = 2000
/** A flat, noise-like chroma scores 0.5 against every triad, so the bar sits above it. */
export const CHORD_MIN_SIMILARITY = 0.6

export const NOTE_NAMES = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b']
export const CHORD_ROOT_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const TRANSCRIPTION_STAGE_LABELS: Record<TranscriptionStage, string> = {
  decoding: 'Decoding audio',
  onsets: 'Finding note onsets',
  tempo: 'Estimating tempo',
  notes: 'Reading drums, bass and chords',
  done: 'Done'
}

export const SECONDS_PER_MINUTE = 60

/** strudel.cc's own colours, applied to the editor alone rather than the page. */
export const STRUDEL_EDITOR_THEME = 'strudelTheme'
export const STRUDEL_EDITOR_ARIA_LABEL = 'Live code pattern'
/** Seconds of pattern either side of now that pianoroll and scope painters see. */
export const STRUDEL_DRAW_TIME: [number, number] = [-2, 2]
export const STRUDEL_NO_DRAW_TIME: [number, number] = [0, 0]

/**
 * Strudel's `getDrawContext()` draws on the element with this id, and creates a full-window
 * canvas pinned over the whole page when there is none. Naming the editor's background
 * canvas so keeps `.pianoroll()` and `.scope()` behind the code, as on strudel.cc.
 */
export const STRUDEL_DRAW_CANVAS_ID = 'test-canvas'

/** How long completion may wait for the parser to reach the cursor before using what it has. */
export const STRUDEL_COMPLETION_PARSE_TIMEOUT_MS = 50
/** The documentation beside the completion list: twice CodeMirror's 400px default. */
export const STRUDEL_COMPLETION_INFO_MAX_WIDTH = 800
/** How far in from the list's left edge the documentation sits when it drops under the list. */
export const STRUDEL_COMPLETION_INFO_MARGIN = 30
/** How far before a string to look for the call it belongs to, such as `s(` or `.scale(`. */
export const STRUDEL_COMPLETION_CALLEE_LOOKBEHIND = 40
export const STRUDEL_COMPLETION_PITCH_NAMES = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B'
]

/** Strudel plays a cycle every two seconds until told otherwise: 120 BPM at four beats a cycle. */
export const STRUDEL_DEFAULT_BEATS_PER_MINUTE = 120
/** The hints tab's picker value for "take the style from the comment or the code". */
export const STRUDEL_STYLE_PICKER_DETECT = 'detect'

/**
 * Each style's usual tempo, the instruments it is built from and the visuals that suit it.
 * Snippets use only the dirt-samples kit the editor loads and Strudel's built-in synths.
 */
export const STRUDEL_MUSIC_STYLES: StrudelMusicStyle[] = [
  {
    id: 'techno',
    label: 'Techno',
    keywords: ['techno', 'minimal techno', 'acid techno'],
    definingRoles: ['kick'],
    minBeatsPerMinute: 125,
    maxBeatsPerMinute: 140,
    beatsPerMinute: 130,
    instruments: [
      {
        role: 'kick',
        label: 'a four-on-the-floor kick',
        snippet: 's("bd*4").gain(.5)',
        reason: 'Techno is built on a kick on every beat; everything else hangs off it.'
      },
      {
        role: 'hihat',
        label: 'offbeat hi-hats',
        snippet: 's("[~ hh]*4").gain(1.5)',
        reason: 'Hats between the kicks give the groove its push.'
      },
      {
        role: 'clap',
        label: 'a clap on two and four',
        snippet: 's("~ cp ~ cp").gain(.4)',
        reason: 'A clap on the backbeat answers the kick.'
      },
      {
        role: 'bass',
        label: 'a rolling bass',
        snippet: 'note("[~ c2 c2 c2]*4").s("sawtooth").lpf(500).decay(.12).sustain(0).gain(1.2)',
        reason: 'Short notes between the kicks roll under them without fighting them.'
      },
      {
        role: 'percussion',
        label: 'syncopated percussion',
        snippet: 's("perc(3,8)").hpf(500).gain(.6)',
        reason:
          'An off-grid line keeps a long loop from going flat; the filter leaves the low end to the kick.'
      }
    ],
    visuals: ['punchcard', 'scope']
  },
  {
    id: 'house',
    label: 'House',
    keywords: ['house', 'deep house', 'tech house', 'garage'],
    definingRoles: ['kick'],
    minBeatsPerMinute: 118,
    maxBeatsPerMinute: 128,
    beatsPerMinute: 124,
    instruments: [
      {
        role: 'kick',
        label: 'a four-on-the-floor kick',
        snippet: 's("bd*4").gain(.5)',
        reason: 'House runs on a steady kick on every beat.'
      },
      {
        role: 'hihat',
        label: 'offbeat hi-hats',
        snippet: 's("[~ hh]*4").gain(1.5)',
        reason: 'The offbeat hat is the swing that makes house move.'
      },
      {
        role: 'clap',
        label: 'a clap on two and four',
        snippet: 's("~ cp ~ cp").gain(.4)',
        reason: 'A clap on the backbeat is the other half of the house groove.'
      },
      {
        role: 'bass',
        label: 'a bassline',
        snippet:
          'note("[~ c2] [~ c2] [~ eb2] [~ f2]").s("sawtooth").lpf(600).decay(.2).sustain(0).gain(1.2)',
        reason:
          'A short, moving bass on the offbeats carries the harmony and leaves room for the kick.'
      },
      {
        role: 'chords',
        label: 'warm chords',
        snippet: 'chord("<Cm7 Fm7>").voicing().s("triangle").gain(.4)',
        reason: 'Seventh chords give house its warmth.'
      }
    ],
    visuals: ['punchcard', 'pianoroll']
  },
  {
    id: 'drum-and-bass',
    label: 'Drum and bass',
    keywords: [
      'drum and bass',
      'drum & bass',
      'drum n bass',
      "drum'n'bass",
      'dnb',
      'd&b',
      'jungle'
    ],
    definingRoles: ['kick', 'snare'],
    minBeatsPerMinute: 165,
    maxBeatsPerMinute: 178,
    beatsPerMinute: 174,
    instruments: [
      {
        role: 'kick',
        label: 'a two-step kick',
        snippet: 's("bd ~ ~ ~ ~ bd ~ ~").gain(.45)',
        reason: 'The kick on one and the and of three sets up the two-step.'
      },
      {
        role: 'snare',
        label: 'a snare on two and four',
        snippet: 's("~ ~ sd ~ ~ ~ sd ~").gain(.35)',
        reason: 'The backbeat snare is what makes the tempo feel half as fast as it is.'
      },
      {
        role: 'hihat',
        label: 'fast hi-hats',
        snippet: 's("hh*8").gain(1.2)',
        reason: 'Steady hats keep the double-time energy.'
      },
      {
        role: 'bass',
        label: 'a sub bass',
        snippet: 'note("<c2 c2 g1 eb2>").s("sine").shape(.8).postgain(.2)',
        reason:
          'A deep sub is the "bass" half of drum and bass; saturation adds the harmonics that let small speakers carry it.'
      }
    ],
    visuals: ['scope', 'spectrum']
  },
  {
    id: 'hip-hop',
    label: 'Hip hop',
    keywords: ['hip hop', 'hip-hop', 'hiphop', 'boom bap', 'boombap', 'rap', 'lofi', 'lo-fi'],
    definingRoles: ['kick', 'snare'],
    minBeatsPerMinute: 80,
    maxBeatsPerMinute: 100,
    beatsPerMinute: 90,
    instruments: [
      {
        role: 'kick',
        label: 'a boom-bap kick',
        snippet: 's("bd ~ ~ bd ~ bd ~ ~").gain(.45)',
        reason: 'A loose, syncopated kick is the "boom".'
      },
      {
        role: 'snare',
        label: 'a snare on two and four',
        snippet: 's("~ ~ sd ~ ~ ~ sd ~").gain(.35)',
        reason: 'The backbeat snare is the "bap".'
      },
      {
        role: 'hihat',
        label: 'eighth-note hi-hats',
        snippet: 's("hh*8").gain(1.2)',
        reason: 'Steady hats hold a slow beat together.'
      },
      {
        role: 'chords',
        label: 'jazzy chords',
        snippet: 'chord("<Cm7 Ab^7>").voicing().s("triangle").gain(.3)',
        reason: 'Sampled-sounding seventh chords are the classic hip hop bed.'
      },
      {
        role: 'bass',
        label: 'a bassline',
        snippet:
          'note("<[c2 ~ ~ c2 ~ eb2 ~ ~] [ab1 ~ ~ ab1 ~ c2 ~ ~]>").s("triangle").shape(.3).postgain(.45)',
        reason: 'A sparse bass follows the kick and the chords, and fills the bottom.'
      }
    ],
    visuals: ['punchcard', 'pianoroll']
  },
  {
    id: 'ambient',
    label: 'Ambient',
    keywords: ['ambient', 'drone', 'chill', 'chillout', 'downtempo', 'meditation'],
    definingRoles: ['chords'],
    minBeatsPerMinute: 60,
    maxBeatsPerMinute: 90,
    beatsPerMinute: 70,
    instruments: [
      {
        role: 'chords',
        label: 'slow chords',
        snippet:
          'chord("<C^7 Am7 F^7 G7>").voicing().s("triangle").slow(2).attack(1).release(2).room(.8).gain(.2)',
        reason: 'Long chords that fade in and out are the body of ambient music.'
      },
      {
        role: 'melody',
        label: 'a sparse melody',
        snippet: 'n("0 ~ 4 ~ 7 ~ 4 ~").scale("C:major").s("sine").slow(2).delay(.5)',
        reason: 'A few notes with echo give the ear something to follow.'
      },
      {
        role: 'bass',
        label: 'a drone bass',
        snippet:
          'note("<c2 a2 f2 g2>").s("sine").shape(.5).postgain(.3).slow(2).attack(1).release(2)',
        reason: 'A low, slow root note anchors the chords.'
      }
    ],
    visuals: ['spiral', 'spectrum']
  },
  {
    id: 'trance',
    label: 'Trance',
    keywords: ['trance', 'psytrance', 'psy trance', 'uplifting'],
    definingRoles: ['kick'],
    minBeatsPerMinute: 130,
    maxBeatsPerMinute: 145,
    beatsPerMinute: 138,
    instruments: [
      {
        role: 'kick',
        label: 'a four-on-the-floor kick',
        snippet: 's("bd*4").gain(.5)',
        reason: 'Trance keeps a kick on every beat.'
      },
      {
        role: 'hihat',
        label: 'offbeat hi-hats',
        snippet: 's("[~ hh]*4").gain(1.5)',
        reason: 'The offbeat hat drives the build.'
      },
      {
        role: 'bass',
        label: 'an offbeat rolling bass',
        snippet: 'note("[~ a1]*4").s("sawtooth").lpf(800).decay(.15).sustain(0).gain(1.2)',
        reason: 'A short bass between the kicks gives trance its rolling feel.'
      },
      {
        role: 'melody',
        label: 'an arpeggiated lead',
        snippet:
          'n("0 2 4 7 4 2 0 2").fast(2).scale("A:minor").s("sawtooth").lpf(2000).decay(.15).sustain(0).gain(.6)',
        reason: 'A fast arpeggio is the hook trance is known for.'
      }
    ],
    visuals: ['pianoroll', 'spectrum']
  },
  {
    id: 'dub',
    label: 'Dub',
    keywords: ['dub', 'reggae', 'roots'],
    definingRoles: ['kick', 'bass'],
    minBeatsPerMinute: 65,
    maxBeatsPerMinute: 85,
    beatsPerMinute: 75,
    instruments: [
      {
        role: 'kick',
        label: 'a one-drop kick',
        snippet: 's("~ ~ bd ~").gain(.4)',
        reason: 'The one drop leaves the first beat empty and lands on the third.'
      },
      {
        role: 'clap',
        label: 'a rimshot with the drop',
        snippet: 's("~ ~ rm ~").gain(.3)',
        reason: 'A rim on the same beat as the kick marks the drop.'
      },
      {
        role: 'bass',
        label: 'a heavy bassline',
        snippet:
          'note("<[c2 ~ c2 eb2] [f2 ~ eb2 c2]>").s("triangle").lpf(300).shape(.3).postgain(.5)',
        reason: 'Dub is led by a deep, round bass that moves with the chords.'
      },
      {
        role: 'chords',
        label: 'an offbeat skank',
        snippet:
          'chord("<Cm Fm>").voicing().struct("~ x ~ x").s("square").decay(.12).sustain(0).gain(.3).delay(.5)',
        reason: 'Short chords on the offbeat, echoed, are the skank.'
      }
    ],
    visuals: ['scope', 'punchcard']
  },
  {
    id: 'breakbeat',
    label: 'Breakbeat',
    keywords: ['breakbeat', 'breaks', 'big beat', 'nu skool'],
    definingRoles: ['breaks'],
    minBeatsPerMinute: 120,
    maxBeatsPerMinute: 140,
    beatsPerMinute: 130,
    instruments: [
      {
        role: 'breaks',
        label: 'a sampled break',
        snippet: 's("breaks125").fit().gain(.6)',
        reason: 'A chopped drum break, not a drum machine, is what defines breakbeat.'
      },
      {
        role: 'bass',
        label: 'a bassline',
        snippet: 'note("<c2 eb2>*2").s("sawtooth").lpf(500).decay(.3).sustain(0).gain(1.2)',
        reason: 'A gritty bass rides on top of the break.'
      },
      {
        role: 'clap',
        label: 'a clap on two and four',
        snippet: 's("~ cp ~ cp").gain(.4)',
        reason: 'A clap on the backbeat reinforces the break.'
      },
      {
        role: 'percussion',
        label: 'extra percussion',
        snippet: 's("perc(5,8)").hpf(500).gain(.6)',
        reason:
          'Percussion on top fills the gaps in the break; the filter leaves the low end to it.'
      }
    ],
    visuals: ['punchcard', 'scope']
  },
  {
    id: 'synthwave',
    label: 'Synthwave',
    keywords: ['synthwave', 'synth wave', 'retrowave', 'outrun', '80s synth'],
    definingRoles: ['kick', 'bass'],
    minBeatsPerMinute: 80,
    maxBeatsPerMinute: 130,
    beatsPerMinute: 100,
    instruments: [
      {
        role: 'kick',
        label: 'a four-on-the-floor kick',
        snippet: 's("bd*4").bank("RolandTR909").gain(.5)',
        reason: 'A steady 909 kick is the pulse the arpeggio rides on.'
      },
      {
        role: 'clap',
        label: 'a gated clap on two and four',
        snippet: 's("~ cp ~ cp").bank("RolandTR909").gain(.4)',
        reason: 'A wide clap on the backbeat gives the 80s gated snare its size.'
      },
      {
        role: 'hihat',
        label: 'offbeat hi-hats',
        snippet: 's("[~ hh]*4").bank("RolandTR909").gain(1.2)',
        reason: 'Hats between the kicks keep the sixteenth-note arpeggio moving.'
      },
      {
        role: 'bass',
        label: 'a driving octave bass',
        snippet: 'note("a1 a2").fast(4).s("sawtooth").lpf(500).decay(.18).sustain(0).gain(1.1)',
        reason: 'An octave pulse on the root gives the low end motion without a walking line.'
      },
      {
        role: 'chords',
        label: 'wide minor chords',
        snippet:
          'chord("<Am F C G>").voicing().s("sawtooth").lpf(1800).decay(.3).sustain(0).gain(.3)',
        reason: 'Open minor chords give synthwave its lift; the saw keeps them bright.'
      },
      {
        role: 'melody',
        label: 'a delayed lead motif',
        snippet:
          'n("<[4 ~ 2 ~ 0 ~ 2 4] [4 ~ 2 ~ 7 ~ 4 ~]>").scale("A4:minor").s("triangle").delay(.35).gain(.3)',
        reason: 'A two-bar motif with long notes and a delay is the hook; a scale run is not.'
      }
    ],
    visuals: ['pianoroll', 'spectrum']
  },
  {
    id: 'stoner-rock',
    label: 'Stoner rock',
    keywords: ['stoner rock', 'stoner', 'desert rock', 'fuzz rock', 'sludge'],
    definingRoles: ['bass', 'chords'],
    minBeatsPerMinute: 65,
    maxBeatsPerMinute: 100,
    beatsPerMinute: 80,
    instruments: [
      {
        role: 'kick',
        label: 'a heavy syncopated kick',
        snippet: 's("bd ~ ~ bd ~ ~ bd ~").gain(.6)',
        reason: 'The kick lands around the riff, not just on the downbeat.'
      },
      {
        role: 'snare',
        label: 'a backbeat snare',
        snippet: 's("~ ~ sd ~ ~ ~ sd ~").gain(.5)',
        reason: 'The snare on two and four keeps the slow riff from dragging.'
      },
      {
        role: 'hihat',
        label: 'steady eighth-note hi-hats',
        snippet: 's("hh*8").gain(1.1)',
        reason: 'Steady hats hold the tempo under the fuzz.'
      },
      {
        role: 'bass',
        label: 'a syncopated fuzz bass',
        snippet:
          'note("<[d2 ~ d2 f2 ~ g2 ab2 ~] [d2 ~ d2 f2 ~ g2 a2 ~]>").s("sawtooth").lpf(380).shape(.35).decay(.22).sustain(0).gain(1.1)',
        reason:
          'The bass plays the riff with the guitar, blue note and all, instead of holding roots.'
      },
      {
        role: 'chords',
        label: 'fuzz power chords',
        snippet:
          'chord("<D5 D5 C5 G5>").voicing().s("gm_overdriven_guitar").lpf(1500).decay(.18).sustain(0).gain(.4)',
        reason:
          'Power chords, not full triads: the fifth and octave are the wall; a third would soften it.'
      },
      {
        role: 'melody',
        label: 'a pentatonic lead',
        snippet:
          'n("<[3 ~ 2 ~ 0 ~ 2 3] [3 ~ 2 ~ 0 ~ 4 ~]>").scale("D4:minor:pentatonic").s("gm_overdriven_guitar").gain(.5)',
        reason: 'A short pentatonic answer leaves the riff in charge.'
      }
    ],
    visuals: ['punchcard', 'scope']
  },
  {
    id: 'grunge',
    label: 'Grunge',
    keywords: ['grunge', 'seattle sound', '90s rock'],
    definingRoles: ['kick', 'snare', 'chords'],
    minBeatsPerMinute: 100,
    maxBeatsPerMinute: 125,
    beatsPerMinute: 120,
    instruments: [
      {
        role: 'kick',
        label: 'a driving kick',
        snippet: 's("bd ~ bd ~ bd ~ ~ ~").gain(.6)',
        reason: 'A pushy kick keeps the quiet verse moving.'
      },
      {
        role: 'snare',
        label: 'a hard backbeat snare',
        snippet: 's("~ ~ sd ~ ~ ~ sd ~").gain(.55)',
        reason: 'The snare on two and four is the loud half of the quiet-loud turn.'
      },
      {
        role: 'hihat',
        label: 'eighth-note hi-hats',
        snippet: 's("hh*8").gain(1.1)',
        reason: 'Hats fill the space between the heavy hits.'
      },
      {
        role: 'bass',
        label: 'a distorted bass',
        snippet:
          'note("<[e2 ~ e2 g2 ~ a2 ~ b2] [e2 ~ e2 g2 ~ a2 ~ b2] [e2 ~ e2 g2 ~ a2 ~ b2] [d2 ~ d2 f#2 ~ g2 ~ a2]>").s("sawtooth").lpf(520).shape(.3).decay(.18).sustain(0).gain(1.1)',
        reason: 'The verse bass follows the guitar riff; the chorus drops onto the chord roots.'
      },
      {
        role: 'chords',
        label: 'overdriven power chords',
        snippet:
          'chord("<E5 F5 F#5 G5>").voicing().s("gm_overdriven_guitar").lpf(950).decay(.08).sustain(0).gain(.4)',
        reason:
          'A chromatic run of power chords is the quiet verse; the chorus opens the same shapes up.'
      },
      {
        role: 'melody',
        label: 'a shouted guitar hook',
        snippet:
          'n("<[4 ~ 4 4 ~ 2 ~ 0] [4 ~ 4 4 ~ 3 ~ 2]>").scale("E4:minor").s("gm_overdriven_guitar").gain(.5)',
        reason: 'A four-note hook repeated with a changed ending is the loud half of the song.'
      }
    ],
    visuals: ['punchcard', 'scope']
  },
  {
    id: 'death-metal',
    label: 'Death metal',
    keywords: ['death metal', 'brutal death', 'blast beat', 'tremolo picking'],
    definingRoles: ['kick', 'snare', 'chords'],
    minBeatsPerMinute: 170,
    maxBeatsPerMinute: 230,
    beatsPerMinute: 200,
    instruments: [
      {
        role: 'kick',
        label: 'a sixteenth note kick',
        snippet: 's("blastkit_kick*16").clip(1).gain(.6)',
        reason: 'The kick runs in sixteenths and is cut at each event, so the blast stays tight.'
      },
      {
        role: 'snare',
        label: 'a blast beat snare',
        snippet: 's("blastkit_snare").struct("~ x ~ x ~ x ~ x ~ x ~ x ~ x ~ x").clip(1).gain(.5)',
        reason: 'Snare and kick alternate on sixteenths, or the snare keeps eighths over the kick.'
      },
      {
        role: 'hihat',
        label: 'tight closed hi-hats',
        snippet: 's("blastkit_hatclosed*8").clip(1).gain(.3)',
        reason: 'Closed hats mark the pulse in the intro; the blast moves to the cymbals.'
      },
      {
        role: 'bass',
        label: 'a picked bass doubling the riff',
        snippet:
          'note("<[a1*8 bb1*8] [a1*8 eb2*8]>").add(note(-12)).s("deathbass_note").clip(1).gain(.9)',
        reason: 'The bass picks the riff in unison with the guitar, with a bright attack.'
      },
      {
        role: 'chords',
        label: 'a tremolo picked riff',
        snippet:
          'note("<[a1*4 a1*4 bb1*4 a1*4] [a1*4 eb2*4 a1*4 e2*4]>").s("chainsaw_note").clip(1).gain(.6)',
        reason:
          'Sixteenth notes on one pitch, moving by a semitone and a tritone, are the riff; a drop tuning makes it heavy.'
      },
      {
        role: 'melody',
        label: 'a chromatic lead',
        snippet: 'note("<[a3@2 bb3 a3] [eb4@2 d4 a3]>").s("chainsaw_note").clip(1).gain(.4)',
        reason:
          'A short chromatic phrase over the riff, with a tritone leap, instead of a scale run.'
      }
    ],
    visuals: ['punchcard', 'scope']
  },
  {
    id: 'classical',
    label: 'Classical',
    keywords: ['classical', 'orchestral', 'baroque', 'romantic', 'chamber music'],
    definingRoles: ['chords', 'melody', 'bass'],
    minBeatsPerMinute: 60,
    maxBeatsPerMinute: 100,
    beatsPerMinute: 80,
    instruments: [
      {
        role: 'chords',
        label: 'a voice-led string section',
        snippet:
          'chord("<Dm Gm A7 Dm>").voicing().struct("x@2 ~ x@1 x@1").s("gm_string_ensemble_1").attack(.25).release(.6).gain(.3)',
        reason:
          'The strings move in a rhythm and lead their voices; a sustained pad is not an arrangement.'
      },
      {
        role: 'melody',
        label: 'a violin theme',
        snippet: 'note("<[d5@2 f5 e5] [d5@2 a4@2] [bb4@2 d5 c5] [a4@4]>").s("gm_violin").gain(.4)',
        reason: 'A singable phrase with a dotted rhythm carries the piece; a scale run does not.'
      },
      {
        role: 'bass',
        label: 'a walking cello line',
        snippet:
          'note("<[d2 f2 a1 d2] [bb1 d2 g1 bb1] [a1 c#2 e2 a1] [d2 f2 a1 d2]>").s("gm_cello").gain(.5)',
        reason: 'The cello walks through the harmony and gives the theme a counter-line.'
      },
      {
        role: 'percussion',
        label: 'timpani at the cadences',
        snippet: 's("perc(3,8)").hpf(80).gain(.35)',
        reason: 'A few low hits mark the returns; a drum kit would turn it into another genre.'
      }
    ],
    visuals: ['pianoroll', 'spiral']
  },
  {
    id: 'funk',
    label: 'Funk',
    keywords: ['funk', 'funky', 'p-funk', 'boogie'],
    definingRoles: ['bass', 'chords', 'percussion'],
    minBeatsPerMinute: 95,
    maxBeatsPerMinute: 120,
    beatsPerMinute: 105,
    instruments: [
      {
        role: 'kick',
        label: 'a syncopated kick',
        snippet: 's("bd ~ ~ bd ~ ~ bd ~ ~ ~ bd ~ ~ ~ bd ~").gain(.55)',
        reason: 'The kick lands around the beat, not only on it.'
      },
      {
        role: 'snare',
        label: 'a snare with ghost notes',
        snippet: 'stack(s("~ ~ ~ ~ sd ~ ~ ~ ~ ~ ~ ~ sd ~ ~ ~").gain(.5), s("sd*16").gain(.08))',
        reason: 'A hard backbeat with quiet ghost notes is the funk pocket.'
      },
      {
        role: 'hihat',
        label: 'tight sixteenth-note hi-hats',
        snippet: 's("hh*16").gain(1.2)',
        reason: 'Tight hats keep the sixteenth-note feel readable.'
      },
      {
        role: 'percussion',
        label: 'hand percussion',
        snippet: 's("perc(5,8)").hpf(600).gain(.5)',
        reason: 'A shaker or conga line adds the upper rhythm.'
      },
      {
        role: 'bass',
        label: 'a syncopated slap bass',
        snippet:
          'note("<[e2 ~ e2 g2 ~ a2 ~ b2 ~ e2 ~ d2 ~ b1 a1 g1] [a1 ~ a1 c#2 ~ e2 ~ g2 ~ a2 ~ g2 ~ e2 c#2 a1]>").s("sawtooth").lpf(750).shape(.25).decay(.1).sustain(0).gain(1.1)',
        reason: 'The bass is the lead: syncopated, octave-jumping and following the chords.'
      },
      {
        role: 'chords',
        label: 'clavinet stabs',
        snippet:
          'chord("<E9 A9 E9 B9>").voicing().struct("~ x ~ x ~ ~ x ~ x ~ x ~ x ~ x ~ x").s("gm_clavinet").decay(.05).sustain(0).gain(.15).room(.2)',
        reason: 'Short offbeat stabs chop against the bass without filling the space.'
      },
      {
        role: 'melody',
        label: 'a brass answer',
        snippet:
          'n("<[4 ~ 3 ~ 2 ~ 0 ~] [4 ~ 3 2 ~ 0 ~ ~]>").scale("E4:minor:pentatonic").s("gm_brass_section").gain(.35)',
        reason: 'A short horn phrase answers the vocal rather than running the scale.'
      }
    ],
    visuals: ['punchcard', 'pianoroll']
  },
  {
    id: 'jazz',
    label: 'Jazz',
    keywords: ['jazz', 'bebop', 'swing', 'bossa nova', 'fusion'],
    definingRoles: ['bass', 'chords', 'melody'],
    minBeatsPerMinute: 126,
    maxBeatsPerMinute: 170,
    beatsPerMinute: 130,
    instruments: [
      {
        role: 'kick',
        label: 'a feathered kick',
        snippet: 's("~ ~ bd ~ ~ ~ bd ~").gain(.25)',
        reason: 'A quiet kick marks the pulse without dominating the ride.'
      },
      {
        role: 'snare',
        label: 'a brush-like snare',
        snippet: 's("~ ~ sd ~ ~ ~ sd ~").gain(.2)',
        reason: 'Soft backbeats leave room for the comping.'
      },
      {
        role: 'bass',
        label: 'a walking bass',
        snippet:
          'note("<[c2 eb2 g2 bb1] [f2 a2 c2 eb2] [bb1 d2 f2 a1] [g1 b1 d2 f2]>").s("gm_acoustic_bass").gain(.6)',
        reason: 'A walking line spells the harmony and keeps the swing.'
      },
      {
        role: 'chords',
        label: 'comping seventh chords',
        snippet:
          'chord("<Cm7 F7 Bb^7 Eb^7>").voicing().struct("~ x ~ x ~ ~ x ~").s("gm_epiano1").gain(.3)',
        reason:
          'Short, syncopated seventh chords are the comping; block chords on every beat are not.'
      },
      {
        role: 'melody',
        label: 'a vibraphone head',
        snippet:
          'note("<[f4 ~ d4 bb3 ~ f4 ~ ~] [d4 ~ b3 g3 ~ d4 ~ ~] [eb4 ~ c4 g3 ~ bb3 ~ ~] [a3 ~ c4 eb4 ~ f4 ~ ~]>").s("gm_vibraphone").gain(.35)',
        reason: 'A guide-tone line with rests states the head; it is not a scale played in order.'
      }
    ],
    visuals: ['pianoroll', 'pitchwheel']
  }
]

export const STRUDEL_VISUAL_REASONS: Record<StrudelVisualName, string> = {
  pianoroll: 'A pianoroll under the pattern shows its notes scroll past as they play.',
  punchcard: 'A punchcard shows every hit as a block, so the groove is visible at a glance.',
  scope: 'A scope draws the waveform, so you can see the bass and the filter move.',
  spectrum: 'A spectrum shows which frequencies the mix fills and which it leaves empty.',
  spiral: 'A spiral turns the notes into a slowly winding shape that suits long, calm pieces.',
  pitchwheel: 'A pitch wheel shows the notes as points around a circle of pitch.'
}

/**
 * The layers each visual suits, most suitable first. A visual goes on the first layer playing
 * one of these that draws nothing yet, since two visuals on one pattern draw over each other.
 */
export const STRUDEL_VISUAL_TARGET_ROLES: Record<StrudelVisualName, StrudelInstrumentRole[]> = {
  punchcard: ['kick', 'snare', 'clap', 'hihat', 'percussion', 'breaks'],
  pianoroll: ['melody', 'chords', 'bass'],
  scope: ['bass', 'melody', 'chords'],
  spectrum: ['chords', 'melody', 'bass', 'breaks', 'kick', 'snare', 'hihat', 'clap', 'percussion'],
  spiral: ['melody', 'chords'],
  pitchwheel: ['melody', 'chords', 'bass']
}

/** How each instrument is named in a hint's sentence. */
export const STRUDEL_INSTRUMENT_ROLE_LABELS: Record<StrudelInstrumentRole, string> = {
  kick: 'kick',
  snare: 'snare',
  clap: 'clap',
  hihat: 'hi-hats',
  percussion: 'percussion',
  breaks: 'sampled break',
  bass: 'bass',
  chords: 'chords',
  melody: 'melody'
}

/** Ways to keep a finished pattern moving, tried in this order. */
export const STRUDEL_PATTERN_IDEAS: StrudelPatternIdea[] = [
  {
    id: 'breakdown',
    title: 'Drop out every fourth bar',
    reason:
      'A bar without this layer now and then lets the loop breathe, and its return hits harder.',
    snippet: '.mask("<1 1 1 0>")',
    callName: 'mask',
    targetRoles: ['kick', 'breaks', 'snare', 'hihat']
  },
  {
    id: 'filter-sweep',
    title: 'Sweep the filter',
    reason:
      'A filter opening and closing over eight bars builds tension without a single new note. It moves once per note, so a busy line sweeps smoothly and a held one in steps.',
    snippet: '.lpf(sine.range(300, 3000).slow(8))',
    callName: 'sine',
    targetRoles: ['bass', 'chords', 'melody'],
    unsuitedSounds: ['sine']
  },
  {
    id: 'phrase-answer',
    title: 'Turn the phrase round every fourth bar',
    reason: 'Reversing the last of every four bars answers the phrase instead of repeating it.',
    snippet: '.lastOf(4, (x) => x.rev())',
    callName: 'lastOf',
    targetRoles: ['melody', 'chords']
  },
  {
    id: 'drum-fills',
    title: 'Add drum fills',
    reason: 'Doubling a few hits at random keeps a repeating beat from sounding like a loop.',
    snippet: '.sometimesBy(.2, (x) => x.ply(2))',
    callName: 'sometimesBy',
    targetRoles: ['hihat', 'snare', 'percussion', 'clap', 'kick']
  },
  {
    id: 'stereo',
    title: 'Spread it across the speakers',
    reason: 'A reversed copy in the other ear makes a layer wide without making it louder.',
    snippet: '.jux(rev)',
    callName: 'jux',
    targetRoles: ['percussion', 'melody']
  },
  {
    id: 'echo',
    title: 'Add an echo',
    reason: 'An echo fills the gaps between hits and ties the layers together.',
    snippet: '.delay(.4)',
    callName: 'delay',
    targetRoles: ['chords', 'clap', 'melody']
  }
]
/** How many ideas the hints tab shows at once, so the next step stays easy to pick. */
export const STRUDEL_PATTERN_IDEA_LIMIT = 3

/** Sound names, as written in a pattern's strings, and the instrument each one plays. */
export const STRUDEL_INSTRUMENT_SOUND_NAMES: Record<StrudelInstrumentRole, string[]> = {
  kick: ['bd', 'kick', '808bd', '909bd'],
  snare: ['sd', 'sn', 'snare', '808sd', '909sd'],
  clap: ['cp', 'clap', 'rm', 'rim', 'realclaps'],
  hihat: ['hh', 'hc', 'oh', 'ho', 'hihat', '808hc', '808oh', 'hh27', 'hatclosed', 'hatopen'],
  percussion: [
    'perc',
    'lt',
    'mt',
    'ht',
    'tabla',
    'cr',
    'click',
    'cb',
    'cowbell',
    'shaker',
    'tom',
    'tomhi',
    'tommid',
    'tomlow',
    'ride',
    'crash'
  ],
  breaks: ['breaks125', 'breaks152', 'breaks157', 'breaks165', 'amencutup', 'amen'],
  bass: [
    'bass',
    'bass1',
    'bass2',
    'bass3',
    'jvbass',
    'subroc3d',
    'fuzzbass',
    'grungebass',
    'deathbass'
  ],
  chords: [
    'pad',
    'padlong',
    'chord',
    'stoner',
    'seattle',
    'jangle',
    'chainsaw',
    'campfire',
    'doomorgan'
  ],
  melody: ['arpy', 'piano', 'casio', 'pluck', 'lead']
}

/** Calls that mark an instrument whatever sounds they play. */
export const STRUDEL_INSTRUMENT_CALL_NAMES: Partial<Record<StrudelInstrumentRole, string[]>> = {
  chords: ['chord', 'voicing', 'voicings'],
  melody: ['scale', 'arp']
}

/** Notes at or below this octave count as bass, and above it as melody. */
export const STRUDEL_BASS_MAX_OCTAVE = 2

/** Each method that draws a visual, inline with an underscore or behind the code without. */
export const STRUDEL_VISUAL_CALL_NAMES: Record<string, StrudelVisualName> = {
  pianoroll: 'pianoroll',
  _pianoroll: 'pianoroll',
  punchcard: 'punchcard',
  _punchcard: 'punchcard',
  scope: 'scope',
  _scope: 'scope',
  tscope: 'scope',
  _tscope: 'scope',
  spectrum: 'spectrum',
  _spectrum: 'spectrum',
  spiral: 'spiral',
  _spiral: 'spiral',
  pitchwheel: 'pitchwheel',
  _pitchwheel: 'pitchwheel'
}

/** Tempo calls and the factor from their argument to beats per minute, at four beats a cycle. */
export const STRUDEL_TEMPO_CALL_FACTORS: Record<string, number> = {
  setcps: 240,
  setCps: 240,
  setcpm: 4,
  setCpm: 4
}

/** Top-level calls that set things up rather than make sound. */
export const STRUDEL_SETUP_CALL_NAMES = [
  'setcps',
  'setCps',
  'setcpm',
  'setCpm',
  'samples',
  'all',
  'each',
  'hush'
]

/** A pixel this far from the page colour is faint ink: a staff line, a bar line or a tie. */
export const TAB_FAINT_DEVIATION = 25
/** A pixel this far from the page colour is bright ink: a fret digit, a stem or a beam. */
export const TAB_BRIGHT_DEVIATION = 100
export const TAB_BACKGROUND_SAMPLE_STRIDE = 7
/** Printed words such as a tempo are dimmer than a fret number, so they get their own level. */
export const TAB_TEXT_DEVIATION = 50
export const TAB_LUMINANCE_WEIGHTS = { red: 0.299, green: 0.587, blue: 0.114 }

/** Every length below is a multiple of the gap between two staff lines, so any zoom works. */
export const TAB_LINE_COVERAGE_RATIO = 0.5
export const TAB_SYSTEM_BREAK_GAP_RATIO = 2
export const TAB_LINE_START_RUN_RATIO = 2
export const TAB_BAR_LINE_COVERAGE_RATIO = 0.9
export const TAB_BAR_MERGE_GAP_RATIO = 0.5
/** Narrower than this and a vertical stroke is a clef, a cursor or a stray line, not a bar. */
export const TAB_BAR_MIN_WIDTH_RATIO = 4
export const TAB_GLYPH_WINDOW_RATIO = 0.45
export const TAB_GLYPH_MIN_HEIGHT_RATIO = 0.6
export const TAB_GLYPH_MIN_WIDTH_RATIO = 0.25
export const TAB_GLYPH_MAX_WIDTH_RATIO = 0.8
export const TAB_GLYPH_MERGE_GAP_RATIO = 0.5
export const TAB_STEM_TOP_RATIO = 1
export const TAB_STEM_BOTTOM_RATIO = 2.75
export const TAB_STEM_COVERAGE_RATIO = 0.7
export const TAB_STEM_MERGE_GAP_RATIO = 0.3
export const TAB_BEAM_NEAR_RATIO = 0.25
export const TAB_BEAM_FAR_RATIO = 0.55
export const TAB_BRACKET_TOP_RATIO = 3
export const TAB_BRACKET_BOTTOM_RATIO = 3.8
export const TAB_BRACKET_MIN_SEGMENT_RATIO = 1
export const TAB_BRACKET_JOIN_GAP_RATIO = 3
export const TAB_STEM_NOTE_REACH_RATIO = 0.6

export const TAB_TEMPO_BAND_TOP_RATIO = 3.5
export const TAB_TEMPO_BAND_BOTTOM_RATIO = 1.5
export const TAB_EQUALS_MIN_WIDTH_RATIO = 0.4
export const TAB_EQUALS_MAX_WIDTH_RATIO = 1
export const TAB_EQUALS_MAX_HEIGHT_RATIO = 0.5
export const TAB_TEMPO_DIGIT_GAP_RATIO = 0.5
export const TAB_TEMPO_MAX_DIGITS = 3
export const TAB_TEMPO_MIN_BEATS_PER_MINUTE = 30
export const TAB_TEMPO_MAX_BEATS_PER_MINUTE = 300

export const TAB_BEATS_PER_BAR = 4
/** Beats a stem lasts by how many beams or flags it carries: none, one, two, three. */
export const TAB_BEAM_BEATS = [1, 0.5, 0.25, 0.125]
export const TAB_TRIPLET_NUMERATOR = 2
export const TAB_TRIPLET_DENOMINATOR = 3
export const TAB_MAX_BEAMS = 3

export const TAB_INSTRUMENT_BY_LINE_COUNT: Record<number, 'bass' | 'guitar'> = {
  4: 'bass',
  6: 'guitar'
}
export const TAB_SOUNDS = {
  bass: 'gm_electric_bass_finger',
  guitar: 'gm_acoustic_guitar_nylon'
}

export const TAB_DIGIT_GRID_WIDTH = 5
export const TAB_DIGIT_GRID_HEIGHT = 7
/** Thin anti-aliased strokes read faint in a small cell, so coverage is boosted before matching. */
export const TAB_DIGIT_CONTRAST = 1
/** A glyph further than this mean squared difference from every digit is left unread. */
export const TAB_DIGIT_MAX_DISTANCE = 0.12
/**
 * Each digit sampled onto the grid, a space for no ink up to # for full ink, in one set per
 * typeface. The first set holds 0, 1, 3, 5, 7, 8 and 9 sampled from a real Songsterr screenshot,
 * with 2, 4 and 6 (which it never prints) drawn by hand in the same style. The others were sampled
 * from the browser's Arial, which also covers 2, 4 and 6 and the heavier weight of many tab sites.
 */
export const TAB_DIGIT_TEMPLATE_SETS = [
  [
    ['.##+ ', '++.#.', '#+ #+', '#+ #+', '#+ #+', '++.#.', '.##+ '],
    ['  .# ', ' +##.', ' ++#.', '  .#.', '  .#.', '  .#.', '  .# '],
    ['.##+ ', '++.#.', '  .#.', '  ##.', ' .#+ ', '.#+  ', '+####'],
    ['.##+ ', '++.#.', '  +# ', '  +# ', '   ++', '++.#+', '.##+ '],
    ['  .#.', ' .##.', '.+.#.', '+. #.', '+####', '   #.', '   #.'],
    ['.###.', '.#.. ', '+##+ ', '.+.#+', '   ++', '++.#+', '.+#+ '],
    ['.###.', '+#...', '#+.  ', '#+##.', '#+ .#', '++.+#', '.##+ '],
    ['+####', ' ..#+', '  .# ', '  ++ ', ' .#. ', ' +#  ', ' ++  '],
    [' +##.', '.#.++', ' #+++', ' ###.', '.#.+#', '.#.+#', ' ###.'],
    ['.##+ ', '++.#.', '#+ #+', '+#+#+', ' .+#+', '++.#.', '.##+ ']
  ],
  [
    ['.### ', '++ #.', '#. .+', '#. .#', '#. .+', '++ ++', '.### '],
    ['  +# ', ' +## ', ' +.# ', '  .# ', '  .# ', '  .# ', '  .# '],
    ['.###.', '++ ++', '.  ++', '  .#.', ' .#. ', '+#.  ', '####+'],
    ['.### ', '++.#.', '  .#.', '  ##.', '   ++', '#+ ++', '.###.'],
    ['  ++ ', ' .#+ ', ' +++ ', '++.+ ', '#++#.', '+++#.', '  .+ '],
    ['.###.', '.#.. ', '+#+. ', '+++#+', '   .#', '++ ++', '.###.'],
    [' ###.', '++ ++', '#+.. ', '##+#.', '#. +#', '++ ++', '.###.'],
    ['+###+', ' ..#.', '  ++ ', '  #. ', ' .+  ', ' +.  ', ' +.  '],
    ['.### ', '+#.#.', '+#.#.', '.###.', '#+ ++', '#. ++', '.###.'],
    ['.##+ ', '#+ #+', '#. +#', '+#.##', ' +++#', '+. ++', '.### ']
  ],
  [
    ['.##+ ', '+#+#.', '## #+', '#+ #+', '#+ #+', '+#.#.', '.### '],
    ['  +# ', ' +## ', '.### ', '  +# ', '  +# ', '  +# ', '  +# '],
    ['.###.', '+#.#+', '.. #+', '  +#.', ' +#. ', '+#+..', '####+'],
    ['.##+ ', '+#+#.', ' .+#.', '  ##.', '   #+', '+#.#+', '.###.'],
    ['  +#.', ' .##.', ' ###.', '+#+#.', '##+#+', '++##+', '  .#.'],
    ['.###+', '.#++.', '.#+. ', '+#+#+', '   ##', '+#.#+', '.###.'],
    [' +##.', '+#.#+', '##.. ', '####+', '## ##', '+#.#+', '.###.'],
    ['#####', '+++#+', '  +# ', ' .#. ', ' +#  ', ' ++  ', ' #+  '],
    ['.##+ ', '+#.#.', '+#.#.', '.###.', '##.#+', '##.#+', '.###.'],
    ['.##+ ', '##+#.', '#+ #+', '+#+#+', ' ++#+', '++.#.', '.##+ ']
  ]
]

/** How many cycles the flow's notation reads to find where a pattern starts over. */
export const STRUDEL_NOTE_BARS_MAX_CYCLES = 64

/** Piano scores: every length is again a multiple of the staff line gap. */
export const SCORE_STAFF_LINE_COUNT = 5
/** A treble and a bass staff further apart than this are two systems, not one grand staff. */
export const SCORE_GRAND_STAFF_MAX_GAP_RATIO = 12
/** A horizontal stroke no thicker than this is a staff line, ledger line, tie or slur. */
export const SCORE_THIN_LINE_RATIO = 0.2
export const SCORE_CLEF_ZONE_RATIO = 3.6
export const SCORE_TREBLE_CLEF_REACH_RATIO = 1
export const SCORE_PRELUDE_SEARCH_RATIO = 16
export const SCORE_KEY_STEP_RATIO = 1.5
export const SCORE_METRE_REACH_RATIO = 2.5
export const SCORE_METRE_MIN_HEIGHT_RATIO = 1.5
export const SCORE_METRE_MIN_WIDTH_RATIO = 0.9
export const SCORE_METRE_PIECE_GAP_RATIO = 0.5
/** Thinner than this is the system's opening line, not a clef or a sign. */
export const SCORE_PRELUDE_MIN_WIDTH_RATIO = 0.3
/** Shorter than this is a clef dot or a speck, skipped while reading the key. */
export const SCORE_PRELUDE_SPECK_RATIO = 0.6
export const SCORE_COMMON_TIME_BEATS = 4
export const SCORE_ACCIDENTAL_MIN_HEIGHT_RATIO = 1.6
export const SCORE_ACCIDENTAL_MAX_WIDTH_RATIO = 1.3
export const SCORE_ACCIDENTAL_STROKE_RATIO = 1.4
export const SCORE_NATURAL_OFFSET_RATIO = 0.6
export const SCORE_FLAT_MAX_WIDTH_RATIO = 1.1
export const SCORE_FLAT_BOWL_RATIO = 0.4
/** A pixel whose horizontal and vertical runs both reach these is inside a filled note head. */
export const SCORE_HEAD_CORE_WIDTH_RATIO = 0.8
export const SCORE_HEAD_CORE_HEIGHT_RATIO = 0.75
export const SCORE_HEAD_CORE_MIN_RATIO = 0.35
export const SCORE_HEAD_HALF_WIDTH_RATIO = 0.65
export const SCORE_HEAD_HALF_HEIGHT_RATIO = 0.5
export const SCORE_HOLE_REACH_RATIO = 0.45
export const SCORE_HOLE_MIN_WIDTH_RATIO = 0.2
export const SCORE_HOLE_MAX_WIDTH_RATIO = 1
export const SCORE_HOLE_MAX_HEIGHT_RATIO = 0.7
export const SCORE_HOLLOW_MIN_WIDTH_RATIO = 1
export const SCORE_STEM_MIN_RATIO = 2.5
export const SCORE_STEM_ATTACH_RATIO = 0.8
export const SCORE_BEAM_SEARCH_RATIO = 1.8
export const SCORE_BEAM_NEAR_RATIO = 0.3
export const SCORE_BEAM_FAR_RATIO = 0.8
export const SCORE_DOT_FAR_RATIO = 1.6
export const SCORE_DOT_MAX_SIZE_RATIO = 0.6
export const SCORE_DOT_ABOVE_RATIO = 1
export const SCORE_DOT_BELOW_RATIO = 0.35
export const SCORE_ACCIDENTAL_REACH_RATIO = 1.5
/** Smaller than this in both directions is a dot or a speck, never a rest or a skipped mark. */
export const SCORE_MARK_MIN_SIZE_RATIO = 0.6
export const SCORE_REST_BLOCK_MAX_RATIO = 0.8
export const SCORE_REST_QUARTER_MIN_RATIO = 2.3
export const SCORE_REST_MIN_WIDTH_RATIO = 0.45
export const SCORE_REST_MAX_WIDTH_RATIO = 1.6
export const SCORE_REST_MAX_STROKE_RATIO = 1.5
/** A quarter rest has one long stroke too, but it sits in a dense body a stem never has. */
export const SCORE_REST_MIN_DENSITY = 0.4
export const SCORE_REST_BEATS = { whole: 4, half: 2, quarter: 1, eighth: 0.5 }
/** Only blobs up to this size are joined back together; a beamed group never is. */
export const SCORE_MARK_MERGE_MAX_RATIO = 3.5
/** Letter steps above C0 of each clef's bottom line: E4 for treble, G2 for bass. */
export const SCORE_BOTTOM_LINE_STEP = { treble: 30, bass: 18 }
/** Letters counted from C as 0: the order sharps, then flats, are added to a key. */
export const SCORE_SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]
export const SCORE_FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3]
export const SCORE_LETTER_SEMITONES = [0, 2, 4, 5, 7, 9, 11]
/** How far above and below its staff a note head is still looked for. */
export const SCORE_ZONE_REACH_RATIO = 4
/** Heads and rests closer together than this start at the same moment. */
export const SCORE_ONSET_GROUP_RATIO = 0.6
export const SCORE_WHOLE_NOTE_MIN_WIDTH_RATIO = 1.4
export const SCORE_DOT_FACTOR = 1.5
export const SCORE_HOLLOW_BEATS = 2
export const SCORE_SOUND = 'gm_piano'

/** The visual a tab or score import draws under each instrument's line when asked to. */
export const IMPORT_VISUAL_CALL = '._pianoroll()'

/** Import code as it was first written: no visual under the lines. */
export const IMPORT_CODE_PLAIN: ImportCodeOptions = { addVisualizer: false }
export const SCORE_MARK_MERGE_MARGIN_RATIO = 0.3
export const SCORE_UNREAD_REACH_RATIO = 1.5
export const SCORE_BAR_LINE_MAX_WIDTH_RATIO = 0.4
export const SCORE_HOLLOW_CLEARANCE_RATIO = 1.5
/** Rests sit near the middle line, a second voice's a little off it. */
export const SCORE_REST_CENTRE_REACH_RATIO = 1.5
/** A rest shaped mark this close in front of a head is a grace note leading into it. */
export const SCORE_GRACE_REACH_RATIO = 1
export const SCORE_REST_BLOCK_MIN_HEIGHT_RATIO = 0.4
export const SCORE_REST_BLOCK_MIN_WIDTH_RATIO = 0.9
export const SCORE_REST_BLOCK_MIN_DENSITY = 0.7
export const SCORE_REST_LINE_TOUCH_PIXELS = 2
/** A score prints its tempo higher above the staff than a tab, in a wider type. */
export const SCORE_TEMPO_BAND = {
  topRatio: 5,
  bottomRatio: 1.5,
  equalsMaxWidthRatio: 1.6,
  equalsMaxHeightRatio: 1,
  digitMaxWidthRatio: 1.4
}
export const SCORE_RING_INSET_RATIO = 0.25
