import type { StrudelExample } from '../types'

export const lateFusion: StrudelExample = {
  id: 'late-fusion',
  label: 'Late Fusion (jazz funk)',
  code: `// bass: gm_slap_bass_1, drums: LinnDrum, chords: gm_epiano1, lead: gm_tenor_sax, pad: gm_string_ensemble_1, solo: gm_electric_guitar_clean
setcpm(100/4)

const chords = "<Dm9 G13 Cmaj7 A7>"

// bass: syncopated 16th grooves, roots plus octave pops plus ghost notes
const bassIntro = chords.rootNotes(1).note().struct("x ~ ~ ~ ~ ~ x ~ ~ ~ x ~ ~ ~ ~ ~").s("gm_slap_bass_1").clip(1).gain(.9)
const rootsA = chords.rootNotes(1).note().struct("x ~ ~ x ~ x ~ ~ x ~ ~ x ~ x ~ ~").s("gm_slap_bass_1").clip(1).gain(.9)
const popsA = chords.rootNotes(2).note().struct("~ ~ ~ ~ ~ ~ ~ x ~ ~ x ~ ~ ~ ~ x").s("gm_slap_bass_1").clip(1).gain(.65)
const ghostA = chords.rootNotes(1).note().struct("~ ~ x ~ ~ ~ x ~ ~ x ~ ~ ~ ~ x ~").s("gm_slap_bass_1").clip(1).lpf(600).gain(.35)
const rootsB = chords.rootNotes(1).note().struct("x ~ x x ~ x ~ x x ~ ~ x x ~ x ~").s("gm_slap_bass_1").clip(1).gain(.9)
const popsB = chords.rootNotes(2).note().struct("~ ~ ~ ~ x ~ ~ ~ ~ ~ x ~ ~ ~ ~ x").s("gm_slap_bass_1").clip(1).gain(.65)
const ghostB = chords.rootNotes(1).note().struct("~ x ~ ~ ~ ~ x ~ ~ x ~ ~ ~ x ~ ~").s("gm_slap_bass_1").clip(1).lpf(600).gain(.35)
const bassEnd = note("d1").s("gm_slap_bass_1").clip(1).gain(.9)

$: arrange(
  [4, bassIntro],
  [8, stack(rootsA, popsA, ghostA)],
  [8, stack(rootsB, popsB, ghostB)],
  [8, stack(rootsA, popsA, ghostA)],
  [1, bassEnd]
)

// drums: displaced kick, ghosted snares, accented 16th hats (sampled LinnDrum kit)
const kick = s("linndrum_bd").struct("x ~ ~ ~ ~ ~ ~ x ~ ~ x ~ ~ ~ ~ ~").gain(.85).room(.08)
const snare = s("linndrum_sd").struct("~ ~ ~ ~ x ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~").gain(.65).room(.2)
const ghostSnare = s("linndrum_sd").struct("~ ~ ~ x ~ ~ ~ ~ ~ x ~ ~ ~ ~ x ~").gain(.15).lpf(2500)
const hats = s("linndrum_hh*16").gain("[.5 .2 .35 .2]*4").hpf(4500).lpf(11000)
const openHat = s("linndrum_oh").struct("~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ ~ ~ ~ x ~").gain(.3).lpf(11000)
const groove = stack(kick, snare, ghostSnare, hats, openHat)
const endHit = stack(s("linndrum_bd").struct("x ~ ~ ~").gain(.9).room(.1), s("linndrum_oh").struct("x ~ ~ ~").gain(.5))

$: arrange(
  [4, stack(kick, hats.gain(.3))],
  [8, groove],
  [8, groove],
  [8, groove],
  [1, endHit]
)

// electric piano stabs
const stabsA = chord(chords).voicing().s("gm_epiano1").struct("~ ~ x ~ ~ x ~ ~ ~ ~ x ~ ~ ~ x ~").clip(1).room(.2).gain(.45)
const stabsB = chord(chords).voicing().s("gm_epiano1").struct("~ x ~ ~ x ~ ~ x ~ ~ ~ x ~ x ~ ~").clip(1).room(.2).gain(.45)
const endChord = chord("Dm9").voicing().s("gm_epiano1").struct("x ~ ~ ~").room(.3).gain(.5)

$: arrange(
  [4, silence],
  [8, stabsA],
  [8, stabsB],
  [8, stabsA],
  [1, endChord]
)

// tenor sax motif and solo, built on the chord plan
const motif = n("~ 4 ~ 2 3 ~ 1 0 ~ 2 4 ~ 5 ~ 4 ~").chord(chords).voicing().s("gm_tenor_sax").clip(1).room(.25).gain(.45)
const solo = n("0 2 4 3 2 4 5 4 3 2 1 2 4 ~ 5 3").chord(chords).voicing().s("gm_tenor_sax").clip(1).room(.25).gain(.4)
const endNote = n("0 ~ ~ ~").chord("Dm9").voicing().s("gm_tenor_sax").room(.3).gain(.45)

$: arrange(
  [4, silence],
  [8, motif],
  [8, solo],
  [8, motif],
  [1, endNote]
)

// guitar melody solo: one bar per chord (Dm9 G13 Cmaj7 A7), twice through, over the final head
const guitarSolo = note("<[~ a4 ~ f4 a4 ~ c5 d5] [b4 ~ d5 e5 ~ d5 b4 g4] [e5 ~ g5 e5 d5 ~ c5 b4] [c#5 ~ e5 g5 ~ e5 c#5 a4] [d5 f5 ~ a5 g5 f5 ~ e5] [d5 ~ b4 d5 e5 ~ g5 f5] [e5 d5 c5 ~ b4 c5 e5 ~] [e5 ~ c#5 a4 ~ g4 a4 ~]>").s("gm_electric_guitar_clean").clip(1).room(.2).gain(.4)

$: arrange(
  [20, silence],
  [8, guitarSolo],
  [1, silence]
)

// string pad under the solo and the return of the head
$: arrange(
  [12, silence],
  [16, chord(chords).voicing().s("gm_string_ensemble_1").attack(.3).release(.5).room(.3).gain(.2)],
  [1, silence]
)`
}
