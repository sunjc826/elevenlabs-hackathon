# Narrated incident post-mortem

A fictional production incident, presented in 10 slides and 28 narrated click states. The bundled narration runs for 3 minutes 53 seconds. Click **Play narrated review** once, then let each clip advance the deck. **Space** pauses/resumes without changing the slide; **arrow keys** navigate and select the matching narration. Manual navigation preserves the paused state. The final clip stops on the follow-ups slide, with Replay available. A single short anchor caption identifies the current visual. Full subtitles default off; **CC** toggles the transcript. Captions and subtitles stay synchronized while paused or navigating. The player shows both clip progress and elapsed/total review time.

## Run

Use Node.js 22.22+ and pnpm 11.22.0. This package owns a pnpm workspace and lockfile shared with `../packages/narrated-deck`. Keep both directories when copying the example. Last Train at the repository root remains independent.

```sh
cd incident-deck
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Slidev (port 3030). Bundled audio needs no credentials.

## Authoring

1. `world.md` fixes the fictional names and timezone.
2. `postmortem.md` contains the underlying incident narrative.
3. **Edit `manifest.yaml`**, the only content input to slide and audio generation. It references the four evidence files in `excerpts/`.
4. Run `pnpm generate` to regenerate `slides.md`, the player's `generated/manifest.json`, and `audit.md`. Never edit those generated files by hand.

Each step declares `caption` (under eight words), `target_seconds`, `visible_change` and `anchors`. Narration has no word cap; measured total runtime must stay below 240 seconds. Timeline targets are 4–6 seconds and evidence interpretations 15–20 seconds. `audit.md` records the visible change and narrated anchors for every state.

The first step is click state **0** (slide entry). A slide with N narration steps has N states and **N−1 `v-click` reveals**. Every later step uses an explicit click index, so there is no extra silent click before changing slides. Evidence uses three states: unhighlighted source, interpreted finding, then an updated packet-path miniature. The host source is a two-series replay chart, with raw counters collapsed beneath it. The timeline uses three aligned metric rows and one timestamped marker per step. Hypotheses and verdict share the same packet-path component.

## Audio generation

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python gen_audio.py                    # dry run, no requests
.venv/bin/python gen_audio.py --generate         # reuse the published clips
.venv/bin/python gen_audio.py --generate --run 2 # separate comparison batch
```

New synthesis needs `ELEVENLABS_API_KEY` in the private process environment. The script uses the manifest's voice/model/settings and submits once per missing step. Existing clips require matching provenance and hashes. An attempt ledger blocks ambiguous retries. Run 1 writes `public/audio/`; run 2 writes ignored `.cache/comparison/audio/`. Both produce public, credential-free measurement rows under `metrics/`. Subscription snapshots and request-attempt state remain in ignored `.cache/`.

The two initial baseline runs are complete; the current visual revision has one new measured run. `deck.audio_revision` separates its metrics from the baseline. For steps with `target_seconds`, FFmpeg applies pitch-preserving tempo adjustment once after synthesis; metrics record raw duration, tempo factor and final duration. Existing matching clips are reused without synthesis or re-encoding. Keep the private cache if continuing generation on another machine. To intentionally change narration, give the affected step a new clip path so that the previous generated clip remains available for comparison. Do not clear attempt markers to retry a timed-out paid request without investigation. No generation occurs during build or deployment.

## Shared library

The player, media clock, event metrics, path diagram, evidence panel, comparison chart, buffer animation and common manifest validation are imported from [`@hackathon/narrated-deck`](../packages/narrated-deck/README.md). `global-bottom.vue` only adapts Slidev navigation; `components/IncidentVisual.vue` supplies the fictional incident data and presentation choices. The [authoring skill](../.agents/skills/narrated-explanations/SKILL.md) describes how to apply these patterns to another subject.

## Animation clock

The player publishes `--clip-duration` from loaded media metadata and `--clip-delay` from negative media time every animation frame. SVG line drawing uses `stroke-dashoffset`, normalized path lengths, and those CSS variables. CSS animations are paused and sampled at the media position, so buffering, pause, seek and arrow navigation cannot let the picture run ahead of narration. Each segment ends exactly at its current marker when its clip ends. The ring animation reads the same CSS duration and media time; occupancy and drop count run once, reset on a new clip, and hold when paused. No visual duration is hardcoded in seconds.

## Verify and deploy

```sh
pnpm generate
pnpm test
pnpm typecheck
pnpm build                  # slidev build --base /elevenlabs-hackathon/
pnpm exec playwright install chromium
pnpm test:browser   # static-build media, navigation and layout checks
```

The workflow in `../.github/workflows/incident-pages.yml` builds this directory and publishes `dist/` through GitHub Pages. It runs on pushes to main and can also be dispatched manually. Pages uses **GitHub Actions** as its publishing source. This workflow is the only publisher; it deploys the built deck directly without a branch deployment or a legacy-publisher wait. The intended URL is https://sunjc826.github.io/elevenlabs-hackathon/ . The Cloudflare Last Train Worker is not part of this deployment.

`results.md` records duration, latency, response credit headers and the limitations of the listening comparison. Headless Chromium checks playback behavior and mobile controls; a physical-phone listening review remains a separate check. Portrait phones display a scaled 16:9 slide; rotate to landscape to inspect evidence text.

Implementation references: [Slidev global context](https://sli.dev/guide/global-context), [click animations](https://sli.dev/guide/animations), [static hosting](https://sli.dev/guide/hosting), [ElevenLabs text-to-speech API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert).

## Optional video export

```sh
.venv/bin/pip install -r requirements-export.txt
pnpm exec playwright install chromium
pnpm export:png
.venv/bin/python export_video.py
```

This optional **static-state** export uses Slidev’s `--with-clicks` PNG export and the same manifest clip order to produce `exports/incident-review.mp4` plus `exports/click-states.zip`. FFmpeg encodes H.264/AAC at 1920×1080 and 30 fps. Each segment pads only to the next video frame, so audio is never shortened to fit a slide. Generated export files stay out of Git. The live player controls are suppressed in print/export views.

Static export holds the completed click states; it does not capture the live line/ring animations. Any existing files in `exports/` predate this visual revision until explicitly regenerated. Use the live deck for synchronized animation.
