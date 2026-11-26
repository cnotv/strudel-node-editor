import type { StrudelExample } from '../types'

export const rustAndRain: StrudelExample = {
  id: 'rust-and-rain',
  label: 'Rust and Rain (grunge)',
  code: `// Rust and Rain: a grunge song in E minor
// Forty bars: quiet verse, loud chorus, quiet verse, loud chorus, bridge, outro.
// Instruments: drums default kit, bass sawtooth, guitars gm_electric_guitar_clean, gm_overdriven_guitar and gm_distortion_guitar
setcpm(120/4)

const plan = (verse, chorus, bridge, outro) =>
  arrange([8, verse], [8, chorus], [8, verse], [8, chorus], [4, bridge], [4, outro])
const changes = plan("<E5 F5 F#5 G5>", "<E5 G5 A5 C5>", "<C5 C5 D5 D5>", "<E5 G5 A5 E5>")
const roots = plan("<e2 f2 f#2 g2>", "<e2 g2 a1 c2>", "<c2 c2 d2 d2>", "<e2 g2 a1 e2>")
const rhythm = arrange(
  [8, "x ~ ~ x ~ ~ x ~"], [8, "x x ~ x x ~ x x"], [8, "x ~ ~ x ~ ~ x ~"], [8, "x x ~ x x ~ x x"],
  [4, "x ~ ~ ~ x ~ ~ ~"], [3, "x x ~ x x ~ x x"], [1, "x ~ ~ ~ ~ ~ ~ ~"]
)
const hookLines = "<[e5 ~ e5 e5 ~ d5 ~ b4] [d5 ~ d5 d5 ~ b4 ~ g4] [e5 ~ e5 e5 ~ c5 ~ a4] [g4 ~ g4 g4 ~ e4 ~ ~]>"
const hook = arrange([4, hookLines], [3, hookLines], [1, "[c5 ~ g4 ~ c5 ~ e4 ~]"])
const lead = arrange(
  [8, silence], [8, hook], [8, silence], [8, hook],
  [1, "g4"], [1, silence], [1, "a4"], [1, silence],
  [3, hookLines], [1, "b4"]
)
const quiet = "<1!8 0!8 1!8 0!16>"
const loud = "<0!8 1!8 0!8 1!8 0!4 1!4>"

$: stack(
  s("bd ~ ~ ~ bd ~ ~ ~").gain(.5).mask(quiet),
  s("~ ~ sd ~ ~ ~ sd ~").gain(.4).mask(quiet),
  s("hh*8").gain(.28).mask(quiet),
  s("bd ~ bd ~ bd ~ ~ bd").gain(.8).mask(loud),
  s("~ ~ sd ~ ~ ~ sd ~").gain(.75).mask(loud),
  s("oh*4").gain(.35).mask(loud),
  s("~ ~ ~ ~ ~ ~ mt lt").gain(.5).mask("<0!15 1 0!15 1 0!8>"),
  s("bd ~ ~ ~ ~ ~ ~ ~, ~ ~ ~ ~ sd ~ ~ ~").gain(.6).mask("<0!32 1!4 0!4>"),
  s("cr").gain(.6).mask("<0!8 1 0!15 1 0!11 1 0!2 1>")
).gain(.36)._punchcard()
$: note(roots).struct(rhythm)
  .s("sawtooth").lpf(520).shape(.3).decay(.18).sustain(0).gain("<.28!8 .44!8 .28!8 .44!16>")._scope()
$: note(lead).s("gm_distortion_guitar").lpf(3000).decay(.25).sustain(.3)
  .room(.2).gain(.24)
$: stack(
  n("0 1 2 3 2 1 0 1").chord(changes).voicing().s("gm_electric_guitar_clean")
    .decay(.4).sustain(0).room(.3).gain(.2).mask(quiet),
  chord(changes).voicing().struct("x ~ ~ x ~ ~ x ~").s("gm_overdriven_guitar")
    .lpf(1800).decay(.25).sustain(.1).room(.25).gain(.19).mask("<0!8 1!8 0!8 1!8 1!7 0>"),
  chord("<~!39 E5>").voicing().s("gm_overdriven_guitar").lpf(1600).release(2.5).room(.4).gain(.21)
)`
}
