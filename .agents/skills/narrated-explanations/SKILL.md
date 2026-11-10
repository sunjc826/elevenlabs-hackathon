---
name: narrated-explanations
description: Create or refine narrated visual reviews that play automatically, with audio-synchronized charts, evidence reveals, diagrams, and optional exploration. Use for audio-led decks and explainers; ordinary live-presenter slides do not require this workflow.
---

# Narrated explanations

Build a complete explanation someone can follow without clicking. Treat each narrated beat as one visual anchor, one explanation, and a visible change. A slide may contain several beats; it is not the unit of timing.

## Choose the experience

Use autoplay for a guided explanation. Put optional investigation after the review, or pause narration when the viewer opens it. Playback controls, captions and seeking are compatible with autoplay; essential hover states, expandable evidence and choices competing with narration are not. Preserve an explicitly requested exploratory mode rather than forcing every project into autoplay.

Keep the user's subject, names, evidence and visual identity. `incident-deck/` is a worked example, not a template for the next project's story or product direction. Its four-minute cap, clip durations, caption limit and three candidate loss points are project choices, not universal limits.

## Compose beats

- Let visuals provide evidence and narration explain its meaning. Point to a line, region, trace or node rather than reading its contents aloud.
- Signal the active anchor as the clip starts. Keep retained context quiet. “Every visual is explained” means substantive claims and active findings, not reading axis ticks and log filler.
- Give each beat a short anchor caption; keep full subtitles available separately. Use the audience's accessibility requirements to choose the default.
- Select motion for the reasoning it performs. Draw for chronology, highlight for attention, compare for causality. Hold still when the viewer needs time to inspect evidence.
- Preserve diagram geography across hypotheses, evidence and conclusions. Make confidence explicit and no stronger than the evidence.

Read [patterns.md](references/patterns.md) when choosing or adapting a visual pattern. Avoid packing every pattern into one review.

## Implement and pace

For Vue/Slidev projects in this repository, read the [library README](../../../packages/narrated-deck/README.md). Reuse its player, clock and visual components through data props. Other rendering environments can reuse the principles without adopting Vue.

Keep content and narration in one manifest. Generated slides, captions and audits derive from it. Provider-generated audio and measured durations are outputs, not new editorial sources. Keep synthesis behind an explicit generation command; builds reuse existing clips. Do not make paid calls or publish merely because this skill was invoked.

Estimate duration from the visual task, synthesize only when authorized, then measure the clips and check the requested total budget. Do not use a word cap as a timing guarantee. If adjusting speech rate, record both raw and final durations and check intelligibility.

Drive animation from media time. Normalize phase against the player's duration; use the same clock for CSS drawing and numeric counters. Pause, buffering, seek, replay and manual navigation must leave picture and audio aligned. Use completed states for static exports, and distinguish them from recordings of live animation.

## Review and handoff

Read [review.md](references/review.md) for the focused validation checklist. Check the rendered content as well as the code. A matching transcript substring does not prove that the animation points to the right thing.

Deliver the requested artifacts and their location. Report any unavailable checks, unmeasured timing or static-export limitations that affect use. Keep credentials, paid-request receipts and caches out of committed artifacts.
