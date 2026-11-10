import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const manifest = JSON.parse(fs.readFileSync(new URL('../generated/manifest.json', import.meta.url)));
const states = manifest.slides.flatMap((slide, page) => slide.steps.map((step, click) => ({ ...step, page: page + 1, click })));
async function audioState(page) { return page.locator('audio').evaluate(a => ({ paused: a.paused, time: a.currentTime, src: a.currentSrc, ended: a.ended, duration: a.duration })); }
async function begin(page) {
  await page.goto('./');
  await page.getByRole('button', {name: 'Play narrated review'}).click();
  await expect.poll(async () => (await audioState(page)).paused).toBe(false);
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
  await expect.poll(async () => (await audioState(page)).src).toContain('timeline-0.mp3');
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await audioState(page)).src).toContain('timeline-1.mp3');
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => (await audioState(page)).src).toContain('timeline-0.mp3');
  expect((await audioState(page)).paused).toBe(true);
});

test('all 21 real media-ended events advance exactly once and stop at the end', async ({page}) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await begin(page);
  for (const [index, state] of states.entries()) {
    await expect.poll(async () => (await audioState(page)).src).toContain(state.clip);
    await expect.poll(async () => (await audioState(page)).duration).toBeGreaterThan(0);
    // Advance real media to its last 80ms; do not synthesize an ended event.
    await page.locator('audio').evaluate(a => { a.currentTime = a.duration - .08; });
    if (index < states.length - 1)
      await expect.poll(async () => (await audioState(page)).src).toContain(states[index + 1].clip);
  }
  await expect(page.getByRole('button', {name: 'Replay'})).toBeVisible();
  expect(page.url()).toContain('/10');
  expect((await audioState(page)).paused).toBe(true);
  await page.getByRole('button', {name: 'Replay'}).click();
  await expect.poll(async () => (await audioState(page)).src).toContain('title-0.mp3');
  await expect.poll(async () => (await audioState(page)).paused).toBe(false);
  expect(errors).toEqual([]);
});

test('every click state renders without clipping evidence or slide content', async ({page}) => {
  fs.mkdirSync('.qa/slides', {recursive:true});
  await begin(page);
  await page.keyboard.press('Space');
  for (const state of states) {
    if (state !== states[0]) await page.keyboard.press('ArrowRight');
    await expect.poll(async () => (await audioState(page)).src).toContain(state.clip);
    await page.waitForTimeout(230);
    const current = page.locator(`[data-slidev-no="${state.page}"]`);
    const excerpt = current.locator('.excerpt');
    const overflow = await current.evaluate(el => {
      const bounds = el.getBoundingClientRect();
      return [...el.querySelectorAll('.step.active, .excerpt')].some(item => item.getBoundingClientRect().bottom > bounds.bottom - 20);
    });
    expect(overflow, `Slide ${state.page} click ${state.click} overflows`).toBe(false);
    if (await excerpt.count()) expect(await excerpt.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.screenshot({path:`.qa/slides/${String(state.page).padStart(2,'0')}-${state.click}.png`});
  }
});

test('mobile start and tap controls remain usable', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await begin(page);
  await page.getByRole('button', {name: 'Pause'}).click();
  expect((await audioState(page)).paused).toBe(true);
  await page.getByRole('button', {name:'Next step', exact:true}).click();
  await expect.poll(async () => (await audioState(page)).src).toContain('timeline-0.mp3');
  await page.screenshot({path:'.qa/mobile.png'});
});
