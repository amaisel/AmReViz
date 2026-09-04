/**
 * What the specs share.
 *
 * Five suites grew their own copies of the same four or five utilities, and
 * they had already drifted: two compositors for the effective background with
 * different floors, two contrast functions where only one parsed the bare hex
 * that SVG attributes carry, two names for the same animation wait. This is the
 * one copy of each.
 *
 * Not a `.spec.js`, so the runner does not collect it as a test file.
 */
import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const env = globalThis.process?.env ?? {};

// 127.0.0.1 rather than localhost, to match what the config serves and what
// `use.baseURL` points at — on a host where localhost resolves to ::1 first,
// the two are not the same address.
export const baseUrl = env.AMREVIZ_TEST_URL || 'http://127.0.0.1:5174/';

export const DESKTOP = { width: 1280, height: 800 };
export const MOBILE = { width: 390, height: 844 };

// ---------------------------------------------------------------------------
// Getting somewhere
// ---------------------------------------------------------------------------

export const cardTitle = (page) => page.locator('.event-card-title').first();
export const stepCounter = (page) => page.locator('.status-chip-counter');

/**
 * Load the app at `hash` as a new document.
 *
 * By way of `about:blank`: `page.goto` to a URL that differs only in its hash
 * is a same-document navigation, so the app never re-reads the address bar and
 * the previous test state keeps running underneath — which reads as a pass
 * that is not real, and hides boot-time routing entirely.
 */
export async function openApp(page, hash = '') {
  if (new URL(page.url(), baseUrl).protocol !== 'about:') await page.goto('about:blank');
  await page.goto(`${baseUrl}${hash}`, { waitUntil: 'domcontentloaded' });
}

/** `openApp`, and wait for the story to be on screen. */
export async function openStory(page, hash) {
  await openApp(page, hash);
  await expect(page.locator('.scrollytelling-view')).toBeVisible();
}

/** Open one event by slug and wait out the map's flight to it. */
export async function openEvent(page, slug) {
  await openApp(page, `#/explore/${slug}`);
  await expect(cardTitle(page)).toBeVisible();
  await page.waitForTimeout(1200);
}

// ---------------------------------------------------------------------------
// Waiting for things to stop moving
// ---------------------------------------------------------------------------

/**
 * Wait for an element to be opaque with nothing still animating on it.
 *
 * Framer Motion animates opacity inline, and a colour read — or an axe scan —
 * that lands mid-transition blends a half-faded badge against the parchment
 * behind it and reports a failure no reader ever sees.
 */
export async function settleAnimations(page, selector, timeout = 15_000) {
  await expect
    .poll(
      () =>
        page.locator(selector).first().evaluate((el) => {
          const opaque = Number(getComputedStyle(el).opacity) === 1;
          const running = el
            .getAnimations({ subtree: true })
            // The active marker's pulse ring loops forever by design.
            .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity);
          return opaque && running.length === 0;
        }),
      { timeout, message: `${selector} never came to rest` },
    )
    .toBe(true);
}

/**
 * Wait for every element matching `selector` to stop transitioning.
 *
 * Every one, not just the first: the chip that changes state is rarely the
 * first in the row, and polling only `.first()` returned "settled" while the
 * one under test was still halfway between its two colours.
 */
export async function settleTransitions(page, selector) {
  await expect
    .poll(
      () => page.locator(selector).evaluateAll((els) => els.reduce((total, el) => total + el
        .getAnimations({ subtree: true })
        .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity)
        .length, 0)),
      { timeout: 5_000, message: `${selector} never stopped transitioning` },
    )
    .toBe(0);
}

/**
 * Read a measurement repeatedly until it stops changing, then return it.
 *
 * `settleAnimations` and `settleTransitions` only know about the Web Animations
 * API. Recharts sizes itself from a ResizeObserver and animates on its own
 * requestAnimationFrame loop, so a chart can still be growing when both of
 * those report the page at rest — which is how the large-screen geometry tests
 * failed roughly two full runs in three under parallel load, once on a chart
 * still at its pre-resize height and once on a card that had not finished
 * reflowing around one.
 *
 * A genuine regression still fails: on timeout this hands back the last read
 * and lets the caller's assertions judge it.
 */
export async function stableMeasure(page, measure, { interval = 200, timeout = 10_000 } = {}) {
  const deadline = Date.now() + timeout;
  let previous = null;
  let current = await page.evaluate(measure);
  while (Date.now() < deadline) {
    previous = JSON.stringify(current);
    await page.waitForTimeout(interval);
    current = await page.evaluate(measure);
    if (JSON.stringify(current) === previous) return current;
  }
  return current;
}

// ---------------------------------------------------------------------------
// Theme and first-visit state
// ---------------------------------------------------------------------------

export async function setTheme(page, dark) {
  await page.evaluate((d) => localStorage.setItem('amreviz-dark-mode', String(d)), dark);
  await page.reload({ waitUntil: 'domcontentloaded' });
}

/** Suppress the first-visit hints, which otherwise sit over what is measured. */
export async function quietFirstVisit(page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('amreviz-hint-dismissed', '1');
      sessionStorage.setItem('amreviz-sheet-bounce', 'true');
    } catch { /* privacy-restricted context; the hints simply show */ }
  });
}

// ---------------------------------------------------------------------------
// Accessibility and colour
// ---------------------------------------------------------------------------

/** Serious/critical axe violations, formatted for a readable assertion message. */
export async function seriousA11yViolations(page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations
    .filter(({ impact }) => impact === 'serious' || impact === 'critical')
    .map(({ id, impact, nodes }) => `${id} (${impact}) on ${nodes[0].target.join(' ')}`);
}

// Handles both the `rgb()`/`rgba()` strings getComputedStyle returns and the
// bare hex SVG attributes carry. Matching digits with a regex works for one and
// quietly mangles the other: `#6FA8E8` yields [6, 8, 8], which reads as
// near-black — and passed as a "dark enough" foreground for a year.
const channels = (value) => {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value).trim());
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  return (String(value).match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
};

const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG relative-luminance contrast, so a pairing can be asserted, not eyeballed. */
export function contrastRatio(foreground, background) {
  const a = luminance(channels(foreground));
  const b = luminance(channels(background));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * What a reader actually sees behind an element, as source to `eval` in the
 * page: every translucent layer from the element up to the first opaque one,
 * composited, with the body as the floor. Returns `{ bg, imagery }`.
 *
 * Reading `backgroundColor` alone and calling it the background is how these
 * tests first reported a false failure — an inactive filter chip under the
 * pointer carries a `rgba(0, 0, 0, 0.05)` hover wash, which as a flat colour is
 * nearly black and as a wash over parchment is barely a tint.
 *
 * `imagery` says a gradient or image is involved somewhere in that stack, which
 * means the declared colours do not describe what is rendered and a ratio
 * computed from them is fiction. The caller decides what to do about it.
 */
export const EFFECTIVE_BG = `(element) => {
  const parse = (s) => { const p = (s||'').match(/[\\d.]+/g); return p ? { rgb: p.slice(0,3).map(Number), a: p.length>3?Number(p[3]):1 } : null; };
  let imagery = false;
  const layers = [];
  for (let n = element; n; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.backgroundImage && cs.backgroundImage !== 'none') imagery = true;
    const p = parse(cs.backgroundColor);
    if (!p || p.a === 0) continue;
    layers.push(p);
    if (p.a === 1) break;
  }
  // Nothing opaque all the way up: the page itself is the floor.
  const body = parse(getComputedStyle(document.body).backgroundColor);
  let base = layers.length && layers[layers.length-1].a === 1
    ? layers.pop().rgb
    : (body ? body.rgb : [255,255,255]);
  for (let i = layers.length - 1; i >= 0; i--) {
    const { rgb, a } = layers[i];
    base = base.map((c, k) => rgb[k]*a + c*(1-a));
  }
  return { bg: 'rgb(' + base.map((c) => Math.round(c)).join(', ') + ')', imagery };
}`;

// ---------------------------------------------------------------------------
// A test that fails on anything the browser reports
// ---------------------------------------------------------------------------

// A hero image that fails to load is not the app's fault: an event whose
// bundled file is missing falls back to hotlinking Wikipedia, so an offline or
// proxied run fails those loads by design and the card renders without a
// picture.
const IGNORED_CONSOLE = [
  /Failed to load resource/i,
  /ERR_(NAME_NOT_RESOLVED|INTERNET_DISCONNECTED|CONNECTION|BLOCKED|FAILED|ABORTED|TIMED_OUT)/i,
  /net::/i,
  /wikipedia\.org/i,
  /favicon/i,
  /Download the React DevTools/i,
];

/**
 * `test`, extended so every test using it also fails on an uncaught exception
 * or a console error, whatever else it asserted. The walkthrough runs on this;
 * any suite can adopt it by importing `test` from here instead.
 */
export const test = base.extend({
  // `run`, not the conventional `use`: eslint's react-hooks rules read a call
  // to `use()` as the React hook of that name and reject it here.
  page: async ({ page }, run) => {
    const problems = [];
    page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (IGNORED_CONSOLE.some((pattern) => pattern.test(text))) return;
      problems.push(`console.error: ${text}`);
    });

    await run(page);

    expect(problems, 'the browser reported errors').toEqual([]);
  },
});

export { expect };
