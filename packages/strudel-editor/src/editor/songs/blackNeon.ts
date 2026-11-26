import type { StrudelExample } from '../types'

export const blackNeon: StrudelExample = {
  id: 'black-neon',
  label: 'Black Neon (drum and bass synthwave)',
  code: `// Black Neon: a drum and bass, synthwave and darkwave mix in D minor at 174 BPM
// Fifty-six bars: intro 8, drop 16, break 8, drop 16, outro 8. The two-step break and the rolling Reese bass are Subfocus style drum and bass; the gated snare, arpeggio and dotted lead are synthwave; the cold strings and choir are darkwave.
// Instruments: drums RolandTR909, bass sawtooth and sine, arpeggio sawtooth, lead square, pad gm_string_ensemble_1, choir gm_choir_aahs
setcpm(174/4)

// one chord a bar, everything below derives from this
const chords = "<Dm Bb Gm Am>"

// two-step kicks, half-time snares, a tom fill closing the intro and the break
const kickPlain = "x ~ ~ ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ ~"
const kickGhost = "x ~ ~ ~ ~ ~ ~ x ~ ~ x ~ ~ ~ ~ ~"
const kickHalf = "x ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ ~ ~ ~"
const dropKicks = cat(kickPlain, kickPlain, kickGhost, kickPlain)
const kicks = arrange([8, silence], [16, dropKicks], [8, kickHalf], [16, dropKicks], [8, silence])
const snareDrop = "~ ~ ~ ~ x ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~"
const snareHalf = "~ ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ ~ ~ ~"
const snares = arrange([8, silence], [16, snareDrop], [8, snareHalf], [16, snareDrop], [8, silence])
const fill = "x ~ x ~ x ~ x ~ x x x x x x x x"
const fills = arrange([7, silence], [1, fill], [16, silence], [7, silence], [1, fill], [24, silence])

// bass: syncopated rolling line in the drops, one held note a bar elsewhere
const bassHeld = "x"
const bassRolling = "x ~ ~ ~ ~ ~ x ~ x ~ ~ x ~ ~ ~ ~"
const bassLine = arrange([4, silence], [4, bassHeld], [16, bassRolling], [8, bassHeld], [16, bassRolling], [8, bassHeld])

// arpeggio from the chord tones: eighths, then sixteenths in the drops
const arpEighths = "[0 1 2 3 2 1 2 1]"
const arpSixteenths = "[0 1 2 3 2 1 2 1]*2"
const arpLine = arrange([8, arpEighths], [16, arpSixteenths], [8, arpEighths], [16, arpSixteenths], [8, arpEighths])

// lead: a dotted three, three, two motif that falls onto each chord's tones
const motif = "<[4 ~ ~ 2 ~ ~ 0 ~] [7 ~ ~ 5 ~ ~ 2 ~] [7 ~ ~ 5 ~ ~ 3 ~] [8 ~ ~ 6 ~ ~ 4 ~]>"
const leadLine = arrange([16, silence], [32, motif], [8, silence])

$: s("rolandtr909_bd").struct(kicks).gain(.75).clip(1)
$: s("rolandtr909_sd").struct(snares).gain(.6).clip(1).room(.3)
$: s("rolandtr909_cp").struct(snares).gain(.4).clip(1).room(.6)
$: s("rolandtr909_hh").struct("x*16").gain("[.5 .2 .35 .2]*4").clip(1).mask("<0!8 1!16 0!8 1!16 0!8>")
$: s("rolandtr909_oh").struct("[~ x]*4").gain(.3).clip(1).mask("<0!24 1!8 0!24>")
$: s("rolandtr909_mt").struct(fills).gain(.6).clip(1).room(.3)
$: chords.rootNotes(2).struct(bassLine).note().s("sawtooth").lpf(sine.range(300,1800).slow(8)).gain(.4).clip(1)
$: chords.rootNotes(1).struct(bassLine).note().s("sine").gain(.35).clip(1)
$: n(arpLine).chord(chords).voicing().s("sawtooth").lpf(sine.range(900,3000).slow(8)).gain(.16).clip(1).delay(.3).delaytime(.26).delayfeedback(.4)
$: n(leadLine).scale("D5:minor").s("square").lpf(2800).gain(.22).clip(1).room(.4).delay(.25).delaytime(.26).delayfeedback(.4)._spectrum()
$: chord(chords).voicing().s("gm_string_ensemble_1").gain(.2).attack(.4).release(.8).room(.5).mask("<1!8 0!16 1!8 0!16 1!8>")
$: chord(chords).voicing().s("gm_choir_aahs").gain(.15).attack(.6).release(1).room(.8).lpf(2500).mask("<0!24 1!8 1!16 0!8>")._pianoroll()`
}
