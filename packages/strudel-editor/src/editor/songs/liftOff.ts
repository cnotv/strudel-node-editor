import type { StrudelExample } from '../types'

export const liftOff: StrudelExample = {
  id: 'lift-off',
  label: 'Lift Off (trance)',
  code: `// Lift Off: an uplifting trance song in A minor
// Sixty-four bars: intro, theme, breakdown with a riser, drop, outro. One number a bar.
// Instruments: drums RolandTR909, bass, lead and chords sawtooth, riser white noise
setcpm(138/4)

$: s("bd*4").bank("RolandTR909").gain(.5).mask("<1!24 0!16 1!24>")._spectrum()
$: stack(
  s("[~ hh]*4").bank("RolandTR909").gain(.3).mask("<0!8 1!16 0!16 1!24>"),
  s("sd*16").gain("<0!36 .1 .2 .3 .4 0!24>")
)
$: note("[~ a1 a1 a1]*4").add(note("<0 -4 3 -2>")).s("sawtooth").lpf(600)
  .decay(.1).sustain(0).gain(.55).mask("<0!8 1!16 0!16 1!16 0!8>")
$: stack(
  n("0 2 4 7 9 7 4 2").fast(2).scale("<A3:minor F3:major C4:major G3:major>")
    .s("sawtooth").lpf("<800!8 1400!16 1000!8 2400!8 3000!16 1400!8>").decay(.12).sustain(0)
    .delay(.3).room(.3).gain(.25).mask("<0!8 1!48 0!8>"),
  chord("<Am F C G>").voicing().s("sawtooth").lpf(1600).attack(.2).release(.6).room(.6).gain(.12)
    .mask("<0!24 1!32 0!8>")
)._pianoroll()
$: s("<~!32 white@8 ~!24>").lpf(150).lpattack(13).lpenv(7).lpsustain(1).attack(10).sustain(1)
  .release(.02).gain(.3)`
}
