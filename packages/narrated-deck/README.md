# Narrated deck library

`@hackathon/narrated-deck` is a local, source-based Vue 3.5 library for audio-led visual explanations. It contains no incident content, TTS provider, credentials, routing or deployment logic. The incident deck is one consumer; `examples/basic/` is an unrelated, standalone Vue consumer.

The package is private and has not been published to npm. It exports TypeScript and Vue single-file components for a Vue-capable bundler such as Vite. Its framework-free `core` and `manifest` entry points run directly in Node. No package build is needed to consume the source.

## Run in this repository

The library belongs to the `incident-deck/pnpm-workspace.yaml` workspace. The original Last Train package remains independent.

```sh
# From repository root:
pnpm --dir incident-deck install --frozen-lockfile
pnpm --dir packages/narrated-deck test
pnpm --dir packages/narrated-deck typecheck
pnpm --dir packages/narrated-deck build        # build the standalone example
pnpm --dir packages/narrated-deck dev          # http://127.0.0.1:4181
pnpm --dir packages/narrated-deck test:browser
```

The example uses eight generated **silent WAV timing fixtures**, not synthesized speech. It tests the transport without credentials or paid calls. Replace those clips with actual narration for a real review. For browser tests, install Chromium first if needed: `pnpm --dir incident-deck exec playwright install chromium`.

For another project in the workspace, depend on `"@hackathon/narrated-deck": "workspace:*"`. Outside the workspace, a local `file:` dependency can point to this package; the consumer must supply Vue 3.5 and compile `.vue`/`.ts` imports. Keep one Vue runtime in the application.

## Player and clock

```vue
<script setup lang="ts">
import {ref} from 'vue'
import {NarrationPlayer,createPlaybackClock,BufferComparison} from '@hackathon/narrated-deck'
import '@hackathon/narrated-deck/style.css'
import manifest from './generated/manifest.json'
const page=ref(1), click=ref(0)
const clock=createPlaybackClock()
// next(), previous() and restart() update page/click in your router or state.
</script>

<template>
  <BufferComparison :buffers="[{capacity:40,label:'Small'},{capacity:160,label:'Large'}]"
    :peak-arrivals="120" :progress="clock.progress" note="Schematic occupancy" />
  <NarrationPlayer :manifest="manifest" :page="page" :click="click" :clock="clock"
    base-url="/review/" @next="next" @previous="previous" @restart="restart" />
</template>
```

`page` is one-based; `click` is zero-based. The host owns navigation. The player emits `next`, `previous`, and `restart`; a next event should advance a click before advancing a page. The complete working functions are in [the standalone example](examples/basic/App.vue). For Slidev, use [the thin global-layer adapter](../../incident-deck/global-bottom.vue).

The player handles the gesture gate, matching clip playback, real `ended` events, final stop/replay, Space, arrow keys, anchor captions, optional full subtitles and clip/review progress. Manual navigation preserves pause state. Full subtitles default off and can be configured with `subtitles-default`. Intro text is configurable through `intro-label`, `description`, and `help`.

Pass one `createPlaybackClock()` instance to the player and the visuals it drives. The player publishes `--clip-duration` and `--clip-delay` on the document root, or on an explicit `clock-target` element containing the visuals. The clock's `progress` is normalized using that same CSS duration. One active keyboard-owning player per page is supported. Unmounting the player removes its listeners and animation frame.

CSS line animations use a negative media-time delay and stay paused, sampling the audio position every frame. Buffering and pause therefore freeze the picture; seek, replay and navigation update it deterministically. `EventMetrics` uses `stroke-dashoffset`; `BufferComparison` uses the same normalized clock for occupancy and counters. No animation duration is fixed in seconds.

The `finished` slot appears only after the last clip. Put optional evidence exploration there; see the standalone example. Keyboard events inside that exploration slot are left to its controls, so Space on an evidence button cannot accidentally replay the review. The exposed `pause()` method can pause narration before opening supplementary material elsewhere. No library visual requires a click or hover to understand it.

## Visual components

| Component | Inputs | Behavior |
|---|---|---|
| `EventMetrics` | `rows`, `events`, `index`, numeric `domain`, labeled `ticks`, optional `context`/`note`/`revision` | Any number of line/state-band rows share one axis. The active marker appears immediately; normalized paths draw to it over the clip. Supply sorted points/events and increasing domains. `static` renders the completed state. |
| `PathDiagram` | `nodes: {id,label,detail?}[]`, `states`, `focus`, optional `miniature` | Stable horizontal geography with neutral, pending, excluded or confirmed nodes. Marks and text accompany color. Supports different node counts; intended for a small linear path, not a general graph layout engine. |
| `EvidencePanel` | `source`, `lines`, one-based `highlightLine`, `phase` | `orient` shows context; `interpret` highlights; `standing` retains the finding and reveals the named `standing` slot. The `evidence` slot can replace raw text with a chart. Text is escaped, never interpreted as HTML. |
| `ComparisonChart` | Two `series`, `domain`, labeled `ticks`, `label`, optional `finding` and `highlighted` | Overlaid traces with shared scales; gray orientation state, colored interpretation state. Each series can be dashed. Negative values and nonzero time origins are supported. |
| `BufferComparison` | `buffers: {capacity,label,color?}[]`, `peakArrivals`, `progress`, optional note/units | Applies one schematic arrival burst and drain to the supplied capacities. Counts losses independently for each buffer. `fillUntil`/`drainUntil` are fractions of the clip, not seconds. |

See [types.ts](src/types.ts) for exact prop data shapes. The optional dark stylesheet covers the components and player; it does not own Slidev dimensions, body backgrounds or cover branding. A consumer can override classes or provide its own styles. SVGs use normalized coordinates; inspect labels and evidence legibility at the target viewport. Portrait playback controls fitting on screen does not make dense slide text mobile-readable.

## Manifest and audit

The common content contract is `deck.title`, `slides[].id`, and `steps[]` containing `clip`, `say`, `caption`, and a measured `duration_seconds`. Keep visual-specific data alongside the steps in the same manifest; the library preserves extra fields.

```js
import {prepareManifest,renderAudit} from '@hackathon/narrated-deck/manifest'
const compiled = prepareManifest(parsedYaml, {
  durations: measuredClips, // [{clip, duration_seconds}]
  requireMeasured: true,   // fail a release build if timing is missing
  readExcerpt: relativePath => readLocalText(relativePath),
})
writeJson(compiled)
writeAudit(renderAudit(compiled))
```

`prepareManifest` returns a copy, validates unique IDs/clips and safe relative paths, resolves excerpts, attaches measured durations, and enforces a configured `deck.runtime_cap_seconds`. Preview can use `target_seconds` as an estimate when measured durations are absent. Defaults require a short caption of at most seven words plus `visible_change` and spoken `anchors`; `captionWords` and `requireAudit` are configurable. There is no narration word cap or universal runtime cap.

An audit anchor is a phrase present in the narration. This catches stale metadata, not whether the visual is correct or the explanation is good. Review rendered beats and the semantic relationship manually. The current example additionally checks hashes/provenance of its bundled audio, evidence structure and its own pacing targets.

The package neither synthesizes nor retimes audio. [gen_audio.py](../../incident-deck/gen_audio.py) remains the example's ElevenLabs adapter with its paid-request ledger and measured-duration output. A different provider can supply the same clips and measurements. Builds must not silently synthesize missing audio.

## Verification boundaries

Core tests cover duration budgets, audit failures, path validation, progress, step-series slicing and alternate buffer capacities. The standalone browser test exercises all six components, pause/seek/replay and post-review exploration without Slidev or a TTS service. The incident deck's browser suite covers all 28 real narration states.

Static Slidev exports show completed click states. They are not recordings of the live animation. Subjective listening quality and physical-phone readability require their own review.
