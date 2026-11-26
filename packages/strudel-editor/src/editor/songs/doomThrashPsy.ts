import type { StrudelExample } from '../types'

export const doomThrashPsy: StrudelExample = {
  id: 'doom-thrash-psy',
  label: 'Doom Thrash Psy (psytrance doom thrash)',
  code: `// Mix of 1200 Micrograms (psytrance), 1000mods (doom fuzz) and Slayer (thrash)
// E phrygian, 148 bpm. Paste whole block into Strudel and play.
setcpm(148/4)

const fuzz = p => p.s("sawtooth").distort(2.5).lpf(1800)
const mellowFuzz = p => p.s("sawtooth").distort(1).lpf(900).room(.3)
const soft = p => p.s("supersaw").lpf(1100).distort(.3).room(.3)
const kick4 = s("bd*4").gain(1.1)
const offHat = s("~ hh").fast(4).gain(.5)
const roll = note("~ e1 e1 e1").fast(4).s("sawtooth")
  .lpf(sine.range(250, 900).slow(8)).lpq(8).gain(.9)
const lead = note("e4 g4 e4 a4 e4 bb4 e4 g4").fast(2).s("supersaw")
  .lpf(sine.range(400, 2500).slow(4)).lpq(6).delay(.3).delaytime(.1875).room(.3)

// short soft synth chord stab where the clap used to hit
const stab = note("~ [e4,b4]").s("triangle")
  .decay(.15).sustain(0).lpf(2200).gain(.3)
  .room(.4).delay(.3).delaytime(.1875).delayfeedback(.35)

const doom = stack(
  mellowFuzz(note("e1 ~ ~ e1 g1 ~ a1 ~ bb1 ~ a1 g1 ~ ~ e1 ~").slow(4)).gain(.6),
  mellowFuzz(note("e2 ~ ~ e2 g2 ~ a2 ~ bb2 ~ a2 g2 ~ ~ e2 ~").slow(4)).gain(.25),
  kick4.gain(.7),
  offHat.gain(.3),
  roll.gain(.35),
  s("~ ~ ~ ~ sd ~ ~ ~").gain(.5).lpf(3500),
  s("oh ~ ~ ~ ~ ~ ~ ~").gain(.25)
)

const thrash = stack(
  note("[e3 e3 f3 e3 e3 g3 e3 e3 bb3 a3 g3 f3 e3 e3 f3 e3]").slow(2)
    .s("gm_acoustic_guitar_nylon").gain(.7).lpf(2500).room(.4),
  note("<[e2,b2] [e2,b2] [f2,c3] [e2,b2]>")
    .s("gm_acoustic_guitar_nylon").gain(.3).room(.5),
  kick4.gain(.6),
  offHat.gain(.3),
  roll.gain(.4),
  s("~ sd").fast(2).gain(.3).lpf(3000)
)

const psy = stack(
  kick4,
  offHat,
  roll,
  lead.gain(.45),
  stab
)

const mix = stack(
  kick4,
  offHat.gain(.35),
  roll.gain(.7),
  soft(note("[e2 e2 f2 e2 e2 g2 e2 e2 bb2 a2 g2 f2 e2 e2 f2 e2]").fast(2)).gain(.3).delay(.3),
  lead.gain(.3),
  stab
)

$: arrange(
  [4, doom],
  [4, thrash],
  [8, psy],
  [4, thrash],
  [8, mix],
  [4, doom]
)`
}
