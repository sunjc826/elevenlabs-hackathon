# Results

Measured on 2026-11-10 with ElevenLabs `eleven_multilingual_v2`, voice `JBFqnCBsd6RMkjVDRZzb`, stability 0.55, similarity boost 0.75 and speed 1.0. Both runs use the same unmodified manifest: 21 clips, 3,799 characters. Run 1 is the published audio. Run 2 is an independently synthesized comparison pack, retained in the ignored local cache. No seed was set.

| Dimension | Observation |
|---|---|
| Jargon: host names, feed names, acronyms | The narration uses the fictional firm and timezone names, Mira, A/B channel, multicast and receive-ring terminology. Literal host IDs, the feed name and NIC acronym remain on screen rather than being read out. Their spoken pronunciation is therefore **not tested** by this manifest. Auditory pronunciation quality has not been rated by a human. |
| Numbers: timestamps, sequence numbers, durations | Timeline narration selects one meaningful time reference per step: 08:42 local, then elapsed 18 minutes, approximately a quarter-second, another quarter-second and about 3 minutes. Absolute timestamps always appear in the slide content. Sequence numbers remain in the highlighted handler excerpt and are interpreted rather than spoken. Number pronunciation has not been rated by listening. |
| Tone: does confirmed vs hedged sound different | The initial hypotheses explicitly say “could not be excluded”; final verdicts explicitly say “ruled out” or “confirmed.” The same voice settings are used throughout. Wording and audio/state alignment are checked; whether the voice makes confidence audibly distinct remains **unrated**, not inferred from the transcript. |
| Length stability: seconds per 1000 characters, two runs | Run 1: **59.451 s/1,000 characters**, 225.855 s total. Run 2: **59.417 s/1,000**, 225.726 s total. Mean absolute per-clip duration difference 0.250 s, maximum 0.888 s. Two runs characterize this sample only. |
| Latency and cost per clip | Full-response latency in run 1: median 0.746 s, range 0.603–1.066 s. Run 2 median 0.742 s. Response `character-cost` headers sum to **1,427 credits per run**, **2,854 total**. Detailed per-clip rows follow. This is full MP3 download latency, not time to first byte. No dollar cost is inferred. |

The subscription meter changed by 0 credits during run 1 and 1,695 during run 2, so it did not reconcile with request-header totals during these short observation windows. These snapshots cannot establish settlement timing or an exact invoice. Account totals and raw request state stay in the private cache.

## Per-clip measurements

Characters count the exact `say` string sent to the provider. Duration comes from the resulting MP3 frames. The rate above is total seconds divided by total characters, not an unweighted mean of clip rates.

| Clip | Characters | Run 1 seconds | Run 2 seconds | Run 1 latency (s) | Run 2 latency (s) | Credits/run 1 | Credits/run 2 |
|---|---:|---:|---:|---:|---:|---:|---:|
| title-0 | 181 | 10.632 | 10.815 | 1.066 | 0.685 | 68 | 68 |
| timeline-0 | 184 | 10.684 | 10.710 | 0.811 | 0.727 | 69 | 69 |
| timeline-1 | 183 | 10.266 | 10.449 | 0.816 | 0.689 | 69 | 69 |
| timeline-2 | 164 | 9.326 | 9.378 | 0.711 | 0.687 | 62 | 62 |
| timeline-3 | 193 | 11.233 | 11.285 | 0.825 | 0.743 | 72 | 72 |
| timeline-4 | 162 | 9.979 | 9.509 | 0.688 | 0.652 | 61 | 61 |
| hypotheses-0 | 173 | 10.109 | 10.214 | 0.726 | 0.699 | 65 | 65 |
| hypotheses-1 | 148 | 8.490 | 8.124 | 0.603 | 0.689 | 55 | 55 |
| hypotheses-2 | 160 | 9.430 | 9.326 | 0.656 | 0.735 | 60 | 60 |
| evidence-handler-log-0 | 205 | 12.434 | 12.121 | 0.884 | 0.742 | 77 | 77 |
| evidence-exchange-0 | 207 | 12.147 | 13.035 | 0.916 | 0.802 | 78 | 78 |
| evidence-switch-0 | 194 | 11.546 | 11.468 | 0.746 | 0.788 | 73 | 73 |
| evidence-host-0 | 197 | 11.546 | 12.147 | 0.752 | 0.794 | 74 | 74 |
| verdict-0 | 164 | 10.162 | 9.927 | 0.702 | 0.940 | 62 | 62 |
| verdict-1 | 186 | 10.998 | 10.710 | 0.754 | 0.723 | 70 | 70 |
| verdict-2 | 164 | 9.848 | 9.744 | 0.686 | 0.715 | 62 | 62 |
| root-cause-0 | 211 | 12.356 | 12.487 | 0.770 | 0.838 | 79 | 79 |
| root-cause-1 | 180 | 11.285 | 10.710 | 0.703 | 0.794 | 68 | 68 |
| follow-ups-0 | 185 | 11.938 | 11.833 | 0.799 | 0.808 | 69 | 69 |
| follow-ups-1 | 186 | 11.102 | 11.050 | 0.714 | 0.826 | 70 | 70 |
| follow-ups-2 | 172 | 10.344 | 10.684 | 0.691 | 0.796 | 64 | 64 |

## Verification and deployment

- 3 content/audio-integrity tests, strict Vue/TypeScript checking and the static build pass.
- 4 headless Chromium integration tests pass: gesture gate, precise Space pause/resume, arrow navigation and resynchronization, every real media-ended transition, final stop/replay, all 21 click-state screenshots and bounds, and mobile tap controls.
- The generator was rerun with the published pack: all 21 clips reused, zero synthesis requests.
- The preserved Last Train demo also passes its original 5 tests, typecheck and build.
- First GitHub Pages deployment succeeded: [workflow run](https://github.com/sunjc826/elevenlabs-hackathon/actions/runs/42810034163), [live deck](https://sunjc826.github.io/elevenlabs-hackathon/).
- Subjective listening evaluation and physical-phone playback are not claimed. The native browser was unavailable because the Mac was locked; automated Chromium tests used an isolated headless process.

For another provider, preserve `manifest.yaml`, send the same `say` strings, keep the same per-step file mapping, and record a new metrics file with provider/model/settings, duration, latency and billed units. Do not substitute a cached replay for a second synthesis run.

## Optional export

`slidev export --format png --with-clicks` produced all 21 click-state PNGs. The exported views hide the interactive player overlay. `export_video.py` combined them with the published narration into `exports/incident-review.mp4` and packaged the PNGs in `exports/click-states.zip`.

The MP4 is 1920×1080, H.264/AAC, 30 fps, 226.19 seconds and approximately 6.33 MB. Full audio/video decoding completed with no errors. Its small difference from the MP3-duration sum comes from padding each segment to a video frame and container timing. The export script and dependency instructions are committed; generated media remains outside Git.

## Hosting note

The repository initially had a legacy branch-based Pages publisher, so the deck workflow waited for that publisher before deploying. On 2026-11-10 the owner switched the Pages publishing source to **GitHub Actions**. The legacy wait and its Actions-read permission have been removed; the deck workflow now publishes its build directly.
