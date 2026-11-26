import type { StrudelExample } from '../types'

export const sunBleached: StrudelExample = {
  id: 'sun-bleached',
  label: 'Sun Bleached (stoner rock)',
  code: `// Sun Bleached: a stoner rock song in A minor at 96 BPM
// Thirty-six bars: intro, verse, chorus, half time break, chorus, outro. The guitar plays the riff, the bass
// answers it on another rhythm, the kick sits between them, and the chorus opens onto ride, claps and a soft organ.
// Instruments: guitar stoner_chord and stoner_mute, lead stoner_note, bass fuzzbass, drums garagekit plus rolandtr909_rd ride, organ doomorgan_note (low, dark and soft), claps default cp
setcpm(96/4)

const plan = (intro, verse, chorus, breakdown, outro) =>
  arrange([4, intro], [8, verse], [8, chorus], [4, breakdown], [8, chorus], [4, outro])
const roots = plan("<a1 a1 a1 e2>", "<a1 a1 c2 e2>", "<f2 f2 g2 a1>", "<a1 a1 e2 a1>", "<a1 a1 a1 a1>")
const riff = "<[0 ~ 0 0 ~ 3 7 ~] [0 ~ 0 0 ~ 3 5 ~]>"
const lead = "<[3 ~ 5 ~ 3 ~ 2 3] [5 ~ 6 ~ 5 ~ 3 4]>"

const riffBars = "<1!12 0!20 1!3 0>"
const chorusBars = "<0!12 1!8 0!4 1!8 0!4>"
const breakBars = "<0!20 1!4 0!12>"
const lastBar = "<0!35 1>"
const verseKick = cat("x ~ ~ ~ ~ ~ x ~ ~ ~ x ~ ~ ~ ~ ~", "x ~ ~ x ~ ~ ~ ~ ~ ~ x ~ ~ x ~ ~")
const chorusKick = "x ~ ~ ~ ~ ~ x ~ x ~ ~ ~ ~ ~ x ~"
const kicks = arrange(
  [4, "x ~ ~ ~ x ~ ~ ~"], [8, verseKick], [8, chorusKick], [4, "x ~ ~ ~ ~ ~ ~ ~"],
  [8, chorusKick], [3, verseKick], [1, silence]
)
const backbeat = arrange([4, silence], [16, "~ ~ x ~ ~ ~ x ~"], [4, "~ ~ ~ ~ x ~ ~ ~"], [8, "~ ~ x ~ ~ ~ x ~"], [3, "~ ~ x ~ ~ ~ x ~"], [1, silence])

$: stack(
  s("garagekit_kick").struct(kicks).gain(.27),
  s("garagekit_snare").struct(backbeat).gain(.22),
  s("garagekit_hatclosed").struct("x ~ x x ~ x x ~").gain(.14).cut(2).mask(riffBars),
  s("garagekit_hatopen").struct("~ ~ ~ ~ ~ ~ ~ x").gain(.14).cut(2).mask("<0!4 1!8 0!24>"),
  s("rolandtr909_rd").struct("x x x x x x x x").gain(.12).cut(3).clip(1).mask(chorusBars),
  s("cp").struct("~ ~ x ~ ~ ~ x ~").gain(.24).mask(chorusBars),
  s("~ ~ ~ ~ garagekit_tomhi garagekit_tommid garagekit_tomlow garagekit_tomlow").gain(.22).mask("<0!11 1 0!7 1 0!3 1 0!7 1 0!4>"),
  s("garagekit_crash").struct("x").gain(.19).mask("<0!12 1 0!11 1 0!7 1 0!2 1>")
)._punchcard()
$: stack(
  note(roots).struct("x ~ ~ x ~ x x ~").s("fuzzbass").clip(1).gain(.38).mask("<0!4 1!8 0!20 1!3 0>"),
  note(roots).struct("x ~ ~ ~ ~ ~ ~ ~").s("fuzzbass").clip(1).gain(.38).mask(breakBars),
  note(roots).struct("x x ~ x x ~ x x").s("fuzzbass").clip(1).gain(.38).mask(chorusBars)
)._scope()
$: stack(
  note(riff).add(note(roots)).s("stoner_chord").cut(1).gain(.28).mask(riffBars),
  note(roots).struct("x ~ ~ ~ x ~ x ~").s("stoner_chord").cut(1).gain(.28).mask(chorusBars),
  note(roots).struct("x ~ ~ ~ ~ ~ ~ ~").s("stoner_chord").cut(1).gain(.28).mask(breakBars),
  note(roots).struct("x x ~ x x ~ x x").s("stoner_mute").cut(1).gain(.2).mask(breakBars),
  note(roots).struct("x ~").s("stoner_chord").clip(1).gain(.4).mask(lastBar),
  note(roots).add(note("0,7")).s("doomorgan_note").lpf(450).attack(.06).release(.3).clip(1).gain(.06).mask(chorusBars)
)
$: n(lead).scale("a3:minor:pentatonic").s("stoner_note").clip(1).gain(.2).mask(chorusBars)`
}
