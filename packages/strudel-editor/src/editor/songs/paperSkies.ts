import type { StrudelExample } from '../types'

export const paperSkies: StrudelExample = {
  id: 'paper-skies',
  label: 'Paper Skies (grunge)',
  code: `// Paper Skies: a grunge song in G minor at 112 BPM
// Forty bars: quiet verse, loud chorus, quiet verse, loud chorus, bridge, outro. The verse is a clean guitar arpeggio
// over an acoustic strum and a light kick; the chorus turns on the fuzz, the pumping bass and a shouted hook.
// Instruments: clean guitar jangle_note, acoustic campfire_chord, fuzz guitar seattle_chord and seattle_note, bass grungebass_note, drums garagekit, side stick default rim, organ doomorgan_note
setcpm(112/4)

const plan = (verse, chorus, bridge, outro) =>
  arrange([8, verse], [8, chorus], [8, verse], [8, chorus], [4, bridge], [4, outro])
const changes = plan("<Gm Gm Eb F>", "<Gm Eb Bb F>", "<Cm Cm D D>", "<Gm Eb Gm Gm>")
const roots = changes.rootNotes(2)
const hook = "<[5 ~ 5 5 ~ 4 ~ 3] [4 ~ 4 4 ~ 3 ~ 1]>"

const quiet = "<1!8 0!8 1!8 0!8 1!8>"
const loud = "<0!8 1!8 0!8 1!8 0!8>"
const bridgeBars = "<0!32 1!4 0!4>"
const lastBar = "<0!39 1>"
const chorusKick = "x ~ x ~ x ~ ~ x"

$: stack(
  s("garagekit_kick").struct("x ~ ~ ~ x ~ ~ ~").gain(.17).mask(quiet),
  s("rim").struct("~ ~ x ~ ~ ~ x ~").gain(.28).mask(quiet),
  s("garagekit_hatclosed").struct("x ~ x ~ x ~ x ~").gain(.28).cut(2).mask(quiet),
  s("garagekit_kick").struct(chorusKick).gain(.28).mask(loud),
  s("garagekit_snare").struct("~ ~ x ~ ~ ~ x ~").gain(.28).mask(loud),
  s("garagekit_hatopen").struct("x x x x x x x x").swingBy(1/8, 8).gain(.14).cut(2).mask(loud),
  s("garagekit_tomhi garagekit_tommid garagekit_tomlow garagekit_tomlow").gain(.25).mask("<0!7 1 0!7 1 0!7 1 0!7 1 0!8>"),
  s("garagekit_crash").struct("x").gain(.2).mask("<0!8 1 0!15 1 0!11 1 0!2 1>")
)._punchcard()
$: stack(
  note(roots).struct("x ~ ~ x ~ ~ x ~").add(note(-12)).s("grungebass_note").clip(1).gain(.62).mask(quiet),
  note(roots).struct("x x x x x x x x").add(note(-12)).s("grungebass_note").clip(1).gain(.62).mask(loud)
)._scope()
$: stack(
  n("0 1 2 1 0 1 2 1").chord(changes).voicing().s("jangle_note").clip(1).gain(.44).mask(quiet),
  note(roots).add(note(12)).struct("x ~ x x ~ x x ~").s("campfire_chord").cut(1).gain(.34).mask(quiet),
  note(roots).struct("x ~ x ~ x ~ x x").s("seattle_chord").cut(1).gain(.34).mask(loud),
  note(roots).add(note("12,19")).s("doomorgan_note").clip(1).gain(.18).mask(bridgeBars),
  note(roots).struct("x ~").s("seattle_chord").clip(1).gain(.34).mask(lastBar)
)
$: n(hook).scale("g3:minor:pentatonic").s("seattle_note").clip(1).gain(.28).mask(loud)`
}
