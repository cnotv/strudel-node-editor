# @webgamekit/strudel-editor

The Strudel live-coding editor as a Vue 3 component: code editor, node editor, timeline,
transcription and WAV or MIDI export.

```bash
pnpm add @webgamekit/strudel-editor vue vue-router pinia
```

```ts
import '@webgamekit/strudel-editor/tokens.css'
import '@webgamekit/strudel-editor/style.css'
import { StrudelEditor } from '@webgamekit/strudel-editor'
```

Small helpers (`useStrudelSounds`, `readStrudelNoteBars`, `readStrudelAddress`, `writeStrudelAddress`,
`STRUDEL_SAVED_CODE_STORAGE_KEY`) come from `@webgamekit/strudel-editor/helpers`, so a host can import
them without loading the editor itself.

The host app needs Vue Router and Pinia installed. Sizing, slots, the exported helpers and what
the editor fetches and stores are in the
[embedding guide](https://cnotv.github.io/strudel-node-editor/guides/embedding-the-strudel-editor).

## Peer dependencies

`vue` (`^3.4.21`), `pinia` (`^2.3.0`) and `vue-router` (`^4.3.0`) are peer dependencies and are not
bundled. Install them in the host app and make sure the lockfile resolves a single copy of `vue` and
`pinia` (`pnpm why pinia`); a second copy gives the package a different Pinia from the app's.

The built-in instrument presets (`garagekit`, `grungebass`, `seattle` and the rest) are rendered
when code names them, in the editor and in `loadDefaultStrudelPlayback`, `playStrudelSong`,
`renderStrudelCodeToNotes` and the WAV and MIDI renders. A host does not have to prepare them. They
use the app's active Pinia, or one the package creates when there is none. A preset that cannot be
rendered rejects the call with an error naming it, for example
`Instrument presets could not be rendered: "garagekit" (reason)`, and the editor logs it in its
console tab.

Licensed AGPL-3.0-or-later, like the Strudel engine it wraps.
