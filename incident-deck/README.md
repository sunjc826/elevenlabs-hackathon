# Narrated incident post-mortem

A fictional production incident, presented in 10 slides and 21 narrated click states. The bundled narration runs for 3 minutes 46 seconds. Click **Play narrated review** once, then let each clip advance the deck. **Space** pauses/resumes without changing the slide; **arrow keys** navigate and select the matching narration. Manual navigation preserves the paused state. The final clip stops on the follow-ups slide, with Replay available. Subtitles are on by default and display the current clip’s narration directly from the manifest. Use **CC** to hide or show them. They remain visible while paused and follow arrow-key navigation.

## Run

Use Node.js 22.22+ and pnpm 11.22.0. This package has its own dependency lockfile; Last Train at the repository root is unchanged.

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
4. Run `pnpm generate` to regenerate `slides.md` and the player's `generated/manifest.json`. Never edit either generated file by hand.

The first step is click state **0** (slide entry). A slide with N narration steps has N states and **N−1 `v-click` reveals**. Every later step uses an explicit click index, so there is no extra silent click before changing slides. Custom layouts keep log excerpts visible and highlight exactly the recorded line.

## Audio generation

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python gen_audio.py                    # dry run, no requests
.venv/bin/python gen_audio.py --generate         # reuse the published clips
.venv/bin/python gen_audio.py --generate --run 2 # separate comparison batch
```

New synthesis needs `ELEVENLABS_API_KEY` in the private process environment. The script uses the manifest's voice/model/settings and submits once per missing step. Existing clips require matching provenance and hashes. An attempt ledger blocks ambiguous retries. Run 1 writes `public/audio/`; run 2 writes ignored `.cache/comparison/audio/`. Both produce public, credential-free measurement rows under `metrics/`. Subscription snapshots and request-attempt state remain in ignored `.cache/`.

The two initial runs are already complete. Keep the private cache if continuing generation on another machine. To intentionally change narration, give the affected step a new clip path so that the previous generated clip remains available for comparison. Do not clear attempt markers to retry a timed-out paid request without investigation. No generation occurs during build or deployment.

## Verify and deploy

```sh
pnpm generate
pnpm test
pnpm typecheck
pnpm build                  # slidev build --base /elevenlabs-hackathon/
pnpm exec playwright install chromium
pnpm test:browser   # static-build media, navigation and layout checks
```

The workflow in `../.github/workflows/incident-pages.yml` builds this directory and publishes `dist/` through GitHub Pages. It runs on pushes to main and can also be dispatched manually. Before publishing, it waits for any legacy branch publisher for the same commit to finish, preventing that publisher from overwriting the built deck. **GitHub Actions** is the preferred Pages source; selecting it removes that redundant legacy build. The intended URL is https://sunjc826.github.io/elevenlabs-hackathon/ . The Cloudflare Last Train Worker is not part of this deployment.

`results.md` records duration, latency, response credit headers and the limitations of the listening comparison. Headless Chromium checks playback behavior and mobile controls; a physical-phone listening review remains a separate check. Portrait phones display a scaled 16:9 slide; rotate to landscape to inspect evidence text.

Implementation references: [Slidev global context](https://sli.dev/guide/global-context), [click animations](https://sli.dev/guide/animations), [static hosting](https://sli.dev/guide/hosting), [ElevenLabs text-to-speech API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert).

## Optional video export

```sh
.venv/bin/pip install -r requirements-export.txt
pnpm exec playwright install chromium
pnpm export:png
.venv/bin/python export_video.py
```

This uses Slidev’s `--with-clicks` PNG export and the same manifest clip order to produce `exports/incident-review.mp4` plus `exports/click-states.zip`. FFmpeg encodes H.264/AAC at 1920×1080 and 30 fps. Each segment pads only to the next video frame, so audio is never shortened to fit a slide. Generated export files stay out of Git. The live player controls are suppressed in print/export views.
