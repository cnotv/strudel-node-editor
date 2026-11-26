import type { StrudelExample } from '../types'

export const dustAndDiesel: StrudelExample = {
  id: 'dust-and-diesel',
  label: 'Dust and Diesel (stoner rock)',
  code: `// Dust and Diesel: a stoner rock song in D minor
// Forty-eight bars: riff, verse, chorus, breakdown, chorus, outro. Low fuzz bass and guitar play one
// riff; the drums change their kick every bar and fill at the end of every phrase.
// Instruments: drums default kit, bass gm_electric_bass_pick, guitars gm_overdriven_guitar and gm_distortion_guitar
setcpm(80/4)

const riffs = "<[d2 ~ d2 f2 ~ g2 ab2 ~] [d2 ~ d2 f2 ~ g2 a2 ~] [d2 ~ d2 f2 ~ g2 ab2 ~] [c2 ~ c2 eb2 ~ f2 g2 ~]>"
const chorusRiffs = "<[bb1 ~ bb1 bb1 ~ f2 bb1 ~] [c2 ~ c2 c2 ~ g2 c2 ~] [d2 ~ d2 d2 ~ a2 d2 ~] [d2 ~ d2 f2 ~ g2 a2 ~]>"
const chorus = arrange([4, chorusRiffs], [3, chorusRiffs], [1, "[a1 ~ a1 a1 ~ e2 g2 ~]"])
const breakdown = arrange([3, "d2"], [1, "c2"], [3, "d2"], [1, "a1"])
const riff = arrange(
  [16, riffs], [8, chorus], [8, breakdown], [8, chorus],
  [6, riffs], [1, "d2"], [1, silence]
)
const drone = arrange(
  [24, silence],
  [3, "D5"], [1, "C5"], [3, "D5"], [1, "A5"],
  [16, silence]
)
const chorusLead = "<[~ ~ ~ ~ d5 ~ f5 ~] [g5@4 ~ ~ ~ ~] [a5@2 ~ g5 f5 ~ d5 ~] [d5@6 ~ ~] [~ ~ ~ ~ d5 ~ f5 ~] [g5 ~ f5 ~ g5@4] [a5@4 g5 ~ f5 ~] [e5@6 ~ ~]>"
const lead = arrange(
  [16, silence],
  [8, chorusLead],
  [8, "<[d5@8] ~ [a4@8] [c5@8] [d5@8] ~ [f5@4 e5@4] [e5@8]>"],
  [8, chorusLead],
  [6, silence], [1, "d5"], [1, silence]
)

const lone = "x ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~"
const k1 = "x ~ ~ ~ ~ ~ x ~ ~ ~ x ~ ~ ~ ~ ~"
const k2 = "x ~ ~ x ~ ~ ~ ~ ~ ~ x ~ ~ x ~ ~"
const k3 = "x ~ ~ ~ ~ ~ x x ~ ~ ~ ~ ~ ~ x ~"
const k4 = "x ~ ~ x ~ ~ x ~ ~ ~ ~ ~ ~ ~ ~ ~"
const c1 = "x ~ ~ x ~ ~ x ~ ~ ~ x ~ x ~ ~ ~"
const c2 = "x ~ x ~ ~ ~ x ~ ~ ~ x ~ ~ ~ ~ ~"
const verseKick = cat(k1, k2, k3, k4)
const chorusKick = cat(c1, c2, c1, k4, c1, c2, c2, k4)
const kicks = arrange(
  [4, silence], [4, cat(k1, k2, k1, k4)], [8, verseKick], [8, chorusKick],
  [8, cat(lone, "x ~ ~ ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ ~")], [8, chorusKick], [6, verseKick], [1, lone], [1, silence]
)
const backbeat = "~ ~ ~ ~ x ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~"
const snares = arrange(
  [4, silence], [20, backbeat], [8, "~ ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ ~ ~ ~"], [14, backbeat], [2, silence]
)
const ghost = "<[~ ~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ ~ ~ ~ ~] [~ ~ x ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ x] [~ ~ ~ ~ ~ ~ ~ ~ ~ x ~ ~ ~ ~ x ~] [~ ~ x ~ ~ ~ ~ x ~ ~ ~ ~ ~ ~ ~ ~]>"
const ghosts = arrange([8, silence], [8, ghost], [24, silence], [4, ghost], [4, silence])
const hatBars = "<[x x x x x x x x] [x x x x x x x ~]>"
const openBars = "<~ [~ ~ ~ ~ ~ ~ ~ x]>"
const rideBars = "<[x x x x x x x x] [x x x x x x [x x] x]>"
const hats = arrange([4, silence], [12, hatBars], [24, silence], [6, hatBars], [2, silence])
const openHats = arrange([4, silence], [12, openBars], [24, silence], [6, openBars], [2, silence])
const rides = arrange([16, silence], [8, rideBars], [8, "x ~ x ~ x ~ x ~"], [8, rideBars], [8, silence])
const fillPhrase = (fill) => arrange([3, silence], [1, fill])
const fills = arrange(
  ...[
    "~ ~ ~ ~ ~ ~ ~ ~ ht ~ mt ~ lt ~ lt lt",
    "~ ~ ~ ~ ~ ~ ~ ~ sd sd ht ~ mt ~ lt lt",
    "~ ~ ~ ~ ~ ~ ~ ~ ht ~ mt ~ lt ~ lt lt",
    "~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ sd sd sd sd",
    "~ ~ ~ ~ ~ ~ ~ ~ ht ht mt mt lt lt lt lt",
    "~ ~ ~ ~ ~ ~ ~ ~ sd sd ht ~ mt ~ lt lt",
    "~ ~ ~ ~ ~ ~ ~ ~ lt ~ lt ~ lt lt lt lt",
    "~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ sd sd sd sd",
    "~ ~ ~ ~ ~ ~ ~ ~ ht ~ mt ~ lt ~ lt lt",
    "~ ~ ~ ~ ~ ~ ~ ~ ht ht mt mt lt lt lt lt",
    "~ ~ ~ ~ ~ ~ ~ ~ sd sd ht ~ mt ~ lt lt"
  ].map((fill) => [4, fillPhrase(fill)]),
  [1, silence], [1, "~ ~ ~ ~ ~ ~ ~ ~ ht ht mt mt lt lt lt lt"], [2, silence]
)
const riffMask = "<1!24 0!8 1!16>"

$: stack(
  s("bd").struct(kicks).gain(.9),
  s("sd").struct(snares).late(1/96).gain(.8),
  s("sd").struct(ghosts).late(1/96).gain(.18),
  s("hh").struct(hats).gain(.32),
  s("oh").struct(openHats).gain(.32),
  s("rd").struct(rides).gain(.32),
  s(fills).gain(.7),
  s("cr").gain(.5).mask("<0!8 1 0!7 1 0!3 1 0!3 1 0!7 1 0!3 1 0!3 1 0!5 1 0>")
).gain(.5).room(.12).postgain(.4)._punchcard()
$: note(riff).s("gm_electric_bass_pick").shape(.5).lpf(700).decay(.3).sustain("<0!24 .6!8 0!16>")
  .gain(.9).postgain(.4).mask("<0!4 1!44>")._scope()
$: stack(
  note(riff).add(note("0,7")).s("gm_overdriven_guitar").hpf(60).shape(.8).lpf(1100)
    .decay(.35).sustain(.3).room(.1).gain(.5).mask(riffMask),
  note(riff).s("gm_distortion_guitar").hpf(60).shape(.6).lpf(800)
    .decay(.35).sustain(.35).gain(.4).mask(riffMask),
  chord(drone).voicing().add(note(-12)).s("gm_overdriven_guitar").shape(.7).lpf(900).attack(.3).release(2)
    .room(.3).gain(.4)
).postgain(.4)
$: note(lead).add(note(-12)).s("gm_distortion_guitar").shape(.5).lpf(1500).attack(.03).release(.8)
  .room(.45).delay(.25).delaytime(.375).delayfeedback(.35).gain(.5).postgain(.4)`
}
