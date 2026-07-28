import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const baseUrl = globalThis.process?.env.AMREVIZ_TEST_URL || 'http://localhost:5174/';

// Wait out the card's entry transition before scanning. Framer Motion animates
// opacity inline, and axe blends a half-faded badge against the parchment
// behind it and reports a contrast failure that no user ever sees. Without
// this the explore scans fail intermittently, on timing alone.
async function settleCardAnimation(page, selector) {
  await expect
    .poll(
      () =>
        page.locator(selector).evaluate((el) => {
          const own = Number(getComputedStyle(el).opacity);
          const running = el
            .getAnimations({ subtree: true })
            // The active marker's pulse ring loops forever by design.
            .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity);
          return own === 1 && running.length === 0;
        }),
      { timeout: 10_000, message: `${selector} never finished animating` },
    )
    .toBe(true);
}

// Serious/critical axe violations, formatted for a readable assertion message.
async function seriousA11yViolations(page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations
    .filter(({ impact }) => impact === 'serious' || impact === 'critical')
    .map(({ id, impact, nodes }) => `${id} (${impact}) on ${nodes[0].target.join(' ')}`);
}

test.describe('AmReViz UX & Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('region', { name: 'The American Revolution' })).toBeVisible();
  });

  test('welcome screen is accessible and exposes both entry points', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'The American Revolution' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Begin exploring' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open the data' })).toBeVisible();

    expect(await seriousA11yViolations(page)).toEqual([]);
  });

  // The welcome screen was the only view under axe, so violations in explore,
  // cards focus and the data view all shipped green.
  test('explore view is accessible in both map and cards focus mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Begin exploring' }).click();
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await settleCardAnimation(page, '.desktop-event-card');
    expect(await seriousA11yViolations(page), 'explore / map mode').toEqual([]);

    await page.keyboard.press('c');
    await expect(page.locator('.view-mode-cards')).toBeVisible();
    await settleCardAnimation(page, '.view-mode-cards');
    expect(await seriousA11yViolations(page), 'explore / cards focus mode').toEqual([]);
  });

  test('data view is accessible', async ({ page }) => {
    await page.getByRole('button', { name: 'Open the data' }).click();
    await expect(page.getByRole('heading', { name: 'War in Numbers' })).toBeVisible();
    expect(await seriousA11yViolations(page)).toEqual([]);
  });

  test('mobile explore view is accessible and the sheet handle is keyboard reachable', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Begin exploring' }).click();
    await expect(page.locator('.bottom-sheet')).toBeVisible();
    await settleCardAnimation(page, '.bottom-sheet');
    expect(await seriousA11yViolations(page)).toEqual([]);

    // The handle is a real button, so it can be focused and operated by keyboard.
    const handle = page.getByRole('button', { name: 'Expand event details' });
    await handle.focus();
    await expect(handle).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Collapse event details' })).toBeVisible();

    // Only one copy of the card and the search field exists on mobile.
    await expect(page.locator('.event-card-fixed')).toHaveCount(1);
    await expect(page.getByRole('combobox', { name: 'Search historical events' })).toHaveCount(1);
  });

  // The treaty is signed in Paris, outside the seaboard frame the map is
  // normally locked to; maxBounds used to clamp the pan and strand the marker.
  test('the story flies to Paris for the treaty', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/125`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Treaty of Paris Signed' })).toBeVisible();

    const parisMarker = page.getByRole('button', { name: /^Treaty of Paris Signed, 1783$/ });
    await expect(parisMarker).toBeVisible();

    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const map = document.querySelector('.leaflet-container')?.getBoundingClientRect();
            const marker = [...document.querySelectorAll('.custom-marker [role="button"]')]
              .find((el) => el.getAttribute('aria-label') === 'Treaty of Paris Signed, 1783')
              ?.getBoundingClientRect();
            if (!map || !marker) return false;
            return marker.left >= map.left && marker.right <= map.right &&
                   marker.top >= map.top && marker.bottom <= map.bottom;
          }),
        { timeout: 15_000, message: 'Paris marker never came to rest inside the map viewport' },
      )
      .toBe(true);
  });

  // The point of widening the frame is that both shores are on screen at once:
  // the treaty is a decision taken an ocean away from the war it ended.
  test('the crossing frame shows the European coast, not blank parchment', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/125`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Treaty of Paris Signed' })).toBeVisible();

    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const map = document.querySelector('.leaflet-container')?.getBoundingClientRect();
            const coast = document.querySelector('.europe-coast')?.getBoundingClientRect();
            if (!map || !coast || !coast.width) return false;
            // Not merely mounted — actually inside the viewport, with real extent.
            return coast.left < map.right && coast.right > map.left &&
                   coast.top < map.bottom && coast.bottom > map.top &&
                   coast.width > map.width * 0.05;
          }),
        { timeout: 15_000, message: 'European coastline never came into the crossing frame' },
      )
      .toBe(true);

    // The American seaboard has to stay in frame alongside it.
    await expect(page.getByRole('button', { name: /^Siege of Yorktown, 1781$/ })).toBeVisible();
  });

  // Events are not a march: nobody travelled Savannah → Charleston → Camden in
  // one line, and across the ocean the connector degenerated into a rubber band.
  test('no connecting line is drawn between consecutive events', async ({ page }) => {
    for (const id of [16, 125]) {
      await page.goto(`${baseUrl}#/explore/${id}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.leaflet-container')).toBeVisible();
      // The graticule dashes at "2 6"; the old event trail used "6, 6".
      const trailSegments = await page
        .locator('path[stroke-dasharray="6, 6"], path[stroke-dasharray="6,6"]')
        .count();
      expect(trailSegments, `event ${id}`).toBe(0);
    }
  });

  // Pensacola is west of the seaboard frame but very much not overseas. Testing
  // "outside the rectangle" instead of "across the Atlantic" flew the map to an
  // empty patch of ocean that contained neither the marker nor the coast.
  test('the Gulf campaign stays in the seaboard frame', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/121`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Pensacola/ })).toBeVisible();

    const marker = page.getByRole('button', { name: /Pensacola, 1781$/ });
    await expect(marker).toBeVisible();

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const map = document.querySelector('.leaflet-container')?.getBoundingClientRect();
          const el = [...document.querySelectorAll('.custom-marker [role="button"]')]
            .find((n) => /Pensacola, 1781$/.test(n.getAttribute('aria-label') || ''));
          const r = el?.getBoundingClientRect();
          if (!map || !r) return false;
          return r.left >= map.left && r.right <= map.right &&
                 r.top >= map.top && r.bottom <= map.bottom;
        }),
        { timeout: 15_000, message: 'Pensacola marker never came to rest inside the map' },
      )
      .toBe(true);

    // Still the close-in chart, so the water detail is drawn.
    await expect(page.locator('.europe-coast')).toHaveCount(0);
  });

  test('the diplomatic front in London and Paris is part of the story', async ({ page }) => {
    for (const [id, heading, place] of [
      [126, 'Proclamation of Rebellion', 'London'],
      [127, 'Franklin Arrives in France', 'Passy'],
      [128, 'Treaty of Alliance Signed with France', 'Paris'],
      [129, 'The Commons Votes Against the War', 'London'],
    ]) {
      await page.goto(`${baseUrl}#/explore/${id}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
      await expect(page.locator('.desktop-event-card')).toContainText(place);
      // Each one is across the Atlantic, so each one widens the frame.
      await expect(page.locator('.europe-coast')).toHaveCount(1);
    }
  });

  test('desktop explore view keeps the vertical split and keyboard-ready markers', async ({ page }) => {
    await page.getByRole('button', { name: 'Begin exploring' }).click();
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.locator('.desktop-event-card')).toBeVisible();

    const split = await page.evaluate(() => {
      const map = document.querySelector('.map-container');
      const panel = document.querySelector('.desktop-event-card');
      const mapRect = map?.getBoundingClientRect();
      const panelRect = panel?.getBoundingClientRect();

      return {
        mapWidth: mapRect?.width ?? 0,
        panelWidth: panelRect?.width ?? 0,
        viewportWidth: window.innerWidth,
      };
    });

    expect(split.mapWidth).toBeGreaterThan(split.viewportWidth * 0.5);
    expect(split.panelWidth).toBeGreaterThan(split.viewportWidth * 0.3);
    expect(split.mapWidth + split.panelWidth).toBeCloseTo(split.viewportWidth, 0);

    const markers = page.locator('.custom-marker [role="button"]');
    expect(await markers.count()).toBeGreaterThan(0);

    for (let index = 0; index < Math.min(await markers.count(), 5); index += 1) {
      await expect(markers.nth(index)).toHaveAttribute('tabindex', '0');
      await expect(markers.nth(index)).toHaveAttribute('role', 'button');
    }
  });

  test('search distinguishes the 1775 capture from the 1777 fall of Ticonderoga', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Begin exploring' }).click();

    const searchInput = page.getByRole('combobox', { name: 'Search historical events' });
    await searchInput.fill('Ticonderoga');

    const options = page.getByRole('option');
    const capture = options.filter({ hasText: 'Capture of Fort Ticonderoga' });
    const fall = options.filter({ hasText: 'Fall of Fort Ticonderoga' });
    await expect(capture).toHaveCount(1);
    await expect(capture).toContainText('1775');
    await expect(fall).toHaveCount(1);
    await expect(fall).toContainText('1777');

    await searchInput.press('ArrowDown');
    await searchInput.press('ArrowDown');
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/#\/explore\/109$/);
    await expect(page.getByRole('heading', { name: 'Fall of Fort Ticonderoga' })).toBeVisible();
    await expect(page.getByText('July 2, 1777 – July 6, 1777')).toBeVisible();
  });

  test('data view shows sourced totals and updates the battle comparison', async ({ page }) => {
    await page.getByRole('button', { name: 'Open the data' }).click();

    await expect(page.getByRole('heading', { name: 'War in Numbers' })).toBeVisible();
    await expect(page.getByText('217,000')).toBeVisible();
    await expect(page.getByText('4,435')).toBeVisible();
    await expect(page.getByText('6,188')).toBeVisible();

    const battleSelect = page.getByRole('combobox', { name: 'Select a battle to compare' });
    await battleSelect.scrollIntoViewIfNeeded();
    await expect(battleSelect).toBeInViewport();
    await battleSelect.selectOption({ label: 'Fall of Fort Ticonderoga (1777)' });

    const comparison = page.getByRole('region', { name: 'Battle Comparison Tool' });
    await expect(comparison).toContainText('July 2, 1777');
    await expect(comparison).toContainText('3,000');
    await expect(comparison).toContainText('7,800');
    await expect(comparison).toContainText('Fort Ticonderoga (1777)');
  });

  test('mobile explore view uses a bounded, expandable bottom sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Begin exploring' }).click();

    const sheet = page.locator('.bottom-sheet');
    await expect(sheet).toBeVisible();
    await expect(page.locator('.desktop-event-card')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Expand event details' })).toBeVisible();

    await page.getByRole('button', { name: 'Expand event details' }).click();
    await expect(page.getByRole('button', { name: 'Collapse event details' })).toBeVisible();

    await expect
      .poll(() => sheet.evaluate((element) => element.getBoundingClientRect().top))
      .toBeLessThan(100);

    await page.getByRole('button', { name: 'Next event' }).click();
    await expect(page.getByRole('button', { name: 'Expand event details' })).toBeVisible();

    const layout = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      bodyOverflow: getComputedStyle(document.body).overflow,
    }));

    expect(layout.documentWidth).toBe(layout.viewportWidth);
    expect(layout.bodyOverflow).toBe('hidden');
  });
});
