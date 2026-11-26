import type { StrudelExample } from '../types'

export const psyFunkJazz: StrudelExample = {
  id: 'psy-funk-jazz',
  label: 'Psy Funk Jazz (psytrance funk jazz)',
  code: `// Psy funk jazz, 145 BPM, D dorian
setcps(145/60/4)

// psytrance kick: four on the floor
$: s("bd*4").bank("RolandTR909").gain(1.1)
  .mask("<1 1 1 1 1 1 1 0>")

// funk backbeat with ghost notes
$: s("~ sd ~ sd").bank("RolandTR909").gain(.9)
  .mask("<0 0 1 1 1 1 1 1>")
$: s("sd*16").bank("RolandTR909")
  .gain("0 0 0 0 0 .2 0 .15 0 .2 0 0 0 .15 .2 0")
  .mask("<0 0 1 1 1 1 1 1>")

// offbeat open hats plus 16th shuffle
$: s("[~ oh]*4").bank("RolandTR909").gain(.5).decay(.15)
$: s("hh*16").bank("RolandTR909").gain(.18)
  .mask("<0 1 1 1 1 1 1 1>")

// rolling psytrance bass, root follows the changes
$: note("<d2 g2 c2 f2>")
  .struct("[~ x x x]*4")
  .s("sawtooth").lpf(sine.range(250, 1400).slow(8)).lpq(8)
  .decay(.12).sustain(0).gain(.9)

// funk clav chops on jazz chords
$: chord("<Dm9 G13 Cmaj9 Fmaj7>").voicing()
  .struct("[x ~ ~ x ~ x ~ ~ x ~ ~ x ~ x x ~]")
  .s("sawtooth").lpf(2400).decay(.09).sustain(0)
  .gain(.5).pan(.35)
  .mask("<0 0 1 1 1 1 1 1>")

// jazz electric piano lead, swung phrases
$: n("<[0 2 4 5] [7 6 4 2] [4 ~ 2 4] [0 ~ ~ -1]>")
  .scale("D4:dorian").s("gm_epiano1")
  .gain(.7).room(.4).delay(.25).delaytime(.1875).delayfeedback(.4)
  .mask("<0 0 0 1 1 1 1 1>")

// psy sweep texture on top
$: note("<d4 g4 c4 f4>").s("sawtooth")
  .lpf(sine.range(400, 3500).slow(4)).gain(.12).room(.6)
  .mask("<0 0 0 0 1 1 1 1>")`
}
