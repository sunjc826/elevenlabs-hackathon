// Generated slides and player data. Content comes only from manifest.yaml and its excerpts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import {prepareManifest,renderAudit} from '@hackathon/narrated-deck/manifest';
export const root = path.dirname(fileURLToPath(import.meta.url));
export function loadManifest() {
  const manifest = parse(fs.readFileSync(path.join(root, 'manifest.yaml'), 'utf8'));
  const metricsPath = path.join(root, 'metrics', `${manifest.deck.audio_revision}-run-1.json`);
  const metrics = fs.existsSync(metricsPath) ? JSON.parse(fs.readFileSync(metricsPath, 'utf8')).clips : [];
  return prepareManifest(manifest, {
    durations: metrics,
    requireMeasured: true,
    readExcerpt: excerpt => fs.readFileSync(path.join(root,excerpt),'utf8'),
  });
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
  fs.writeFileSync(path.join(root, 'audit.md'), renderAudit(manifest));
  console.log(`Generated ${manifest.slides.length} slides / ${manifest.slides.reduce((n, s) => n + s.steps.length, 0)} narration states / ${manifest.deck.total_seconds.toFixed(2)}s`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) generate();
