import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { loadManifest, render, root } from '../generate.mjs';
const m = loadManifest();

test('generated deck and player manifest match the single source', () => {
  assert.equal(fs.readFileSync(`${root}/slides.md`, 'utf8'), render(m));
  assert.deepEqual(JSON.parse(fs.readFileSync(`${root}/generated/manifest.json`, 'utf8')), m);
  const output = render(m);
  assert.equal((output.match(/<v-click at=/g) || []).length, m.slides.reduce((n,s) => n + s.steps.length - 1, 0));
  assert.equal((output.match(/class="log-line finding"/g) || []).length, 4);
});

test('every narration step has a matching, intact audio clip and runtime meets target', () => {
  const metrics = JSON.parse(fs.readFileSync(`${root}/metrics/run-1.json`, 'utf8'));
  for (const slide of m.slides) for (const step of slide.steps) {
    const row = metrics.clips.find(r => r.clip === step.clip);
    assert.ok(row, step.clip);
    assert.equal(row.characters, step.say.length);
    assert.ok(row.fingerprint.length === 64);
    const bytes = fs.readFileSync(`${root}/public/${step.clip}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), row.sha256);
    assert.ok(row.duration_seconds > 0);
  }
  assert.ok(metrics.total_duration_seconds >= 180 && metrics.total_duration_seconds <= 240);
});

test('each evidence source is independent and has one valid finding line', () => {
  const sources = m.slides.filter(s => s.excerpt);
  assert.equal(new Set(sources.map(s => s.excerpt)).size, 4);
  for (const slide of sources) {
    const lines = fs.readFileSync(`${root}/${slide.excerpt}`, 'utf8').trimEnd().split('\n');
    assert.ok(lines.length >= 10 && lines.length <= 20);
    assert.ok(lines[slide.highlight_line - 1].length > 10);
  }
});
