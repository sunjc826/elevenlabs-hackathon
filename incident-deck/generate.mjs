// Generated slides and player data. Content comes only from manifest.yaml and its excerpts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
export const root = path.dirname(fileURLToPath(import.meta.url));
export function loadManifest() {
  const manifest = parse(fs.readFileSync(path.join(root, 'manifest.yaml'), 'utf8'));
  const metricsPath = path.join(root, 'metrics', `${manifest.deck.audio_revision}-run-1.json`);
  const metrics = fs.existsSync(metricsPath) ? JSON.parse(fs.readFileSync(metricsPath, 'utf8')).clips : [];
  const ids = new Set(), clips = new Set();
  let target = 0;
  for (const slide of manifest.slides) {
    if (ids.has(slide.id) || !slide.steps?.length) throw new Error('Invalid slide: ' + slide.id);
    ids.add(slide.id);
    for (const step of slide.steps) {
      if (!step.say?.trim() || !step.caption || step.caption.trim().split(/\s+/).length >= 8)
        throw new Error('Missing narration or caption must be under 8 words: ' + step.clip);
      if (!step.visible_change || !step.anchors?.length) throw new Error('Missing visual/audio audit: ' + step.clip);
      if (step.anchors.some(anchor => !step.say.toLowerCase().includes(anchor.toLowerCase()))) throw new Error('An audited anchor is not spoken: ' + step.clip);
      if (clips.has(step.clip) || !/^audio\/[a-z0-9-]+\.mp3$/.test(step.clip)) throw new Error('Invalid clip: ' + step.clip);
      clips.add(step.clip);
      target += step.target_seconds;
      step.duration_seconds = metrics.find(row => row.clip === step.clip)?.duration_seconds ?? step.target_seconds;
    }
    if (slide.excerpt) {
      slide.lines = fs.readFileSync(path.join(root, slide.excerpt), 'utf8').trimEnd().split('\n');
      if (slide.lines.length < 10 || slide.lines.length > 20 || slide.highlight_line < 1 || slide.highlight_line > slide.lines.length)
        throw new Error('Invalid evidence: ' + slide.id);
    }
  }
  if (target > manifest.deck.runtime_cap_seconds) throw new Error('Planned runtime exceeds cap');
  manifest.deck.total_seconds = manifest.slides.flatMap(s => s.steps).reduce((n,s) => n + s.duration_seconds, 0);
  if (manifest.deck.total_seconds > manifest.deck.runtime_cap_seconds) throw new Error('Measured runtime exceeds cap');
  return manifest;
}
export function render(manifest) {
  return manifest.slides.map((slide, page) => {
    const front = page === 0 ? `theme: default\ntitle: ${JSON.stringify(manifest.deck.title)}\ninfo: Fictional narrated incident review\ncolorSchema: dark\naspectRatio: 16/9\ncanvasWidth: 1280\ntransition: none\ndrawings:\n  enabled: false\nfonts:\n  sans: Inter\n  mono: monospace\n  provider: none\nmdc: false\n` : '';
    let body = `---\n${front}layout: ${slide.layout}\nclicks: ${slide.steps.length - 1}\n---\n\n<!-- GENERATED from manifest.yaml. Do not edit. -->\n\n# ${slide.title}\n\n<IncidentVisual :slide-index="${page}" :step-index="$clicks" />\n\n`;
    // Explicit click registrations, while a single visual component owns each state.
    slide.steps.slice(1).forEach((_, i) => { body += `<v-click at="${i + 1}"><span class="click-registration" aria-hidden="true"></span></v-click>\n\n`; });
    return body + `<!--\n${slide.steps.map((step, i) => `Step ${i}: ${step.say}`).join('\n\n')}\n-->\n`;
  }).join('\n');
}
export function generate() {
  const manifest = loadManifest();
  fs.mkdirSync(path.join(root, 'generated'), { recursive: true });
  fs.writeFileSync(path.join(root, 'slides.md'), render(manifest));
  fs.writeFileSync(path.join(root, 'generated/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const audit = ['# Visual and narration audit', '', 'Generated from the manifest. Each state changes its active visual immediately (before narration playback). Retained axes, path nodes, source context and log filler are subdued reference context, not additional claims; narration names the active anchor and interprets the finding without reading logs. Every listed anchor is checked against its narration text; browser screenshots check that each state visibly differs within the first second. Full subtitles default off.', '', '| Slide / step | Seconds | Caption | First-second change | Narrated anchors |', '|---|---:|---|---|---|'];
  for (const slide of manifest.slides) for (const [i, step] of slide.steps.entries()) audit.push(`| ${slide.id} / ${i} | ${step.duration_seconds.toFixed(2)} | ${step.caption} | ${step.visible_change} | ${step.anchors.join('; ')} |`);
  audit.push('', `Total measured clip duration: **${manifest.deck.total_seconds.toFixed(2)} seconds** / ${manifest.deck.runtime_cap_seconds}-second cap.`, '', 'Timeline shape and ring occupancy are schematic. Host chart endpoints come from the fictional counter/replay record; intermediate plotting positions illustrate the step rather than claiming additional samples. Absolute incident timestamps remain visible.');
  fs.writeFileSync(path.join(root, 'audit.md'), audit.join('\n') + '\n');
  console.log(`Generated ${manifest.slides.length} slides / ${manifest.slides.reduce((n, s) => n + s.steps.length, 0)} narration states / ${manifest.deck.total_seconds.toFixed(2)}s`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) generate();
