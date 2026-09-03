import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const baseUrl = globalThis.process?.env.AMREVIZ_TEST_URL || 'http://localhost:5174/';

// WCAG's relative luminance, so a measured pairing can be asserted rather than
// eyeballed. Takes the `rgb()`/`rgba()` strings getComputedStyle returns.
function contrastRatio(foreground, background) {
  const channels = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
  const luminance = (rgb) => {
    const [r, g, b] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = luminance(channels(foreground));
  const b = luminance(channels(background));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// What a reader actually sees behind an element: every translucent layer from
// the element up to the first opaque one, composited.
//
// Reading `backgroundColor` alone and calling it the background is how this
// test first reported a false failure — an inactive filter chip under the
// pointer carries a `rgba(0, 0, 0, 0.05)` hover wash, which as a flat colour
// is nearly black, and as a wash over parchment is barely a tint.
const EFFECTIVE_BACKGROUND = `(element) => {
  const layers = [];
  for (let node = element; node; node = node.parentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    const parts = bg.match(/[\\d.]+/g);
    if (!parts) continue;
    const alpha = parts.length > 3 ? Number(parts[3]) : 1;
    if (alpha === 0) continue;
    layers.push({ rgb: parts.slice(0, 3).map(Number), alpha });
    if (alpha === 1) break;
  }
  // Nothing opaque all the way up: the page itself is the floor.
  const bodyBg = getComputedStyle(document.body).backgroundColor.match(/[\\d.]+/g);
  let base = layers.length && layers[layers.length - 1].alpha === 1
    ? layers.pop().rgb
    : (bodyBg ? bodyBg.slice(0, 3).map(Number) : [255, 255, 255]);
  // Composite from the bottom layer upward.
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    const { rgb, alpha } = layers[i];
    base = base.map((c, k) => rgb[k] * alpha + c * (1 - alpha));
  }
  return \`rgb(\${base.map((c) => Math.round(c)).join(', ')})\`;
}`;

// Colour is transitioned over 0.2s on several of these controls, so a value
// read immediately after a click belongs to neither the old state nor the new
// one. Wait for every matching element to stop animating before measuring.
//
// Every one, not just the first: the chip that changes state is rarely the
// first in the row, and polling only `.first()` returned "settled" while the
// one under test was still halfway between its two colours.
async function settleTransitions(page, selector) {
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

// A fresh page per bogus route. `page.goto` to a URL that differs only in its
// hash is a same-document navigation, so the previous app state keeps running
// and the next case inherits it — which reads as a pass that is not real.
async function freshVisit(page, hash) {
  await page.goto(`${baseUrl}${hash}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.scrollytelling-view')).toBeVisible();
}

test.describe('Keyboard and assistive technology', () => {
  // Leaflet stamps role="button" and tabindex="0" on every marker icon while
  // its `keyboard` option is on — `interactive: false` does not stop it. That
  // put 30 decorative labels (MA, NY, 1776, ATLANTIC OCEAN…) in the tab order
  // ahead of the markers that actually select an event.
  test('decorative map labels are not tab stops', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/16`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.leaflet-container')).toBeVisible();
    // Event 16 is late in the story, so every year marker has been drawn.
    await expect(page.locator('.trail-year-marker').first()).toBeVisible();

    const phantom = await page.evaluate(() => {
      const decorative = '.colony-label, .trail-year-marker, .period-map-label';
      return [...document.querySelectorAll(decorative)]
        .filter((el) => el.tabIndex >= 0 || el.getAttribute('role') === 'button')
        .map((el) => el.textContent.trim());
    });
    expect(phantom, 'decorative labels must not be focusable').toEqual([]);

    // The real markers are still reachable.
    const markers = page.locator('.custom-marker [role="button"]');
    expect(await markers.count()).toBeGreaterThan(0);
    await expect(markers.first()).toHaveAttribute('tabindex', '0');
  });

  test('the first tab stop skips the header and does not disturb the route', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/9`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.scrollytelling-view')).toBeVisible();

    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    // Hidden until focused, then fully on screen.
    await expect.poll(() => skip.evaluate((el) => el.getBoundingClientRect().top)).toBe(0);

    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
    // A plain <a href="#main-content"> would have rewritten the hash to
    // #main-content, which parses as an unknown view and lands on welcome.
    await expect(page).toHaveURL(/#\/explore\/9$/);
  });

  test('each story step is announced', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/1`, { waitUntil: 'domcontentloaded' });
    const status = page.locator('[role="status"][aria-live="polite"]').first();

    await expect(status).toContainText('Boston Tea Party');
    await expect(status).toContainText('Step 3 of');

    await page.keyboard.press('ArrowRight');
    await expect(status).toContainText('Coercive Acts');
    await expect(status).toContainText('Step 4 of');

    // Announced, but not painted over the map.
    const box = await status.boundingBox();
    expect(box.width).toBeLessThanOrEqual(1);
    expect(box.height).toBeLessThanOrEqual(1);
  });

  test('the shortcuts overlay is a modal dialog that returns focus', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/9`, { waitUntil: 'domcontentloaded' });
    const opener = page.getByRole('button', { name: 'Show keyboard shortcuts' });
    await opener.click();

    const dialog = page.getByRole('dialog', { name: 'Keyboard Shortcuts' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    const close = page.getByRole('button', { name: 'Close keyboard shortcuts' });
    await expect(close).toBeFocused();

    // Tab must not walk out from behind the backdrop.
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press('Tab');
      expect(
        await page.evaluate(() => Boolean(document.activeElement.closest('[role="dialog"]'))),
        'focus escaped the dialog',
      ).toBe(true);
    }

    await close.click();
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
});

test.describe('Colour', () => {
  // Measured before the palette module existed: white on the gold was 2.49:1
  // and on the green 4.39:1, against a 4.5:1 threshold. The colours were
  // declared independently in four components, so fixing one missed the rest.
  test('every type and outcome badge meets WCAG AA in both themes', async ({ page }) => {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    const samples = await page.evaluate(async () => {
      const { events } = await import('/src/data/events.js');
      const byType = {};
      const byOutcome = {};
      for (const event of events) {
        if (!byType[event.type]) byType[event.type] = event.id;
        if (event.outcome && !byOutcome[event.outcome]) byOutcome[event.outcome] = event.id;
      }
      return { byType, byOutcome };
    });

    // All four types and all four outcomes must actually be represented, or
    // this test passes by not looking at the failing one.
    expect(Object.keys(samples.byType).sort()).toEqual(
      ['battle', 'diplomatic', 'military', 'political'],
    );
    expect(Object.keys(samples.byOutcome).sort()).toEqual(
      ['allied', 'american', 'british', 'indecisive'],
    );

    for (const darkMode of [false, true]) {
      const theme = darkMode ? 'dark' : 'light';
      const checks = [
        ...Object.entries(samples.byType).map(([k, id]) => ['.event-card-type-badge', k, id]),
        ...Object.entries(samples.byOutcome).map(([k, id]) => ['.event-card-outcome', k, id]),
      ];

      for (const [selector, name, id] of checks) {
        await page.goto(`${baseUrl}#/explore/${id}`, { waitUntil: 'domcontentloaded' });
        // Set the theme and reload: toggling with `d` flips whatever the
        // previous case left in localStorage rather than setting it.
        await page.evaluate((d) => localStorage.setItem('amreviz-dark-mode', String(d)), darkMode);
        await page.reload({ waitUntil: 'domcontentloaded' });

        const badge = page.locator(selector).first();
        await expect(badge).toBeVisible();
        const { fg, bg } = await badge.evaluate((el, src) => {
          const effective = eval(src);
          return { fg: getComputedStyle(el).color, bg: effective(el) };
        }, EFFECTIVE_BACKGROUND);
        const ratio = contrastRatio(fg, bg);
        expect(ratio, `${selector} "${name}" in ${theme} mode: ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  // The label of an inactive chip sits on the panel surface rather than on the
  // hue, and used to be painted in the hue anyway: #C5A02F on near-white
  // measured 2.18:1, and #2C4B7A on the dark surface 1.97:1.
  test('filter chips are legible active and inactive, in both themes', async ({ page }) => {
    for (const darkMode of [false, true]) {
      await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
      await page.evaluate((d) => localStorage.setItem('amreviz-dark-mode', String(d)), darkMode);
      await page.reload({ waitUntil: 'domcontentloaded' });

      await page.getByRole('button', { name: 'Filter' }).click();
      const chips = page.locator('.filter-btn');
      await expect(chips.first()).toBeVisible();

      // Turn one off so both states are on screen at once.
      await page.getByRole('button', { name: 'Political', exact: true }).click();
      // `.filter-btn` transitions `all` over 0.2s, so measuring straight after
      // the click samples a colour that is on its way somewhere — in dark mode
      // it read as a washed blue on a washed navy, which is neither state.
      await settleTransitions(page, '.filter-btn');

      const measured = await chips.evaluateAll((els, src) => {
        const effective = eval(src);
        return els.map((el) => ({
          label: el.textContent.trim(),
          fg: getComputedStyle(el).color,
          bg: effective(el),
          active: el.classList.contains('active'),
        }));
      }, EFFECTIVE_BACKGROUND);

      expect(measured.some((c) => c.active), 'need an active chip').toBe(true);
      expect(measured.some((c) => !c.active), 'need an inactive chip').toBe(true);

      for (const chip of measured) {
        const ratio = contrastRatio(chip.fg, chip.bg);
        const state = chip.active ? 'active' : 'inactive';
        const theme = darkMode ? 'dark' : 'light';
        expect(ratio, `${state} "${chip.label}" chip in ${theme} mode`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  // The panel opens on top of the story card. At 0.75 alpha the card's prose
  // read straight through it — a blur softens text but does not hide it.
  test('the desktop filters panel is opaque', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Filter' }).click();

    const panel = page.locator('.filters-panel');
    await expect(panel).toBeVisible();
    const style = await panel.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, backdrop: cs.backdropFilter };
    });
    const alpha = Number(style.bg.match(/[\d.]+/g)?.[3] ?? 1);
    expect(alpha, `panel background ${style.bg} must be fully opaque`).toBe(1);
    expect(style.backdrop === 'none' || style.backdrop === '').toBe(true);
  });
});

test.describe('Touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  // Measured on a 390px phone before this: the view toggle was 60x22 and
  // 42x22, the theme toggle 32x32, the speed control 30x22, the preset chips
  // 22px tall, and the map's only zoom buttons 30x30.
  test('every control a thumb needs is at least 40px', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.bottom-sheet')).toBeVisible();
    await page.getByRole('button', { name: 'Story controls' }).click();

    const selectors = [
      '.view-toggle button',
      '.mode-toggle',
      '.leaflet-control-zoom a',
      '.sheet-step-btn',
      '.sheet-panel-toggle',
      '.bottom-sheet-handle',
      '.speed-indicator',
      '.filter-preset-chip',
      '.filter-btn',
    ];

    const undersized = await page.evaluate((sels) => {
      const bad = [];
      for (const sel of sels) {
        const nodes = [...document.querySelectorAll(sel)];
        if (nodes.length === 0) bad.push({ sel, note: 'no element matched' });
        for (const el of nodes) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          if (r.width < 40 || r.height < 40) {
            bad.push({ sel, size: `${Math.round(r.width)}x${Math.round(r.height)}` });
          }
        }
      }
      return bad;
    }, selectors);

    expect(undersized).toEqual([]);
  });

  test('the map controls and the progress chip do not overlap', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.leaflet-control-zoom')).toBeVisible();

    const overlap = await page.evaluate(() => {
      const chip = document.querySelector('.explore-status-chip').getBoundingClientRect();
      const zoom = document.querySelector('.leaflet-control-zoom').getBoundingClientRect();
      return !(chip.right < zoom.left || chip.left > zoom.right
        || chip.bottom < zoom.top || chip.top > zoom.bottom);
    });
    expect(overlap, 'the enlarged zoom buttons must not sit under the chip').toBe(false);
  });

  // At peek the card cannot scroll, so the Prev/Next pair at its foot was
  // permanently below the fold, leaving a swipe — taught by a hint that
  // dismisses itself after six seconds — as the only way to move the story.
  test('the sheet header steps the story at both snap points', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
    const counter = page.locator('.status-chip-counter');
    const index = async () => Number((await counter.textContent()).split('/')[0]);

    const next = page.getByRole('button', { name: 'Next event' });
    const prev = page.getByRole('button', { name: 'Previous event' });

    // Exactly one of each: the card's own pair is hidden inside the sheet, so
    // a screen reader is not offered two controls with the same name.
    await expect(next).toHaveCount(1);
    await expect(prev).toHaveCount(1);
    await expect(next).toBeInViewport();

    const start = await index();
    await next.click();
    await expect.poll(index).toBe(start + 1);

    // Still reachable with the sheet fully open.
    await page.getByRole('button', { name: 'Expand event details' }).click();
    await expect(page.getByRole('button', { name: 'Collapse event details' })).toBeVisible();
    await expect(next).toBeInViewport();
  });

  test('the first event disables the back step rather than hiding it', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/101`, { waitUntil: 'domcontentloaded' });
    const prev = page.getByRole('button', { name: 'Previous event' });
    await expect(prev).toBeVisible();
    await expect(prev).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Next event' })).toBeEnabled();
  });
});

// How many distinct positions the map passes through while taking one step.
// A jump produces the resting transform before and the resting transform
// after; a flight walks through every frame in between.
async function mapTransformsDuringStep(page) {
  return page.evaluate(async () => {
    const pane = document.querySelector('.leaflet-map-pane');
    const seen = new Set();
    const poll = setInterval(() => seen.add(getComputedStyle(pane).transform), 40);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await new Promise((r) => setTimeout(r, 2500));
    clearInterval(poll);
    return seen.size;
  });
}

test.describe('Reduced motion', () => {
  // `page.emulateMedia` rather than `test.use({ reducedMotion })`: the fixture
  // option did not reach the page in this runner, and a preference test that
  // silently never sets the preference is worse than no test at all.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(
      await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    ).toBe(true);
  });

  test('the map cuts to the next event instead of flying', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/123`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('.event-card-title')).toBeVisible();

    const transforms = await mapTransformsDuringStep(page);
    // One resting transform before the step and one after is the most a jump
    // can produce; the flight walks through the frames in between.
    expect(transforms, 'the map animated between events').toBeLessThanOrEqual(2);
  });

  test('the card crossfades without the 3D swing, and the marker stops pulsing', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/9`, { waitUntil: 'domcontentloaded' });
    const card = page.locator('.event-card-fixed').first();
    await expect(card).toBeVisible();

    // `perspective` and `transformStyle` are set on the element only when the
    // 3D entry is in play, so their absence is the assertion. Poll rather than
    // read once: the card is still mounting on the first tick.
    await expect
      .poll(() => card.evaluate((el) => el.getAttribute('style') ?? ''))
      .not.toContain('perspective');
    expect(await card.evaluate((el) => el.getAttribute('style') ?? '')).not.toContain('rotateY');

    await expect
      .poll(() => page.locator('.marker-pulse-ring').first().evaluate(
        (el) => el.getAnimations().filter((a) => a.playState === 'running').length,
      ))
      .toBe(0);
  });

});

test.describe('Motion by default', () => {
  // The counterpart to the reduced-motion tests: they only mean anything if
  // the same page animates for everyone else. Without this, deleting the
  // animation entirely would make all three pass.
  test('the map animates between events when motion is not suppressed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`${baseUrl}#/explore/123`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.event-card-title')).toBeVisible();

    expect(await mapTransformsDuringStep(page), 'the map should animate by default')
      .toBeGreaterThan(2);
  });

  test('the card keeps its 3D entry and the active marker keeps pulsing', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`${baseUrl}#/explore/9`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.event-card-fixed').first()).toBeVisible();

    await expect
      .poll(() => page.locator('.event-card-fixed').first()
        .evaluate((el) => el.getAttribute('style') ?? ''))
      .toContain('perspective');

    await expect
      .poll(() => page.locator('.marker-pulse-ring').first().evaluate(
        (el) => el.getAnimations().filter((a) => a.playState === 'running').length,
      ))
      .toBeGreaterThan(0);
  });
});

test.describe('Routing', () => {
  // Press right then left inside ~150ms and the story used to land one step
  // forward instead of back: the id the first press wrote to the URL came
  // back down a frame later as an instruction to go there. Measured before
  // the fix: 5 of 5 wrong at a 100ms gap.
  for (const gap of [0, 60, 120]) {
    test(`reversing direction after ${gap}ms returns to the starting step`, async ({ page }) => {
      await page.goto(`${baseUrl}#/explore/9`, { waitUntil: 'domcontentloaded' });
      const counter = page.locator('.status-chip-counter');
      const index = async () => Number((await counter.textContent()).split('/')[0]);
      await expect(counter).toBeVisible();

      const start = await index();
      await page.keyboard.press('ArrowRight');
      if (gap) await page.waitForTimeout(gap);
      await page.keyboard.press('ArrowLeft');

      // Poll, then hold: the failure is a late write that arrives after the
      // index has briefly been correct, so settling on the right answer
      // matters more than reaching it.
      await expect.poll(index).toBe(start);
      await page.waitForTimeout(600);
      expect(await index(), 'a late URL echo pulled the story forward').toBe(start);
    });
  }

  test('a deep link, Back and Forward all still move the story', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/16`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Siege of Yorktown' })).toBeVisible();

    await page.goto(`${baseUrl}#/explore/1`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Boston Tea Party' })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('heading', { name: 'Coercive Acts Target Massachusetts' })).toBeVisible();

    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Boston Tea Party' })).toBeVisible();
    await page.goForward();
    await expect(page.getByRole('heading', { name: 'Coercive Acts Target Massachusetts' })).toBeVisible();
  });

  // The address bar has to name the event on screen, or a copied link hands
  // someone else something different from what was being read.
  for (const hash of ['#/explore/99999', '#/explore/abc', '#/explore/-3', '#/explore/0']) {
    test(`${hash} is rewritten to the event actually shown`, async ({ page }) => {
      // Cold: nothing on screen yet, so the story opens at the beginning.
      await freshVisit(page, hash);
      await expect(page).toHaveURL(/#\/explore\/\d+$/);
      const coldTitle = await page.locator('.event-card-title').first().textContent();
      expect(coldTitle.trim()).toBe('Stamp Act Congress Meets');

      // Live: the story is already somewhere, and stays there — but the URL
      // has to come back to it rather than keep advertising the bogus id.
      await freshVisit(page, '#/explore/9');
      await expect(page.getByRole('heading', { name: 'Battle of Long Island' })).toBeVisible();
      await page.evaluate((h) => { window.location.hash = h; }, hash);

      await expect(page).toHaveURL(/#\/explore\/9$/);
      await expect(page.getByRole('heading', { name: 'Battle of Long Island' })).toBeVisible();
    });
  }
});

test.describe('Data view', () => {
  // Recharts 3 stopped passing `activePayload` to a chart's onClick, so the
  // guard reading `state.activePayload[0].payload.id` never matched and the
  // chart's own instruction — "Click a bar to inspect its definition" —
  // pointed at nothing.
  test('clicking a casualties bar opens that battle in the story', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });

    const chart = page.getByRole('region', { name: 'Casualties by Major Battle Chart' });
    // Scroll the chart, not the bar: Recharts re-renders on the resize that
    // scrolling triggers, and a bar resolved beforehand detaches mid-action.
    await chart.scrollIntoViewIfNeeded();
    await expect(chart.locator('.recharts-bar-rectangle').first()).toBeVisible();
    await chart.locator('.recharts-bar-rectangle').nth(2).click();

    await expect(page).toHaveURL(/#\/explore\/\d+$/);
    await expect(page.locator('.event-card-title').first()).toContainText('Bunker Hill');
  });

  test('clicking a year in the troops chart opens that year in the story', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });

    const chart = page.getByRole('region', { name: 'American Troops Furnished by Year Chart' });
    await chart.scrollIntoViewIfNeeded();
    const dots = chart.locator('.recharts-area-dot, .recharts-dot');
    await expect(dots.first()).toBeVisible();
    // Clicking a dot is the case that used to do nothing: Recharts fires an
    // Area's own onClick for the filled shape only, so the handler moved up
    // to the chart, where the whole column is the target.
    await dots.nth(4).click({ force: true });

    await expect(page).toHaveURL(/#\/explore\/\d+$/);
    await expect(page.locator('.event-card-title').first()).toBeVisible();
  });

  test('the source citations are reachable targets on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'War in Numbers' })).toBeVisible();

    const small = await page.locator('.data-method-links a').evaluateAll((els) => els
      .map((el) => ({ text: el.textContent.trim(), h: Math.round(el.getBoundingClientRect().height) }))
      .filter((el) => el.h < 32));
    expect(small, 'citation links were 19px tall').toEqual([]);
  });
});

test.describe('Accessibility scans that reach every event type', () => {
  // The existing scans all start on event 101, which is `political` — the one
  // type whose badge already passed. A per-type sweep is what would have
  // caught the gold at 2.49:1.
  for (const [type, hash] of [
    ['battle', '#/explore/3'],
    ['political', '#/explore/101'],
    ['diplomatic', '#/explore/127'],
    ['military', '#/explore/7'],
  ]) {
    test(`a ${type} event passes axe`, async ({ page }) => {
      await page.goto(`${baseUrl}${hash}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.event-card-type-badge')).toBeVisible();
      // Let the card's entry transition finish: axe blends a half-faded badge
      // against the parchment and reports a contrast failure nobody sees.
      await expect
        .poll(() => page.locator('.event-card-fixed').first().evaluate((el) => {
          const settled = Number(getComputedStyle(el).opacity) === 1;
          const running = el.getAnimations({ subtree: true })
            .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity);
          return settled && running.length === 0;
        }), { timeout: 10_000 })
        .toBe(true);

      const { violations } = await new AxeBuilder({ page }).analyze();
      const serious = violations
        .filter(({ impact }) => impact === 'serious' || impact === 'critical')
        .map(({ id, impact, nodes }) => `${id} (${impact}) on ${nodes[0].target.join(' ')}`);
      expect(serious).toEqual([]);
    });
  }
});

test.describe('Large screens', () => {
  // The story panel was capped at `clamp(390px, 40vw, 640px)`, so past about
  // 1600px it stopped growing: 25% of a 2560 display, 19% of a 3440, a strip of
  // 12.8px text beside an enormous map with 362px of dead parchment under the
  // card. Widening it alone would have made the reading worse — the measure was
  // already 80 characters at 1440 and 90 at 1920 — so the type scales with it
  // and the text column is capped in `ch`.
  const measure = async (page) => page.evaluate(() => {
    const panel = document.querySelector('.desktop-event-card');
    const body = document.querySelector('.event-card-description');
    const cs = getComputedStyle(body);
    // Characters per line, from this font's own average advance rather than a
    // guess: `ch` is the width of "0", which runs wide for a proportional face.
    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${cs.font}`;
    probe.textContent = 'abcdefghijklmnopqrstuvwxyz';
    body.appendChild(probe);
    const charWidth = probe.getBoundingClientRect().width / 26;
    probe.remove();
    return {
      panelShare: panel.getBoundingClientRect().width / window.innerWidth,
      bodyPx: parseFloat(cs.fontSize),
      measure: body.getBoundingClientRect().width / charWidth,
    };
  });

  for (const [width, height] of [[1920, 1080], [2560, 1440], [3440, 1440]]) {
    test(`${width}x${height} gets a readable column, not a strip`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Battle of Bunker Hill' })).toBeVisible();

      const m = await measure(page);
      // The panel keeps a real share of the width. It was 0.25 at 2560 and
      // 0.19 at 3440 before this.
      expect(m.panelShare, 'panel share of viewport width').toBeGreaterThan(0.28);
      // And the map is still the larger half — this is a map-led story.
      expect(m.panelShare).toBeLessThan(0.45);
      // Type grows with the display instead of sitting at 12.8px forever.
      expect(m.bodyPx, 'body text size').toBeGreaterThanOrEqual(15);
      // The whole point of growing them together: the line length comes down
      // rather than up. 45-75 is the comfortable band; 80 is where it started.
      expect(m.measure, 'characters per line').toBeLessThan(78);
      expect(m.measure, 'characters per line').toBeGreaterThan(40);
    });
  }

  test('the type scale climbs with the viewport', async ({ page }) => {
    const sizes = [];
    for (const width of [1440, 1920, 2560, 3440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Battle of Bunker Hill' })).toBeVisible();
      sizes.push((await measure(page)).bodyPx);
    }
    // Monotonic, and materially bigger by the end.
    for (let i = 1; i < sizes.length; i += 1) {
      expect(sizes[i], `${sizes} should not shrink as the viewport grows`)
        .toBeGreaterThanOrEqual(sizes[i - 1]);
    }
    expect(sizes[sizes.length - 1]).toBeGreaterThan(sizes[0] * 1.3);
  });

  // Cards focus mode has its own spacious layout and must not inherit the
  // narrow prose cap meant for the split view.
  test('cards focus mode keeps its own wide layout', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Focus cards' }).click();
    await expect(page.locator('.scrollytelling-view.view-mode-cards')).toBeVisible();

    const cardWidth = await page.locator('.event-card-fixed').first()
      .evaluate((el) => el.getBoundingClientRect().width);
    // Far wider than the split view's capped prose column.
    expect(cardWidth).toBeGreaterThan(900);
  });
});
