import type { StrudelExample } from '../types'

export const uptownStrut: StrudelExample = {
  id: 'uptown-strut',
  label: 'Uptown Strut (funk)',
  code: `// Uptown Strut: a funk song in E
// Thirty-two bars: a short funky intro, chorus, break, chorus and a last hit. The bass leads.
// Instruments: drums default kit, bass gm_slap_bass_1, clavinet gm_clavinet, guitar gm_electric_guitar_muted, brass gm_brass_section
setcpm(105/4)

const vamp = "<A9 A9 E9 E9 B9 A9 E9 B9>"
const changes = arrange([8, "E9"], [8, vamp], [8, "E9"], [8, vamp])

const slapE = "<[e1 ~ ~ e2 ~ ~ e1 ~ b1 ~ d2 ~ e2 ~ g1 g#1] [e1 ~ e2 ~ ~ e1 ~ b1 ~ ~ e2 d2 ~ b1 a1 g#1]>"
const slapChorus = "<[a1 ~ ~ a2 ~ ~ a1 ~ e2 ~ g2 ~ a2 ~ c2 c#2] [a1 ~ ~ a2 ~ ~ a1 ~ e2 ~ g2 ~ a2 ~ c2 c#2] [e1 ~ ~ e2 ~ ~ e1 ~ b1 ~ d2 ~ e2 ~ g1 g#1] [e1 ~ ~ e2 ~ ~ e1 ~ b1 ~ d2 ~ e2 ~ g1 g#1] [b1 ~ ~ b2 ~ ~ b1 ~ f#2 ~ a2 ~ b2 ~ d2 d#2] [a1 ~ ~ a2 ~ ~ a1 ~ e2 ~ g2 ~ a2 ~ c2 c#2] [e1 ~ ~ e2 ~ ~ e1 ~ b1 ~ d2 ~ e2 ~ g1 g#1] [b1 ~ ~ b2 ~ ~ b1 ~ f#2 ~ a2 ~ b2 ~ d2 d#2]>"
const bass = arrange([8, slapE], [8, slapChorus], [8, slapE], [7, slapChorus], [1, "e1 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~"])

const horns = "<[~ ~ ~ ~ ~ c#5 e5 ~] [g5 ~ e5 ~ c#5 ~ ~ ~] [~ ~ ~ ~ ~ g#4 b4 ~] [d5 ~ b4 ~ g#4 ~ ~ ~] [~ ~ ~ ~ ~ d#5 f#5 ~] [e5 ~ c#5 ~ a4 ~ ~ ~] [~ ~ ~ ~ ~ g#4 b4 ~]>"
const brass = arrange(
  [6, silence], [1, "~ ~ ~ ~ ~ c#5 e5 ~"], [1, "g5 ~ e5 ~ c#5 ~ ~ ~"],
  [7, horns], [1, "f#5 ~ d#5 ~ b4 ~ a4 ~"],
  [8, silence], [7, horns], [1, "e5 ~ ~ ~ ~ ~ ~ ~"]
)

const full = "<1!16 0!8 1!7 0>"
const comp = "<0!2 1!14 0!8 1!7 0>"
const kit = "<0 1!21 0!2 1!7 0>"

$: stack(
  s("bd ~ ~ bd ~ ~ bd ~ ~ ~ bd ~ ~ ~ bd ~").gain(.85).mask(kit),
  s("~ ~ ~ ~ sd ~ ~ ~ ~ ~ ~ ~ sd ~ ~ ~").gain(.55).lpf(3500).room(.1).mask(kit),
  s("~ sd ~ ~ ~ ~ ~ sd ~ sd ~ ~ ~ ~ ~ sd").gain(.1).lpf(2500).mask(full),
  s("hh*16").gain("[.5 .25 .4 .25]*4").mask(full),
  s("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ oh ~").gain(.4).mask(full),
  s("perc(5,8)").hpf(600).gain(.3).mask("<0!4 1!12 0!8 1!7 0>")
).gain(.3)._punchcard()
$: stack(
  note(bass).s("gm_slap_bass_1").decay(.25).sustain(0).gain(.9),
  s("<~!31 [bd,cr]>").gain(.4)
)._punchcard()
$: stack(
  chord(changes).voicing().struct("~ x ~ x ~ ~ x ~ ~ x ~ x ~ ~ x ~").s("gm_clavinet")
    .decay(.06).sustain(0).room(.15).gain(.18).mask(comp),
  chord(changes).voicing().struct("~ ~ x ~ ~ ~ x ~ ~ ~ x ~ ~ ~ x ~").s("gm_electric_guitar_muted")
    .decay(.08).sustain(0).gain(.14).mask(comp),
  chord("<~!31 E9>").voicing().s("gm_clavinet").decay(1.5).sustain(0).room(.3).gain(.22)
)._pianoroll()
$: note(brass).s("gm_brass_section").decay(.18).sustain(.2).room(.25).gain(.3)`
}
