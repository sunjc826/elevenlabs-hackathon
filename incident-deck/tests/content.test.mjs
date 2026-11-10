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
  assert.equal((output.match(/<IncidentVisual /g) || []).length, m.slides.length);
});

test('every narration step has a matching, intact audio clip and runtime meets target', () => {
  const metrics = JSON.parse(fs.readFileSync(`${root}/metrics/${m.deck.audio_revision}-run-1.json`, 'utf8'));
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

 test('visual pacing, evidence stages and anchor audits cover all states', () => {
  for (const slide of m.slides) for (const step of slide.steps) {
    assert.ok(step.caption.split(/\s+/).length < 8);
    assert.ok(step.visible_change && step.anchors.length);
    if (slide.visual === 'metrics') assert.ok(step.duration_seconds >= 4 && step.duration_seconds <= 6);
    if (step.phase === 'interpret') assert.ok(step.duration_seconds >= 15 && step.duration_seconds <= 20);
  }
  for (const slide of m.slides.filter(s => s.excerpt))
    assert.deepEqual(slide.steps.map(s => s.phase), ['orient','interpret','standing']);
  assert.equal(m.slides.find(s => s.id === 'timeline').metrics.range_seconds,1500);
  assert.equal(m.slides.find(s => s.id === 'evidence-host').chart.series.length,2);
  assert.ok(m.deck.total_seconds <= 240);
});
