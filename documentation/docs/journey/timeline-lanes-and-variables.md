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

Ctrl or Cmd plus click on a variable jumps to the name in its `const`, `let` or `var`, as go to
definition does in VS Code. It works on the text (`findVariableDefinition`), so it needs nothing
from Strudel's runtime. A click on the declaration itself, or on a word that is not declared,
does nothing.

## If this moves to VS Code

VS Code already does this, and adds find references on top, so moving the editing there would
retire `findVariableDefinition`. It would also give up the in-browser editor, the inline widgets
and the playhead highlight, which is why the editor keeps its own lookup. If the project ever
switches, that one function is the part to drop.
