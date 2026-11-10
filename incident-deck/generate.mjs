// slides.md and generated/manifest.json are outputs. Edit manifest.yaml only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
export const root = path.dirname(fileURLToPath(import.meta.url));
const html = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function loadManifest() {
  const manifest = parse(fs.readFileSync(path.join(root, 'manifest.yaml'), 'utf8'));
  const ids = new Set(), clips = new Set();
  for (const slide of manifest.slides) {
    if (ids.has(slide.id) || !slide.steps?.length) throw new Error('Invalid slide: ' + slide.id);
    ids.add(slide.id);
    for (const step of slide.steps) {
      if (!step.say || step.say.trim().split(/\s+/).length >= 40) throw new Error('Narration too long: ' + step.clip);
      if (clips.has(step.clip) || !/^audio\/[a-z0-9-]+\.mp3$/.test(step.clip)) throw new Error('Invalid clip: ' + step.clip);
      clips.add(step.clip);
    }
    if (slide.excerpt) {
      const lines = fs.readFileSync(path.join(root, slide.excerpt), 'utf8').trimEnd().split('\n');
      if (lines.length < 10 || lines.length > 20 || slide.highlight_line < 1 || slide.highlight_line > lines.length)
        throw new Error('Invalid evidence: ' + slide.id);
    }
  }
  return manifest;
}
export function render(manifest) {
  return manifest.slides.map((slide, page) => {
    const front = page === 0 ? `theme: default\ntitle: ${JSON.stringify(manifest.deck.title)}\ninfo: Fictional narrated incident review\ncolorSchema: dark\naspectRatio: 16/9\ncanvasWidth: 1280\ntransition: fade\ndrawings:\n  enabled: false\nfonts:\n  sans: Inter\n  mono: monospace\n  provider: none\nmdc: false\n` : '';
    let body = `---\n${front}layout: ${slide.layout}\nclicks: ${slide.steps.length - 1}\n---\n\n<!-- GENERATED from manifest.yaml. Do not edit. -->\n\n# ${slide.title}\n\n`;
    if (slide.layout === 'timeline') body += `<p class="time-zone">${html(manifest.deck.date)} · ${html(manifest.deck.timezone)}</p>\n\n`;
    if (slide.excerpt) {
      const lines = fs.readFileSync(path.join(root, slide.excerpt), 'utf8').trimEnd().split('\n');
      body += `<p class="evidence-source">${html(slide.source)}</p>\n\n<div class="excerpt" role="region" aria-label="Evidence excerpt">\n`;
      body += lines.map((line, i) => `<div class="log-line${i + 1 === slide.highlight_line ? ' finding' : ''}"><span class="line-number">${String(i + 1).padStart(2, '0')}</span><pre>${html(line)}</pre></div>`).join('\n');
      body += '\n</div>\n\n';
    }
    body += '<div class="steps">\n\n';
    slide.steps.forEach((step, i) => {
      const inner = step.show.trim().startsWith('<') ? step.show : `\n\n${step.show}\n\n`;
      const content = `<div class="step" :class="{ active: $clicks === ${i} }" data-step="${i}">${inner}</div>`;
      body += (i === 0 ? content : `<v-click at="${i}">\n\n${content}\n\n</v-click>`) + '\n\n';
    });
    body += '</div>\n\n';
    body += `<!--\n${slide.steps.map((step, i) => `Step ${i}: ${step.say}`).join('\n\n')}\n-->\n`;
    return body;
  }).join('\n');
}
export function generate() {
  const manifest = loadManifest();
  fs.mkdirSync(path.join(root, 'generated'), { recursive: true });
  fs.writeFileSync(path.join(root, 'slides.md'), render(manifest));
  fs.writeFileSync(path.join(root, 'generated/manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Generated ${manifest.slides.length} slides / ${manifest.slides.reduce((n, s) => n + s.steps.length, 0)} narration states`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) generate();
