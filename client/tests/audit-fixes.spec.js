import {
  test,
  expect,
  baseUrl,
  cardTitle as title,
  openEvent,
} from './helpers.js';

test.describe('The current event is always on the map', () => {
  // The map read its active event from the filtered marker list. A preset that
  // hid the current event's type left no active marker, flew the map to the
  // default centre and flipped the cartouche back to "The British Colonies".
  test('a filter that hides the current type keeps its marker and cartouche', async ({ page }) => {
    await openEvent(page, 'siege-of-yorktown');
    const cartouche = page.locator('.cartouche-title');
    await expect(cartouche).toHaveText('The United States of America');

    await page.locator('.filter-toggle-btn').click();
    await page.getByRole('button', { name: /Political Milestones/ }).click();
    await page.waitForTimeout(800);

    await expect(page.locator('.marker-pulse-ring')).toHaveCount(1);
    await expect(cartouche).toHaveText('The United States of America');
    await expect(page.locator('.custom-marker [role="button"][aria-label^="Siege of Yorktown"]')).toBeVisible();
  });
});

test.describe('Keyboard shortcuts stay out of the way', () => {
  test('Space presses the focused button instead of starting playback', async ({ page }) => {
    await openEvent(page, 'battle-of-bunker-hill');
    const before = await title(page).textContent();

    await page.locator('.event-card-nav-btn', { hasText: 'Next' }).focus();
    await page.keyboard.press(' ');
    await expect(title(page)).not.toHaveText(before);
    await expect(page.locator('.playback-btn')).toHaveText(/Play/);

    await page.locator('.filter-toggle-btn').focus();
    await page.keyboard.press(' ');
    await expect(page.locator('.filters-panel')).toBeVisible();
    await expect(page.locator('.playback-btn')).toHaveText(/Play/);
  });

  test('Space with nothing interactive focused still toggles playback', async ({ page }) => {
    await openEvent(page, 'battle-of-bunker-hill');
    await page.locator('#main-content').focus();
    await page.keyboard.press(' ');
    await expect(page.locator('.playback-btn')).toHaveText(/Pause/);
    await page.keyboard.press(' ');
    await expect(page.locator('.playback-btn')).toHaveText(/Play/);
  });

  test('chords with a modifier are left to the browser', async ({ page }) => {
    await openEvent(page, 'boston-tea-party');
    const before = await title(page).textContent();

    await page.keyboard.press('Meta+c');
    await expect(page.locator('.scrollytelling-view')).not.toHaveClass(/view-mode-cards/);

    await page.keyboard.press('Alt+ArrowRight');
    await page.keyboard.press('Control+ArrowRight');
    await page.waitForTimeout(600);
    await expect(title(page)).toHaveText(before);

    await page.keyboard.press('Meta+2');
    await page.waitForTimeout(600);
    await expect(page.locator('.data-view')).toHaveCount(0);

    const theme = await page.evaluate(() => document.body.className);
    await page.keyboard.press('Meta+d');
    expect(await page.evaluate(() => document.body.className)).toBe(theme);
  });

  test('the shortcuts dialog owns the keyboard while open', async ({ page }) => {
    await openEvent(page, 'boston-tea-party');
    const before = await title(page).textContent();

    await page.keyboard.press('?');
    const dialog = page.locator('.shortcuts-overlay');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('d');
    await page.keyboard.press('2');
    await page.waitForTimeout(600);
    await expect(title(page)).toHaveText(before);
    await expect(page.locator('.data-view')).toHaveCount(0);
    expect(await page.evaluate(() => document.body.className)).toBe('light-mode');

    // Space on the focused Close button closes the dialog; it does not play.
    await expect(page.locator('.shortcuts-close')).toBeFocused();
    await page.keyboard.press(' ');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('.playback-btn')).toHaveText(/Play/);
  });
});

test.describe('Cards focus', () => {
  // React 19 treats inert="" as false and drops it; the hidden map's controls
  // stayed in the tab order.
  test('the hidden map is inert', async ({ page }) => {
    await openEvent(page, 'boston-tea-party');
    await page.keyboard.press('c');
    await expect(page.locator('.scrollytelling-view')).toHaveClass(/view-mode-cards/);
    expect(await page.locator('.scrolly-map-container').evaluate((el) => el.inert)).toBe(true);
    await page.keyboard.press('c');
    expect(await page.locator('.scrolly-map-container').evaluate((el) => el.inert)).toBe(false);
  });
});

test.describe('Coming back to Explore', () => {
  test('the Explore tab returns to the event the reader left', async ({ page }) => {
    await openEvent(page, 'siege-of-yorktown');
    await page.locator('.view-toggle button', { hasText: 'Data' }).click();
    await expect(page.locator('.data-view')).toBeVisible();

    await page.locator('.view-toggle button', { hasText: 'Explore' }).click();
    await expect(title(page)).toHaveText('Siege of Yorktown');
    expect(await page.evaluate(() => location.hash)).toBe('#/explore/siege-of-yorktown');
  });

  test('the 1 key does the same', async ({ page }) => {
    await openEvent(page, 'british-surrender-at-saratoga');
    await expect(title(page)).toHaveText(/Saratoga/);
    await page.keyboard.press('2');
    await expect(page.locator('.data-view')).toBeVisible();
    await page.keyboard.press('1');
    await expect(title(page)).toHaveText(/Saratoga/);
  });

  test('pressing Explore while on Explore adds no history entry', async ({ page }) => {
    await openEvent(page, 'siege-of-yorktown');
    const length = await page.evaluate(() => history.length);
    await page.locator('.view-toggle button', { hasText: 'Explore' }).click();
    await page.keyboard.press('1');
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => history.length)).toBe(length);
    expect(await page.evaluate(() => location.hash)).toBe('#/explore/siege-of-yorktown');
  });

  test('Start Over forgets the place', async ({ page }) => {
    await openEvent(page, 'washington-resigns-commission');
    await page.locator('.story-end button', { hasText: 'Start Over' }).click();
    await expect(page.locator('.welcome-screen')).toBeVisible();
    await page.locator('.welcome-atlas-action.primary').click();
    await expect(title(page)).toHaveText('Stamp Act Congress Meets');
  });
});

test.describe('End of timeline', () => {
  test('the end card is painted, clear of the story, and Play is disabled', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openEvent(page, 'washington-resigns-commission');
    const end = page.locator('.story-end');
    await expect(end).toBeVisible();

    const m = await page.evaluate(() => {
      const card = document.querySelector('.story-end');
      const a = card.getBoundingClientRect();
      const b = document.querySelector('.desktop-event-card').getBoundingClientRect();
      const overlaps = !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
      return { overlaps, alpha: getComputedStyle(card).backgroundColor };
    });
    expect(m.overlaps, 'the end card should not cover the story panel').toBe(false);
    // --color-white was never defined; the card was a transparent box.
    expect(m.alpha).not.toMatch(/rgba\(.*, 0\)$/);
    await expect(page.locator('.playback-btn')).toBeDisabled();
  });
});

test.describe('The Full Ledger', () => {
  test('the casualties chart puts its scale first and says when it scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openEvent(page, 'siege-of-yorktown');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.data-interlude-card')).toBeVisible();
    await page.waitForTimeout(800);

    const frame = page.locator('.chart-scroll-frame--y');
    await expect(frame).toHaveClass(/has-more/);

    const m = await frame.evaluate((el) => {
      const axis = el.querySelector('.recharts-xAxis').getBoundingClientRect();
      const bar = el.querySelector('.recharts-bar-rectangle').getBoundingClientRect();
      return { axisAboveBars: axis.bottom <= bar.top + 1, scrolls: el.scrollHeight > el.clientHeight };
    });
    expect(m.scrolls).toBe(true);
    expect(m.axisAboveBars, 'the axis should sit at the top of the plot').toBe(true);

    await frame.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await expect(frame).not.toHaveClass(/has-more/);
  });

  test('a short list has no scroll affordance', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openEvent(page, 'battle-of-bunker-hill');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.data-interlude-card')).toBeVisible();
    await page.waitForTimeout(800);
    await expect(page.locator('.chart-scroll-frame--y')).not.toHaveClass(/has-more/);
  });

  test('compact campaign labels stay on one line', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openEvent(page, 'siege-of-yorktown');
    await page.keyboard.press('ArrowRight');
    const campaigns = page.getByRole('region', { name: 'Military Campaigns Timeline' });
    await expect(campaigns).toBeVisible();
    await page.waitForTimeout(800);
    const multiLine = await campaigns.locator('.recharts-yAxis .recharts-cartesian-axis-tick')
      .evaluateAll((ticks) => ticks.filter((t) => t.querySelectorAll('tspan').length > 1).length);
    expect(multiLine).toBe(0);
  });
});

test.describe('Data view', () => {
  test('the casualties chart has a scale at both the head and the foot', async ({ page }) => {
    await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.casualties-chart')).toBeVisible();
    await page.waitForTimeout(800);
    const m = await page.locator('.casualties-chart').evaluate((chart) => {
      const axes = [...chart.querySelectorAll('.recharts-xAxis')].map((a) => a.getBoundingClientRect());
      const bars = [...chart.querySelectorAll('.recharts-bar-rectangle')].map((b) => b.getBoundingClientRect());
      const top = Math.min(...bars.map((b) => b.top));
      const bottom = Math.max(...bars.map((b) => b.bottom));
      return {
        count: axes.length,
        above: axes.some((a) => a.bottom <= top + 1),
        below: axes.some((a) => a.top >= bottom - 1),
        tickLines: axes.map((a, i) => chart.querySelectorAll('.recharts-xAxis')[i].querySelectorAll('.recharts-cartesian-axis-tick-line').length),
      };
    });
    expect(m.count).toBe(2);
    expect(m.above).toBe(true);
    expect(m.below).toBe(true);
    for (const n of m.tickLines) expect(n, 'each axis should have ticks').toBeGreaterThan(2);
  });
});

test.describe('Search', () => {
  test('finds by several words and by year', async ({ page }) => {
    await openEvent(page, 'boston-tea-party');
    const input = page.locator('.search-input');
    const results = page.locator('.search-result-item');

    await input.fill('lexington concord');
    await expect(results.first()).toContainText('Lexington and Concord');

    await input.fill('yorktown 1781');
    await expect(results.first()).toContainText('Siege of Yorktown');

    await input.fill('1777');
    await expect(results).not.toHaveCount(0);
    for (const year of await page.locator('.search-result-year').allTextContents()) expect(year).toBe('1777');
  });
});

test.describe('Phones', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('a 375x667 welcome shows its figures above the footer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.welcome-atlas-legend')).toBeVisible();
    await page.waitForTimeout(800);

    const m = await page.evaluate(() => {
      const footer = document.querySelector('.welcome-atlas-footer').getBoundingClientRect();
      const stats = [...document.querySelectorAll('.welcome-atlas-stat')].map((s) => s.getBoundingClientRect().bottom);
      const glyph = getComputedStyle(document.querySelector('.welcome-atlas-help span')).fontSize;
      const eyebrow = document.querySelector('.welcome-atlas-eyebrow').getBoundingClientRect();
      const theme = document.querySelector('.welcome-atlas-theme').getBoundingClientRect();
      return {
        statsClear: stats.every((b) => b <= footer.top + 1),
        footerOnScreen: footer.bottom <= window.innerHeight + 1,
        glyph: parseFloat(glyph),
        eyebrowClearOfToggle: eyebrow.right <= theme.left,
      };
    });
    expect(m.statsClear).toBe(true);
    expect(m.footerOnScreen).toBe(true);
    expect(m.glyph).toBeGreaterThan(0);
    expect(m.eyebrowClearOfToggle).toBe(true);
  });

  test('the header title is not truncated at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await openEvent(page, 'boston-tea-party');
    const truncated = await page.locator('.app-header h1').evaluate((h1) => h1.scrollWidth > h1.clientWidth);
    expect(truncated).toBe(false);
  });

  test('Pause stays in the sheet header while the story plays', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await openEvent(page, 'boston-tea-party');
    await page.getByRole('button', { name: 'Story controls' }).tap();
    await page.locator('.sheet-controls-panel .playback-btn').tap();

    const pause = page.getByRole('button', { name: 'Pause playback' });
    await expect(pause).toBeVisible();
    // The panel closes at the next event; Pause must not go with it.
    await expect(title(page)).not.toHaveText('Boston Tea Party', { timeout: 8_000 });
    await expect(pause).toBeVisible();

    await pause.tap();
    const held = await title(page).textContent();
    await page.waitForTimeout(4500);
    await expect(title(page)).toHaveText(held);
    await expect(page.getByRole('button', { name: 'Story controls' })).toBeVisible();
  });

  // Lifting the active marker clear of the sheet moves the map centre south,
  // and the seaboard frame's 27°N floor refused the pan for anything on the
  // southern seaboard: Savannah came to rest 198px below the top of the sheet,
  // Charleston 161px, Pensacola 286px — each hidden behind the card describing
  // it. The phone frame now reaches 20°N, where the land silhouette is clipped.
  for (const [slug, name] of [
    ['siege-of-savannah', 'Siege of Savannah'],
    ['siege-of-charleston', 'Siege of Charleston'],
    ['battle-of-eutaw-springs', 'Battle of Eutaw Springs'],
    ['spanish-gulf-campaign-culminates-at-pensacola', 'Spanish Gulf Campaign Culminates at Pensacola'],
    // A northern control: the fix must not cost the events that already worked.
    ['battle-of-bunker-hill', 'Battle of Bunker Hill'],
  ]) {
    test(`${name} rests on the visible strip, not behind the sheet`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await openEvent(page, slug);

      const marker = page.getByRole('button', { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(,|$)`) });
      await expect(marker).toBeVisible();

      const placement = await page.evaluate((label) => {
        const map = document.querySelector('.leaflet-container').getBoundingClientRect();
        const sheet = document.querySelector('.bottom-sheet').getBoundingClientRect();
        const el = [...document.querySelectorAll('.custom-marker [role="button"]')]
          .find((node) => (node.getAttribute('aria-label') || '').startsWith(label));
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          y: Math.round(rect.top + rect.height / 2),
          x: Math.round(rect.left + rect.width / 2),
          top: Math.round(map.top),
          bottom: Math.round(sheet.top),
          left: Math.round(map.left),
          right: Math.round(map.right),
        };
      }, name);

      expect(placement, 'the active marker was never drawn').not.toBeNull();
      const { x, y, top, bottom, left, right } = placement;
      expect(y, `${y} is above the map's top edge (${top})`).toBeGreaterThan(top);
      expect(y, `${y} is behind the sheet, which starts at ${bottom}`).toBeLessThan(bottom);
      expect(x).toBeGreaterThan(left);
      expect(x).toBeLessThan(right);
    });
  }
});
