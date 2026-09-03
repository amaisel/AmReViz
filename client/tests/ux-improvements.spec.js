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
    await expect(page).toHaveURL(/#\/explore\/battle-of-long-island$/);
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

  // Leaflet's keyboard handler makes the map container focusable and, once a
  // click on the sea has focused it, pans on the arrow keys and stops the
  // event — so the story's own listener never heard them. The arrows are the
  // default way through the story on desktop; touching the map must not
  // switch them off.
  test('arrow keys still step the story after clicking the map', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/1`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Boston Tea Party' })).toBeVisible();

    // Open water, well clear of any marker.
    await page.locator('.leaflet-container').click({ position: { x: 60, y: 420 } });
    expect(
      await page.evaluate(() => document.activeElement.classList.contains('leaflet-container')),
      'the map container must not take focus',
    ).toBe(false);

    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('heading', { name: 'Coercive Acts Target Massachusetts' })).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('heading', { name: 'Boston Tea Party' })).toBeVisible();
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
  // someone else something different from what was being read. Five kinds of
  // junk: numbers no event has, a slug no event has, and two the router itself
  // rejects as malformed.
  for (const hash of ['#/explore/99999', '#/explore/0', '#/explore/no-such-battle', '#/explore/-3', '#/explore/Bunker%20Hill']) {
    test(`${hash} is rewritten to the event actually shown`, async ({ page }) => {
      // Cold: nothing on screen yet, so the story opens at the beginning.
      await freshVisit(page, hash);
      await expect(page).toHaveURL(/#\/explore\/stamp-act-congress-meets$/);
      const coldTitle = await page.locator('.event-card-title').first().textContent();
      expect(coldTitle.trim()).toBe('Stamp Act Congress Meets');

      // Live: the story is already somewhere, and stays there — but the URL
      // has to come back to it rather than keep advertising the bogus key.
      await freshVisit(page, '#/explore/battle-of-long-island');
      await expect(page.getByRole('heading', { name: 'Battle of Long Island' })).toBeVisible();
      await page.evaluate((h) => { window.location.hash = h; }, hash);

      await expect(page).toHaveURL(/#\/explore\/battle-of-long-island$/);
      await expect(page.getByRole('heading', { name: 'Battle of Long Island' })).toBeVisible();
    });
  }

  // The number in the old links was the event's internal id, which only looks
  // like a position: the first 18 events are 1-18 and the 29 added later are
  // 101-129, so `#/explore/105` read as "the 105th of 47 events". The URL now
  // carries the slug, and every number that was ever shared still resolves.
  test('the story steps through slugs, not ids', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/battle-of-bunker-hill`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Battle of Bunker Hill' })).toBeVisible();
    await expect(page).toHaveURL(/#\/explore\/battle-of-bunker-hill$/);

    // Bunker Hill's interlude shares its URL; the step after is id 126 —
    // the number a reader used to see jump from 5 to 126.
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('heading', { name: 'The Cost of Rebellion' })).toBeVisible();
    await expect(page).toHaveURL(/#\/explore\/battle-of-bunker-hill$/);
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('heading', { name: 'Proclamation of Rebellion' })).toBeVisible();
    await expect(page).toHaveURL(/#\/explore\/proclamation-of-rebellion$/);
  });

  for (const [id, slug, title] of [
    [5, 'battle-of-bunker-hill', 'Battle of Bunker Hill'],
    [105, 'dunmores-proclamation', "Dunmore's Proclamation"],
    [129, 'the-commons-votes-against-the-war', 'The Commons Votes Against the War'],
  ]) {
    test(`a pre-slug link #/explore/${id} still opens ${title} and is rewritten`, async ({ page }) => {
      await page.goto(`${baseUrl}#/explore/${id}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`#/explore/${slug}$`));
    });
  }

  // Correcting the address must not push history: a pre-slug link that was
  // rewritten by pushing left Back pointing at the old number, which was
  // corrected forward again, and the page before it could not be reached.
  test('a pre-slug link is replaced, not pushed, so Back leaves the story', async ({ page }) => {
    await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'War in Numbers' })).toBeVisible();

    await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Battle of Bunker Hill' })).toBeVisible();
    await expect(page).toHaveURL(/#\/explore\/battle-of-bunker-hill$/);

    await page.goBack();
    await expect(page).toHaveURL(/#\/data$/);
    await expect(page.getByRole('heading', { name: 'War in Numbers' })).toBeVisible();
  });

  test('every event has a unique, URL-safe slug', async ({ page }) => {
    await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });
    const slugs = await page.evaluate(async () => {
      const { events } = await import('/src/data/events.js');
      return events.map((e) => e.slug);
    });
    expect(slugs.length).toBeGreaterThan(40);
    expect(new Set(slugs).size, 'slugs must be unique').toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug, 'lowercase words and digits joined by single hyphens').toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });
});

test.describe('Data view', () => {
  // A click on the ledger inspects the comparison below. The story is a
  // separate, explicit action so scanning the chart does not yank the view.
  test('clicking a casualties bar updates the comparison; the story opens from a button', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });

    const chart = page.getByRole('region', { name: 'Casualties by Major Battle Chart' });
    // Scroll the chart, not the bar: Recharts re-renders on the resize that
    // scrolling triggers, and a bar resolved beforehand detaches mid-action.
    await chart.scrollIntoViewIfNeeded();
    await expect(chart.locator('.recharts-bar-rectangle').first()).toBeVisible();
    await chart.locator('.recharts-bar-rectangle').nth(2).click();

    await expect(page).toHaveURL(/#\/data/);
    await expect(page.getByRole('combobox', { name: 'Select a battle to compare' }))
      .toHaveValue('5');
    await expect(chart.locator('.casualty-row-band, .recharts-tooltip-cursor, .recharts-activeBar'))
      .toHaveCount(0);
    await expect.poll(async () => page.evaluate(() => {
      const el = document.activeElement;
      if (!el || !el.closest?.('.casualties-chart')) return 'none';
      return getComputedStyle(el).outlineStyle;
    })).toBe('none');

    await page.getByRole('button', { name: 'Open in the story' }).click();
    await expect(page).toHaveURL(/#\/explore\/[a-z0-9-]+$/);
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

    await expect(page).toHaveURL(/#\/explore\/[a-z0-9-]+$/);
    await expect(page.locator('.event-card-title').first()).toBeVisible();
  });

  test('troop years line up with campaign years and do not overflow', async ({ page }) => {
    const yearTicks = (region) => region
      .locator('.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value')
      .evaluateAll((els) => els.map((el) => ({
        year: el.textContent.trim(),
        x: Math.round(el.getBoundingClientRect().x),
      })));

    const assertAligned = async () => {
      const troops = page.getByRole('region', { name: 'American Troops Furnished by Year Chart' });
      const campaigns = page.getByRole('region', { name: 'Military Campaigns Timeline' });
      await troops.scrollIntoViewIfNeeded();
      await expect(troops.locator('.recharts-area-curve').first()).toBeVisible();
      await campaigns.scrollIntoViewIfNeeded();
      await expect(campaigns.locator('.recharts-bar-rectangle').first()).toBeVisible();

      const troopTicks = await yearTicks(troops);
      const campaignTicks = await yearTicks(campaigns);
      const campaignByYear = Object.fromEntries(campaignTicks.map((t) => [t.year, t.x]));

      expect(troopTicks.map((t) => t.year), 'troop chart is missing year ticks').toEqual(
        expect.arrayContaining(['1775', '1781']),
      );

      const drift = troopTicks
        .filter((t) => campaignByYear[t.year] != null)
        .map((t) => ({ year: t.year, dx: Math.abs(t.x - campaignByYear[t.year]) }))
        .filter((t) => t.dx > 4);
      expect(drift, 'year ticks should share an x position').toEqual([]);

      const overflow = await page.locator('.data-stack--shared-time').evaluate((stack) => {
        const view = stack.closest('.data-view-container') ?? stack;
        const limit = view.getBoundingClientRect().right;
        return Math.max(
          0,
          ...[stack, ...stack.querySelectorAll('.chart-container, .recharts-wrapper')].map((n) => (
            Math.round(n.getBoundingClientRect().right - limit)
          )),
        );
      });
      expect(overflow, 'aligned charts overflow the data column').toBeLessThanOrEqual(1);
    };

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.data-stack--shared-time')).toBeVisible();
    await expect(page.locator('.data-group').first().locator('.data-grid')).toHaveCount(0);
    await assertAligned();

    await page.setViewportSize({ width: 390, height: 844 });
    await assertAligned();
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
  // Geometry is only meaningful once the entry animations have run: the card
  // arrives at scale 0.95 and the charts slide up 20px, and a rect or a
  // scrollHeight read during either is off by exactly that much.
  const settled = (page) => expect
    .poll(() => page.evaluate(() => document
      .getAnimations()
      .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity)
      .length), { timeout: 10_000 })
    .toBe(0);

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

  // The measure is a property of the paragraphs, not the card. Capping and
  // centring the whole card left the image, the stats table and the badges in
  // a narrow column with parchment on both sides — a wider panel nothing used.
  test('the card fills the panel; only the prose is capped', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Battle of Bunker Hill' })).toBeVisible();
    await settled(page);

    const m = await page.evaluate(() => {
      const box = (s) => document.querySelector(s).getBoundingClientRect();
      const panel = document.querySelector('.desktop-event-card');
      const card = box('.event-card-fixed');
      const padding = getComputedStyle(panel);
      return {
        // clientWidth leaves out the scrollbar gutter the panel reserves.
        panelInner: panel.clientWidth - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight),
        card: card.width,
        image: box('.event-card-image').width,
        table: box('.event-card-stats-table').width,
        description: box('.event-card-description').width,
      };
    });
    // Card, image and table span the panel's content box.
    expect(m.card).toBeGreaterThanOrEqual(m.panelInner - 2);
    expect(m.image).toBeGreaterThanOrEqual(m.card - 2);
    expect(m.table).toBeGreaterThanOrEqual(m.card - 2);
    // The paragraph alone stops short, for line length.
    expect(m.description).toBeLessThan(m.card * 0.85);
  });

  // An interlude is mostly chart, and the compact charts were fixed at 200 or
  // 240px whatever the panel — a strip across the middle of 1200px of parchment.
  // They take a share of the viewport height above the breakpoint; below it,
  // where there is no room to spend, they are exactly what they were.
  for (const [width, height, kind, slug, minChart, maxChart] of [
    [2560, 1440, 'a single chart', 'declaration-of-independence', 450, 600],
    [2560, 1440, 'a stacked pair', 'siege-of-yorktown', 300, 400],
    [1440, 900, 'a single chart, unchanged below the breakpoint', 'declaration-of-independence', 200, 200],
  ]) {
    test(`${width}x${height}: ${kind} grows with the panel`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(`${baseUrl}#/explore/${slug}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.event-card-title')).toBeVisible();
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('.data-interlude-card')).toBeVisible();
      await settled(page);

      const m = await page.evaluate(() => {
        const panel = document.querySelector('.desktop-event-card');
        const card = document.querySelector('.data-interlude-card');
        return {
          charts: [...card.querySelectorAll('.recharts-responsive-container')]
            .map((c) => Math.round(c.getBoundingClientRect().height)),
          fits: card.scrollHeight <= panel.clientHeight,
        };
      });
      expect(m.charts.length).toBeGreaterThan(0);
      for (const h of m.charts) {
        expect(h, 'chart height').toBeGreaterThanOrEqual(minChart);
        expect(h, 'chart height').toBeLessThanOrEqual(maxChart);
      }
      // Growing the chart must not push the card past the panel.
      if (width >= 1600) expect(m.fits, 'the card should not need to scroll').toBe(true);
    });
  }

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

test.describe('Map markers stay clickable', () => {
  // The active marker's pulse ring is decorative and 8px wider than the marker
  // on every side, and it had no `pointer-events: none`, so its overhang was
  // the topmost thing in that band and took clicks aimed at whatever sat
  // behind it. Across seven events it was covering the centre of 17 other
  // markers, 8 of which nothing else was covering — Lexington and Concord and
  // Bunker Hill among them.
  //
  // The assertion is deliberately about decorative elements only. Markers
  // genuinely overlap each other around Boston and New York, and the active
  // one is drawn on top by design; that is z-ordering between two real
  // controls, not a bug, and 45 centres are still covered that way. A
  // decoration taking a click is always a bug.
  const DECORATIVE = '.marker-pulse-ring, .colony-label, .trail-year-marker, .period-map-label';

  for (const id of [1, 5, 16, 110]) {
    test(`no decoration takes a marker's click at event ${id}`, async ({ page }) => {
      await page.goto(`${baseUrl}#/explore/${id}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.custom-marker [role="button"]').first()).toBeVisible();
      await expect(page.locator('.marker-pulse-ring')).toBeVisible();

      const stolen = await page.evaluate((decorative) => {
        const out = [];
        for (const marker of document.querySelectorAll('.custom-marker [role="button"]')) {
          const box = marker.getBoundingClientRect();
          const hit = document.elementFromPoint(
            box.left + box.width / 2,
            box.top + box.height / 2,
          );
          if (!hit || hit === marker || marker.contains(hit)) continue;
          // Covered by another marker: legitimate. Covered by a decoration: not.
          if (!hit.closest(decorative)) continue;
          out.push(`${marker.getAttribute('aria-label')} blocked by ${hit.closest(decorative).className}`);
        }
        return out;
      }, DECORATIVE);

      expect(stolen, 'markers whose click a decorative element takes').toEqual([]);
    });
  }

  test('the pulse ring is transparent to the pointer', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.marker-pulse-ring')).toBeVisible();
    expect(
      await page.locator('.marker-pulse-ring').evaluate((el) => getComputedStyle(el).pointerEvents),
    ).toBe('none');
  });
});
