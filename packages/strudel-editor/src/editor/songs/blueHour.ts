import type { StrudelExample } from '../types'

export const blueHour: StrudelExample = {
  id: 'blue-hour',
  label: 'Blue Hour (jazz)',
  code: `// Blue Hour: a jazz song in Bb major, on rhythm changes
// Forty bars: intro, a 32-bar AABA head, tag. Swung eighths; the bass walks in quarters.
// Instruments: drums default kit, bass gm_acoustic_bass, comping gm_epiano1, melody gm_vibraphone
setcpm(136/4)

const turn = "[Cm7 F7]"
const bridge = "<D7 D7 G7 G7 C7 C7 F7 F7>"
const aChanges = "<[Bb^7 G7] [Cm7 F7] [Bb^7 G7] [Cm7 F7] [Fm7 Bb7] [Eb^7 Ab7] [Bb^7 G7]>"
const head = (changes, end) => arrange([7, changes], [1, end])
const changes = arrange(
  [4, turn], [8, head(aChanges, turn)], [8, head(aChanges, "Bb^7")],
  [8, bridge], [8, head(aChanges, "Bb^7")], [3, turn], [1, "Bb^7"]
)

const walkTurn = "c2 eb2 f1 a1"
const walkA = "<[bb1 d2 g1 b1] [c2 eb2 f1 a1] [bb1 d2 g1 b1] [c2 eb2 f1 a1] [f1 ab1 bb1 d2] [eb2 g2 ab1 c2] [bb1 d2 g1 b1]>"
const walkBridge = "<[d2 f#2 a2 f#2] [d2 c2 a1 f#1] [g1 b1 d2 f2] [g1 f2 d2 b1] [c2 e2 g2 e2] [c2 bb1 g1 e1] [f1 a1 c2 eb2] [f1 eb2 c2 a1]>"
const bass = arrange(
  [4, walkTurn], [8, head(walkA, walkTurn)], [8, head(walkA, "bb1 d2 f2 c#2")],
  [8, walkBridge], [8, head(walkA, "bb1 d2 f2 b1")], [3, walkTurn], [1, "bb1"]
)

const headLine = "<[d5 ~ f5 d5 ~ ~ b4 ~] [c5 ~ eb5 g5 ~ ~ a4 c5] [d5 f5 a5 f5 ~ d5 b4 ~] [bb4 ~ g4 eb5 ~ ~ c5 ~] [ab4 ~ c5 eb5 ~ ~ d5 ~] [g4 ~ bb4 d5 ~ ~ c5 ~] [f5 ~ d5 bb4 ~ ~ b4 d5]>"
const bridgeLine = "<[f#5 ~ a5 f#5 ~ ~ d5 ~] [c5 ~ ~ a4 ~ f#4 ~ ~] [b4 ~ d5 f5 ~ ~ d5 ~] [f5 ~ ~ d5 ~ b4 ~ ~] [e5 ~ g5 e5 ~ ~ c5 ~] [bb4 ~ ~ g4 ~ e4 ~ ~] [a4 ~ c5 eb5 ~ ~ c5 ~] [eb5 ~ ~ c5 ~ a4 ~ ~]>"
const melody = arrange(
  [4, silence], [8, head(headLine, "eb5 ~ c5 ~ a4 ~ ~ ~")], [8, head(headLine, "d5 ~ bb4 ~ f4 ~ ~ ~")],
  [8, bridgeLine], [8, head(headLine, "d5 ~ bb4 ~ f4 ~ ~ ~")], [3, silence], [1, "d5"]
)

$: stack(
  s("hh ~ hh hh hh ~ hh hh").gain(.45),
  s("bd bd bd bd").gain(.1),
  s("~ sd ~ sd").gain(.12).lpf(3000)
).swingBy(1/3, 4).mask("<0!4 1!36>")
$: note(bass).s("gm_acoustic_bass").release(.2).room(.2).gain(.75)._punchcard()
$: stack(
  chord(changes).voicing().struct("~ ~ x ~ ~ x ~ ~").s("gm_epiano1").decay(.5).sustain(.2)
    .room(.3).gain(.22).swingBy(1/3, 4).mask("<1!39 0>"),
  chord("<~!39 Bb^7>").voicing().s("gm_epiano1").release(2).room(.4).gain(.24)
)._pianoroll()
$: note(melody).s("gm_vibraphone").swingBy(1/3, 4).room(.3).gain(.4)._pitchwheel()`
}
