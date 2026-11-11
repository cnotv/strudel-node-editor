# Strudel Node Editor

The Strudel live-coding music editor served at strudel.cnotv.xyz: a code editor, a node
editor for instruments and effects (`packages/strudel-flow`), a timeline, transcription and
WAV or MIDI export, in `src/views/Tools/StrudelEditor/`. A Netlify function
(`netlify/functions/strudel-render.ts`) renders a pattern to WAV or MIDI by driving the
editor in a headless browser. It was cut out of
[cnotv/generative-art](https://github.com/cnotv/generative-art).

This file holds the rules that apply to every change. Rules for one area load from
`.claude/rules/`, procedures from agent-base's `workflow` plugin and `.claude/skills/` — all
indexed below.

## How work starts

Every request opens an issue, a branch and a draft pull request, in that order, before any
code. There is no plan-first step and nothing to wait for: the issue says what and why in a
few lines, and the decisions land in the pull request body as they are made.

1. **The issue.** One that already exists is read, comments included; otherwise it is written
   from the request. If intent, scope or expected behaviour is unclear, ask one focused
   question covering everything missing, wait, and write it from the answer.
2. **The branch**, off main, named `<type>/<issue-number>-<description>`. A fresh branch every
   time, never the current one, never reused.
3. **The draft pull request**, opened at the first commit rather than the last, carrying
   `Closes #<issue-number>` and kept current as the work moves.

`start-issue` covers the first two steps and `open-pr` the third; neither is optional and their
steps are not reorderable. Tests come first, except for an exploratory prototype, which still
owes them before the pull request is marked ready.

## Working agreements

- **Ask before assuming.** If intent, scope or expected behaviour is unclear, ask one focused
  question covering everything missing, and wait. This applies especially to bug reports with
  no reproduction, ambiguous acceptance criteria, and anything solvable several ways with
  different trade-offs.
- **Give an opinion.** When asked what you think, or whether X beats Y, say what you would do
  and why. Never stop at "it depends".
- **Write it once, at the length it earns.** A one-line fix gets one line; a surprising
  constraint gets a paragraph. Prose that repeats the diff or restates something already
  written above is noise that hides what matters. Each kind of writing has one home, below.
- **Never modify `eslint.config.js`** unless explicitly asked. Fix violations by changing the
  code, not by loosening the rule.
- **Never use `eslint-disable`**, in any form, and never `--no-verify`. If a hook or a rule
  fails, it is usually right.
- **No emoji** anywhere — code, comments, UI text, commit messages, documentation, output —
  unless explicitly requested. Use SVG icons or text.
- **Prefer `debugger` over `console.log`.** When a fix has failed twice and the bug persists,
  add logging at the relevant paths to see the real runtime values before trying again.

## Code

- **TypeScript only.** No plain JavaScript. No `any` — use a specific type, a generic, or
  `unknown` with narrowing. Never `as SomeType` on unvalidated external data.
- **Functional style.** No classes. No `for` / `while` loops — use `map`, `filter`, `reduce`,
  `flatMap`, `Array.from`. Prefer pure functions and `const`; return new values rather than
  mutating. Keep state in closures, tuples or plain objects.
- **Long descriptive names.** `elementCount`, not `count`. `randomGenerator`, not `rng`.
- **Split large functions** into small, single-purpose ones with names that say what they do.
- **Exported types live in a types module** — a `types.ts` or `types/` folder containing only
  type declarations, never alongside logic. A component's own local `interface Props` is exempt.
- **Config files hold data, never logic.** A `config.ts` or `src/config/**` is a flat list of
  literal values: no functions, no `map` building entries, no branching, nothing derived from
  another value. Whatever has to be worked out, the module that uses it works out.
- **Update every call site.** When a signature, type or export changes, `grep` the whole repo
  and fix all consumers in the same change. Never add an overload, a shim or a deprecated
  alias to keep old callers working. Fix it properly rather than layering a workaround.
- **Comments explain why, never what.** If code needs a comment to say what it does, rewrite
  the code. No commented-out debug notes, no "was X, now Y", no section labels.
- **Spell out a domain acronym on first use**, e.g. `ccd` (continuous collision detection).
- **DRY and KISS.** If a pattern appears twice, extract it. Prefer the simplest thing that
  works over an abstraction you might need later.
- **Reuse before writing.** Check `src/components/` (the `ui/` primitives and shared root
  components), `src/utils/` and `packages/strudel-flow` first. Verify a dependency is
  actively maintained before adding it.
- **No pointless wrappers.** Before adding a `<div>` or `<section>`, ask what layout,
  semantics or behaviour it adds that the parent cannot. If none, drop it.

## Git

- Branches are always `<type>/<issue-number>-<description>` (`feat`, `fix`, `docs`,
  `refactor`, `test`, `chore`), so the number is on the branch from its first commit.
- **Rebase, never merge.** `git fetch origin main && git rebase origin/main`. Never `git pull`,
  which merges by default. After a rebase, `git push --force-with-lease`, never `--force`.
- **Commit subjects never reference an issue number**, in subject or body, no exception:
  write `<type>: <summary>`. The PR carries it, linked by GitHub: its title ends with it,
  `<type>: <summary> (#<issue-number>)`, and its body starts `Closes #<issue-number>`.

## Where output goes

Documentation stays in generative-art's Docusaurus site
(`cnotv/generative-art`, `documentation/docs/`); this repository has none of its own. A
finding about the editor goes there as a journey doc, and a constraint that will bite the
next person here goes in the matching `.claude/rules/` file. A PR body links to those homes.

## Project facts

- **Dev server:** `pnpm dev --port 5317 --strictPort`, served at `http://localhost:5317`
- **Routes:** `/` only, addressed by query (`?tab=`, `?pattern=`, `?mode=`); every other path redirects to `/` and keeps its query
- **Checks:** `pnpm lint`, `pnpm lint:css`, `pnpm test:unit`, `pnpm type-check:netlify`, `pnpm build`; **Security:** `pnpm audit --prod`, no threat model
- **Dead code:** `npx knip` (entry points in `knip.json`); tests are outside its project, so check a dependency against the tests before removing it
- **Render export:** `node scripts/strudel-export.mjs --url <site>` drives `/?tab=export`
- **Deploy:** a push to `main` builds `ghcr.io/cnotv/strudel-node-editor` and runs it on the Hetzner host, port 3004; the render function deploys on Netlify
- **Errors:** Sentry, from the `VITE_SENTRY_DSN` secret; no analytics
- **PR media:** `media-capture` screenshot and one GIF of `/`, in the body before ready
- **Scoped rules and local skills:** `.claude/rules/` and `.claude/skills/`, indexed below

### Done checklist

- [ ] A change to a node or instrument has a test in `packages/strudel-flow` or `src/views/Tools/StrudelEditor`
- [ ] A sound change was checked muted, never through the speakers
- [ ] Every artifact the issue named exists, not just the ones forced by a deletion

## Scoped rules

Each file in `.claude/rules/` declares a `paths:` glob and loads only when a matching file is touched. Read one directly if you are working in its area without opening a matching file.

| File in `.claude/rules/` | Covers                                                             |
| ------------------------ | ------------------------------------------------------------------ |
| `vue-components.md`      | anything in `src/components/` or `src/views/`, or a stylesheet     |
| `music.md`               | a Strudel style, song, or music pattern                            |
| `tests.md`               | any `*.test.ts`                                                    |
| `colour.md`              | choosing any colour — a material, a background, a token, a diagram |

## Procedures

`.claude/settings.json` installs the workflow skills (`start`, `start-issue`, `open-pr`, `verify`,
`finish-change`, `journey-doc`, `security-audit`) from agent-base in every session, local or cloud.
Never copy them into `.claude/skills/`, which holds only this repository's own skills:

| Skill           | Use when                                                        |
| --------------- | --------------------------------------------------------------- |
| `strudel-sound` | asked for music or a sound, or to save a pattern as WAV or MIDI |
| `sound-design`  | deciding what a sound is made of, editing audio, or teaching it |
