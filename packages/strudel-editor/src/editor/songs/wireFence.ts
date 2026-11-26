import type { StrudelExample } from '../types'

export const wireFence: StrudelExample = {
  id: 'wire-fence',
  label: 'Wire Fence (breakbeat)',
  code: `// Wire Fence: a breakbeat song in E minor
// Forty-eight bars: intro, verse, breakdown, verse, outro. Each string holds one number a bar.
// Instruments: break breaks125, bass sawtooth, clap and percussion default kit
setcpm(130/4)

$: s("breaks125").fit().gain(.75).chop(16).mask("<1!28 0!4 1!16>")._punchcard()
$: note("<[e1 ~ e2 ~ ~ e1 ~ g1] [e1 ~ e2 ~ ~ d2 ~ b1] [c2 ~ c3 ~ ~ c2 ~ d2] [b1 ~ b2 ~ ~ b1 ~ d2]>")
  .s("sawtooth").lpf(600).decay(.2).sustain(.2).gain(.65).mask("<0!4 1!40 0!4>")._scope()
$: s("~ cp ~ cp").gain(.45).mask("<0!8 1!20 0!4 1!12 0!4>")
$: s("perc(5,8)").hpf(500).gain(.5).pan(sine.range(.3, .7).slow(4)).mask("<0!12 1!36>")`
}
