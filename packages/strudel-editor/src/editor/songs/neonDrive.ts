import type { StrudelExample } from '../types'

export const neonDrive: StrudelExample = {
  id: 'neon-drive',
  label: 'Neon Drive (synthwave)',
  code: `// Neon Drive: a synthwave song in A minor at 128 BPM
// Instruments: bass sawtooth, drums RolandTR909, arpeggio sawtooth, lead square, pad gm_string_ensemble_1
setcpm(128/4)

const chords = "<Am F C G>"

// drums
const kick = s("rolandtr909_bd*4").gain(0.9)
const snare = s("~ rolandtr909_sd ~ rolandtr909_sd*[1 2]").gain(0.6).clip(1).room(0.3)
const clap = s("~ rolandtr909_cp ~ ~").gain(0.5).clip(1)
const hatOff = s("[~ rolandtr909_hh]*4").gain(0.4).clip(1)
const hat16 = s("rolandtr909_hh*16").gain(0.2).clip(1)

// bass: Perturbator-style driving 16ths vs. a sparse syncopated intro line
const bassDrive = chords.rootNotes(2).struct("[x x x x]*4").note().s("sawtooth").lpf(sine.range(400,1600).slow(8)).gain(0.7).clip(1)
const bassSparse = chords.rootNotes(2).struct("x ~ ~ x ~ x ~ ~").note().s("sawtooth").lpf(500).gain(0.7).clip(1)

// arpeggio from chord tones
const arp = n("[0 1 2 3 2 1 2 1]*2").chord(chords).voicing().s("sawtooth").lpf(sine.range(900,3000).slow(8)).gain(0.28).clip(1).delay(0.3).delaytime(0.1875).delayfeedback(0.35)

// motif: a singing Cinnamon Chasers lead on chord tones, an octave up
const lead = n("4 ~ 2 ~ 1 ~ 2 3").chord(chords).voicing().transpose(12).s("square").lpf(2800).gain(0.35).clip(1).room(0.4).delay(0.25).delaytime(0.375).delayfeedback(0.4)

// strings pad
const pad = chord(chords).voicing().s("gm_string_ensemble_1").gain(0.3).attack(0.4).release(0.8)

// sections: intro 4, verse 8, chorus 8, breakdown 4, chorus 8, outro 4
$: arrange([4, kick],[8, kick],[8, kick],[4, silence],[8, kick],[4, silence])
$: arrange([4, silence],[8, snare],[8, stack(snare, clap)],[4, silence],[8, stack(snare, clap)],[4, silence])
$: arrange([4, silence],[8, hatOff],[8, stack(hatOff, hat16)],[4, silence],[8, stack(hatOff, hat16)],[4, silence])
$: arrange([4, bassSparse],[8, bassDrive],[8, bassDrive],[4, silence],[8, bassDrive],[3, bassSparse],[1, note("a1").s("sawtooth").lpf(500).gain(0.7).clip(1)])
$: arrange([4, silence],[8, arp],[8, arp],[4, arp],[8, arp],[4, silence])
$: arrange([4, silence],[8, silence],[8, lead],[4, silence],[8, lead],[4, silence])._spectrum()
$: arrange([4, pad],[8, silence],[8, pad],[4, pad],[8, pad],[4, pad])._pianoroll()`
}
