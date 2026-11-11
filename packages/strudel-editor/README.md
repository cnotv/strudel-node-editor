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

The host app needs Vue Router and Pinia installed. Sizing, slots, the exported helpers and what
the editor fetches and stores are in the
[embedding guide](https://cnotv.github.io/generative-art/docs/docs/guides/embedding-the-strudel-editor).

Licensed AGPL-3.0-or-later, like the Strudel engine it wraps.
