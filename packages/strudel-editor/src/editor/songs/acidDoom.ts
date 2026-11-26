import type { StrudelExample } from '../types'

export const acidDoom: StrudelExample = {
  id: 'acid-doom',
  label: 'Acid Doom (psytrance doom)',
  code: `// bass: sawtooth and square, drums: RolandTR909, arp: sawtooth, wail: gm_electric_guitar_clean, pad: gm_string_ensemble_1
setcpm(145/4)

// one chord a bar, everything below derives from this
const plan = "<Em F Em Bb>"

// drums
const kick = s("rolandtr909_bd*4").gain(0.9)
const clap = s("~ rolandtr909_sd ~ rolandtr909_sd").gain(0.45).clip(1)
const hatOff = s("[~ rolandtr909_hh]*4").gain(0.45).clip(1)
const hat16 = s("rolandtr909_hh*16").gain(0.22).clip(1)

// psy rolling bass: three 16ths between each kick
const rolling = plan.rootNotes(2).struct("[~ x x x]*4").note().s("sawtooth").lpf(450).gain(0.7)

// Kyuss style half-time fuzz riff on the same roots
const doom = plan.rootNotes(2).struct("x ~ ~ x x ~ ~ ~").note().s("square").lpf(600).distort(1.2).gain(0.6).clip(1)

// acid arpeggio motif from the chord tones
const acid = chord(plan).dict("ireal").voicing().arp("0 2 1 3 2 1 3 2").s("sawtooth").lpf(sine.range(500,3200).slow(4)).gain(0.3).clip(1)

// Alice in Chains style slow grungy wail on chord tones
const wail = chord(plan).dict("ireal").voicing().arp("3@3 2 1@3 3").s("gm_electric_guitar_clean").distort(1.5).gain(0.35).clip(1).room(0.4)

// strings pad
const pad = chord(plan).dict("ireal").voicing().s("gm_string_ensemble_1").gain(0.3).attack(0.3).release(0.6)

// sections: intro 8, groove 16, breakdown 8, drop 16, outro 4
$: arrange([8, kick],[16, kick],[8, silence],[16, kick],[4, kick])
$: arrange([8, silence],[16, clap],[8, silence],[16, clap],[4, silence])
$: arrange([8, silence],[16, hatOff],[8, silence],[16, stack(hatOff, hat16)],[4, silence])
$: arrange([8, silence],[16, rolling],[8, doom],[16, rolling],[4, doom])
$: arrange([8, silence],[16, silence],[8, silence],[16, acid],[4, silence])
$: arrange([8, silence],[16, silence],[8, wail],[16, wail],[4, silence])
$: arrange([8, pad],[16, silence],[8, pad],[16, silence],[4, pad])`
}
