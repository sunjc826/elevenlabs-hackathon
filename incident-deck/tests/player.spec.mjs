import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const manifest = JSON.parse(fs.readFileSync(new URL('../generated/manifest.json', import.meta.url)));
const states = manifest.slides.flatMap((slide, page) => slide.steps.map((step, click) => ({ ...step, page: page + 1, click })));
async function audioState(page) { return page.locator('audio').evaluate(a => ({ paused: a.paused, time: a.currentTime, src: a.currentSrc, ended: a.ended, duration: a.duration })); }
async function begin(page) {
  await page.goto('./');
  await page.getByRole('button', {name: 'Play narrated review'}).click();
  await expect.poll(async () => (await audioState(page)).time).toBeGreaterThan(0.1);
}

test('gesture gate, Space pause, arrow navigation, and exact resume position', async ({page}) => {
  await page.goto('./');
  await expect(page.getByRole('button', {name: 'Play narrated review'})).toBeVisible();
  expect((await audioState(page)).paused).toBe(true);
  await page.getByRole('button', {name: 'Play narrated review'}).click();
  await expect.poll(async () => (await audioState(page)).time).toBeGreaterThan(0.1);
  await page.keyboard.press('Space');
  const paused = await audioState(page);
  expect(paused.paused).toBe(true);
  expect(page.url()).toMatch(/\/1(?:\?|$)/);
  await page.waitForTimeout(250);
  expect((await audioState(page)).time).toBe(paused.time);
  await page.keyboard.press('Space');
  await expect.poll(async () => (await audioState(page)).time).toBeGreaterThan(paused.time);
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await audioState(page)).src).toContain('v2-timeline-0.mp3');
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await audioState(page)).src).toContain('v2-timeline-1.mp3');
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => (await audioState(page)).src).toContain('v2-timeline-0.mp3');
  expect((await audioState(page)).paused).toBe(true);
});

test('all 28 real media-ended events advance exactly once and stop at the end', async ({page}) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await begin(page);
  for (const [index, state] of states.entries()) {
    await expect.poll(async () => (await audioState(page)).src).toContain(state.clip);
    await expect(page.getByRole('status', {name: 'Visual anchor'})).toHaveText(state.caption);
    await expect.poll(async () => (await audioState(page)).duration).toBeGreaterThan(0);
    await expect.poll(async () => (await audioState(page)).time).toBeGreaterThan(0.05);
    // Advance real media to its last 80ms; do not synthesize an ended event.
    await page.locator('audio').evaluate(a => { a.currentTime = a.duration - .08; });
    if (index < states.length - 1)
      await expect.poll(async () => (await audioState(page)).src).toContain(states[index + 1].clip);
  }
  await expect(page.getByRole('button', {name: 'Replay'})).toBeVisible();
  expect(page.url()).toContain('/10');
  expect((await audioState(page)).paused).toBe(true);
  await page.getByRole('button', {name: 'Replay'}).click();
  await expect.poll(async () => (await audioState(page)).src).toContain('v2-title-0.mp3');
  await expect.poll(async () => (await audioState(page)).paused).toBe(false);
  expect(errors).toEqual([]);
});

test('every click state renders without clipping evidence or slide content', async ({page}) => {
  fs.mkdirSync('.qa/slides', {recursive:true});
  await begin(page);
  await page.keyboard.press('Space');
  let previousVisualHash;
  for (const state of states) {
    if (state !== states[0]) await page.keyboard.press('ArrowRight');
    await expect.poll(async () => (await audioState(page)).src).toContain(state.clip);
    await expect(page.getByRole('status', {name: 'Visual anchor'})).toHaveText(state.caption);
    await page.waitForTimeout(230);
    const current = page.locator(`[data-slidev-no="${state.page}"]`);
    const excerpt = current.locator('.excerpt');
    const overflow = await current.evaluate(el => {
      const bounds = el.getBoundingClientRect();
      return [...el.querySelectorAll('.incident-visual, .excerpt')].some(item => item.getBoundingClientRect().bottom > bounds.bottom - 20);
    });
    expect(overflow, `Slide ${state.page} click ${state.click} overflows`).toBe(false);
    if (await excerpt.count()) expect(await excerpt.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const hash=createHash('sha256').update(await page.locator('#slide-content').screenshot()).digest('hex');
    expect(hash, `First-second visual change for ${state.clip}`).not.toBe(previousVisualHash);
    previousVisualHash=hash;
    await page.screenshot({path:`.qa/slides/${String(state.page).padStart(2,'0')}-${state.click}.png`});
  }
});

test('mobile start and tap controls remain usable', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await begin(page);
  await page.getByRole('button', {name: 'Pause'}).click();
  expect((await audioState(page)).paused).toBe(true);
  await page.getByRole('button', {name:'Next step', exact:true}).click();
  await expect.poll(async () => (await audioState(page)).src).toContain('v2-timeline-0.mp3');
  await page.screenshot({path:'.qa/mobile.png'});
});

test('subtitles toggle, stay readable while paused, and fit mobile screens', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await begin(page);
  await page.keyboard.press('Space');
  const subtitles = page.getByRole('region', {name: 'Narration subtitles'});
  const toggle = page.getByRole('button', {name: 'Subtitles', exact: true});
  await expect(subtitles).toHaveCount(0);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(subtitles).toHaveText(states[0].say);
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(subtitles).toHaveCount(0);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await audioState(page)).src).toContain('v2-timeline-0.mp3');
  await toggle.click();
  await expect(subtitles).toHaveText(states[1].say);
  expect((await audioState(page)).paused).toBe(true);
  const captionBox = await subtitles.boundingBox();
  const slideBox = await page.locator('#slide-content').boundingBox();
  const controlsBox = await page.locator('.narrator-controls').boundingBox();
  expect(slideBox.y + slideBox.height).toBeLessThanOrEqual(captionBox.y);
  expect(captionBox.y + captionBox.height).toBeLessThanOrEqual(controlsBox.y);
  expect(controlsBox.x).toBeGreaterThanOrEqual(0);
  expect(controlsBox.x + controlsBox.width).toBeLessThanOrEqual(390);
  await page.screenshot({path:'.qa/subtitles-mobile.png'});
});

async function go(page, slide, click = 0) {
  await page.goto(`./${slide}?clicks=${click}`);
  await page.getByRole('button', {name:'Play narrated review'}).click();
  await expect.poll(async () => (await audioState(page)).time).toBeGreaterThan(.05);
  await page.keyboard.press('Space');
}
async function seek(page, fraction) {
  await page.locator('audio').evaluate((a,f) => {a.currentTime=a.duration*f},fraction);
  await expect.poll(async () => (await audioState(page)).time).toBeGreaterThan(0);
  await page.waitForTimeout(120);
}
test('timeline draw uses clip duration, reaches its marker, pauses and resets on arrows', async ({page}) => {
  await go(page,2,1);
  const slide = page.locator('[data-slidev-no="2"]');
  const trace=slide.locator('.rate-trace.draw-line');
  await expect(slide.locator('.event-marker')).toHaveCount(2);
  await expect(slide.locator('.event-label')).toContainText('09:00:00');
  const style=await trace.evaluate(el=>({duration:parseFloat(getComputedStyle(el).animationDuration),offset:parseFloat(getComputedStyle(el).strokeDashoffset)}));
  expect(style.duration).toBeCloseTo((await audioState(page)).duration,2);
  await seek(page,.25);
  expect(await trace.evaluate(el=>parseFloat(getComputedStyle(el).strokeDashoffset))).toBeCloseTo(.75,1);
  await seek(page,.99);
  expect(await trace.evaluate(el=>parseFloat(getComputedStyle(el).strokeDashoffset))).toBeCloseTo(.01,1);
  await page.screenshot({path:'.qa/timeline-draw-complete.png'});
  const frozen=await trace.evaluate(el=>getComputedStyle(el).strokeDashoffset);
  await page.waitForTimeout(250);
  expect(await trace.evaluate(el=>getComputedStyle(el).strokeDashoffset)).toBe(frozen);
  await page.keyboard.press('ArrowRight');
  await expect(slide.locator('.event-label')).toContainText('09:00:00.240');
  await expect(slide.locator('.event-marker')).toHaveCount(3);
  expect((await audioState(page)).time).toBe(0);
  expect(await trace.evaluate(el=>parseFloat(getComputedStyle(el).strokeDashoffset))).toBeCloseTo(1,2);
});
test('each evidence source reveals context, finding, then updated path standing', async ({page}) => {
  for (let slideNo=4;slideNo<=7;slideNo++) {
    await go(page,slideNo);
    const slide=page.locator(`[data-slidev-no="${slideNo}"]`);
    await expect(slide.locator('.finding,.chart-finding')).toHaveCount(0);
    await expect(slide.locator('.miniature')).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await expect(slide.locator('.finding,.chart-finding')).toHaveCount(1);
    await expect(slide.locator('.miniature')).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await expect(slide.locator('.miniature')).toHaveCount(1);
    if(slideNo===7) {
      await expect(slide.locator('.miniature')).toHaveAttribute('data-standing','CONFIRMED');
      await expect(slide.locator('.raw-counters')).not.toHaveAttribute('open','');
      await slide.locator('summary').click();
      await expect(slide.locator('.raw-counters pre')).toBeVisible();
    }
  }
});
test('ring burst follows audio seeking, counts 640 once, and resets on revisit', async ({page}) => {
  await go(page,9);
  const slide=page.locator('[data-slidev-no="9"]');
  await expect(slide.locator('.small .drop-count strong')).toHaveText('0');
  await seek(page,.4);
  const count=Number(await slide.locator('.small .drop-count strong').textContent());
  expect(count).toBeGreaterThan(0);expect(count).toBeLessThan(640);
  await page.waitForTimeout(150);
  expect(Number(await slide.locator('.small .drop-count strong').textContent())).toBe(count);
  await seek(page,.75);
  await expect(slide.locator('.small .drop-count strong')).toHaveText('640');
  await expect(slide.locator('.large .buffer-state')).toHaveText('DRAINING');
  await page.screenshot({path:'.qa/ring-burst.png'});
  await seek(page,.99);
  expect(await slide.locator('.large-fill').evaluate(el=>parseFloat(getComputedStyle(el).strokeDashoffset))).toBeCloseTo(1,2);
  const progress=await page.getByRole('progressbar',{name:'Review progress',exact:true}).evaluate(el=>({value:el.value,max:el.max}));
  const before=manifest.slides.slice(0,8).flatMap(s=>s.steps).reduce((n,s)=>n+s.duration_seconds,0);
  expect(progress.max).toBeCloseTo(manifest.deck.total_seconds,2);
  expect(progress.value).toBeCloseTo(before+(await audioState(page)).time,1);
  await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');
  await expect(slide.locator('.small .drop-count strong')).toHaveText('0');
});
