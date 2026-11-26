---
sidebar_position: 140
---

# Timeline lanes and the variables behind them

A lane on the timeline is one layer of the song: the events that share a sound and the code they
came from. Two layers that play the same sound (several stacks using `sawtooth`) are separate
lanes, numbered `sawtooth`, `sawtooth 2`, so each one selects its own code and none hides another.

## Why the code a lane selects can be shared

Strudel records, on every event, the spans of mini-notation strings that built it. A variable used
in two places (`stab` in both `psy` and `mix`) leaves the same spans in both, and the place it was
used leaves none: a name in a `stack(...)` is not a string, so no event points at it. Clicking a
lane can therefore only select the definition.

## Ctrl+click on a variable

The reverse direction is cheap, because it starts from the code. Ctrl or Cmd plus click on a
variable finds its `const` statement and every variable that statement uses, then marks the lanes
whose spans fall inside them (`findVariableLanes`). It works on the text, so it needs nothing
from Strudel's runtime.

## If this moves to VS Code

The same job in VS Code is a go to definition and find references pair, and a variable's lanes
would come from a language server or an extension that reads the same event spans. That trades the
in-browser editor for a second product to maintain, so the editor keeps the text based lookup. If
the project ever switches, `findVariableLanes` is the one function to replace, and the lane
marking in `StrudelTimeline.vue` stays as it is.
