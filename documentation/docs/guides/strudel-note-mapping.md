---
sidebar_position: 31
---

# How Strudel notes are mapped to MIDI

A host app that charts a song, such as a rhythm game, asks the editor for the song's notes
instead of its sound. `renderStrudelCodeToNotes` evaluates the code, finds the cycles one play
takes, and returns a standard MIDI file plus the tempo. The same mapping writes the editor's MIDI
export. It lives in `packages/strudel-editor/src/editor/patternMidi.ts`.

```ts
import { renderStrudelCodeToNotes } from '@webgamekit/strudel-editor/helpers'

const { midi, cyclesPerSecond } = await renderStrudelCodeToNotes(songCode)
```

## From an event to a note

Strudel hands over events, each with an onset, a length and a set of control values. An event
becomes one MIDI note when it has a pitch or is a known drum sample. Anything else, such as a
vocal chop, has no note to write and is left out.

| Event has                                  | MIDI key                                  | Track          |
| ------------------------------------------ | ----------------------------------------- | -------------- |
| `note` or `freq`                           | Strudel's `valueToMidi`, rounded to a key | its sound name |
| `note` or `freq` and no sound name         | the same                                  | `notes`        |
| a drum sample in the table below, no pitch | the General MIDI percussion key           | `drums`        |
| neither                                    | none, the event is skipped                | none           |

| Sample | Key | Sample | Key | Sample | Key |
| ------ | --- | ------ | --- | ------ | --- |
| `bd`   | 36  | `lt`   | 41  | `cr`   | 49  |
| `rim`  | 37  | `hh`   | 42  | `rd`   | 51  |
| `sd`   | 38  | `mt`   | 45  | `cb`   | 56  |
| `cp`   | 39  | `oh`   | 46  | `sh`   | 70  |
|        |     | `ht`   | 48  |        |     |

## Timing

One cycle is one bar of four beats. A note's time is its onset minus the first exported cycle,
divided by the pattern's cycles per second, and its length is converted the same way. The file's
tempo is cycles per second times 60 times 4, so a song at `setcpm(120 / 4)` writes 120 beats per
minute. A song that sets no tempo starts from the engine's default of 0.5 cycles per second.

`renderStrudelCodeToNotes` renders from cycle 0 to the number of cycles the whole song takes to
repeat, found by reading its opening events, and falls back to 64 cycles when it never repeats.

## Velocity, tracks and channels

- Velocity is the event's `velocity` (0.8 when absent) times its `gain` (1 when absent), kept
  between 0 and 1.
- Each sound gets its own track, named after it.
- Drums go on MIDI channel 10, which is index 9 in the file. Pitched tracks take the other
  fifteen channels in turn and wrap around after that.

## Playing and charting together

`playStrudelSong` starts the same code playing live and returns `readPosition`, which gives the
current cycle and cycles per second, and `stop`. A game keeps time by converting the position to
seconds and comparing it with the note times in the file. Song jobs run one after another, because
Strudel renders swap the single audio context the engine plays on.
