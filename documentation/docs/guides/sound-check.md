---
sidebar_position: 30
---

import SoundCase from '@site/src/components/SoundCase'

# Checking a sound without listening

`node scripts/strudel-check.mjs <pattern> --out-dir <dir>` renders a pattern muted and writes a
spectrogram, a waveform and a report. This page is how a person reads them to find what is
wrong. Start with the waveform, then the spectrogram, then the numbers.

![Spectrogram of a kick and a bass line](/img/sound-check/demo.spectrogram.png)

## Reading the waveform

The waveform is loudness over time, so it answers "what plays when, and how loud". The two
colours in an example are the left and right channels.

| You see                                                                                                                            | It means                                 | Try                                           |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| a flat line<br/><SoundCase sprite="waveform" index={0} alt="A flat waveform" />                                                    | nothing rendered                         | a pattern error, a wrong sample name, `.gain` |
| a flat top, cut off<br/><SoundCase sprite="waveform" index={1} alt="A waveform filling the whole height" />                        | clipping, the sound is distorted         | lower `.gain` or the number of stacked layers |
| a swollen block, no gaps<br/><SoundCase sprite="waveform" index={2} alt="A waveform that never drops to silence" />                | tails pile up, the mix is muddy          | `.clip(1)`, `.cut(n)` or a shorter `.release` |
| a spike, then a long fade<br/><SoundCase sprite="waveform" index={3} alt="A waveform that decays slowly" />                        | a sample or reverb ringing past its note | `.clip(1)`, a lower `.room`                   |
| one side taller than the other<br/><SoundCase sprite="waveform" index={4} alt="Two channels of different height" />                | a hard pan or a one sided layer          | check `.pan` and the stereo effects           |
| a quiet start or a missing bar<br/><SoundCase sprite="waveform" index={5} alt="Three hits with a gap where the third should be" /> | a part sits out or starts late           | check the `<...>` bar strings and `silence`   |

Peaks should sit well above zero where the sound plays and under full scale. The report gives
the same facts as numbers: `peak`, `clipped` and `silenceRatio`.

## Reading the spectrogram

Time runs left to right, pitch bottom to top (low to high), and the colour is loudness, from
black (silent) to white (loudest). It answers "what is playing, and where in the pitch range".
The axis is linear, so low notes sit close to the bottom edge.

| You see                                                                                                                     | It means                                      | Try                                          |
| --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------- |
| a vertical stripe<br/><SoundCase sprite="spectrogram" index={0} alt="Vertical stripes" />                                   | a hit: a kick, snare or hat                   | count the stripes against the pattern        |
| a horizontal bright line<br/><SoundCase sprite="spectrogram" index={1} alt="One horizontal line" />                         | a held note; its height is its pitch          | check the line sits at the expected note     |
| a ladder of evenly spaced lines<br/><SoundCase sprite="spectrogram" index={2} alt="Many evenly spaced horizontal lines" />  | the harmonics of one note, normal for a saw   | none, a sine shows only the bottom line      |
| a black bar across the whole height<br/><SoundCase sprite="spectrogram" index={3} alt="A line with a gap in the middle" />  | a gap: silence, or a part that dropped out    | check the arrangement for that bar           |
| a bright band at the very bottom<br/><SoundCase sprite="spectrogram" index={4} alt="A bright band along the bottom edge" /> | a sub bass or a kick; very strong means boom  | high pass the layers that should not have it |
| everything above about 16 kHz is black<br/><SoundCase sprite="spectrogram" index={5} alt="Noise with a black top" />        | the sample rate or a low pass cutting the top | normal for a 44.1 or 48 kHz render           |
| a smear of colour over every height<br/><SoundCase sprite="spectrogram" index={6} alt="Noise over the whole picture" />     | noise, a hat or a snare, or a distorted layer | lower the gain, or the noise layer           |
| two layers on the same bright band<br/><SoundCase sprite="spectrogram" index={7} alt="One thick line made of several" />    | they fight for the same pitch range           | move one an octave, or `.hpf` and `.lpf`     |

Compare the picture with the pattern: count the stripes in a bar against the kicks written, and
follow the bright line against the notes. A picture that matches the score is almost always a
correct sound; one that does not points at the line of code to read.

## Reading the report

`report.json` holds the same facts without the picture.

- `duration`: the length in seconds. At `setcpm(30)` one cycle is two seconds. A wrong length
  usually means `--once` was missed on a one shot, or a `fast` changed the cycle.
- `silenceRatio`: the share of the file under -60 dBFS. Near 1 means nothing played.
- `midi.tracks`: one per sound, named after it, with its note count. A drum kit is one track
  named `drums` on channel 9. A synth with no `note` has no pitch and no track notes.

## A loop for fixing one

1. Render the pattern with the expectations you know: `--min-peak 0.1 --max-clipped 0 --tracks drums,bass`.
2. Open the waveform. Fix a flat line, clipping or a swollen block first.
3. Open the spectrogram and match stripes and lines to the pattern. Change one layer at a time.
4. Render again, and keep the final images for the pull request body.

Nothing in this loop plays audio, so it is safe on headphones and in CI.
