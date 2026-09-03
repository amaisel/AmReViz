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

    // Only one copy of the card exists on mobile.
    await expect(page.locator('.event-card-fixed')).toHaveCount(1);

    // Search moved into the controls panel; one copy, once it is open.
    await page.getByRole('button', { name: 'Story controls' }).click();
    await expect(page.getByRole('combobox', { name: 'Search historical events' })).toHaveCount(1);
  });

  // The treaty is signed in Paris, outside the seaboard frame the map is
  // normally locked to; maxBounds used to clamp the pan and strand the marker.
  //
  // The `(,|$)` in these matchers rather than a bare `$`: a marker's accessible
  // name now ends with which side held the place, because the fill colour was
  // the only thing carrying that and a screen reader cannot see a fill. The
  // anchor still pins one marker — it is the year that disambiguates.
  test('the story flies to Paris for the treaty', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/125`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Treaty of Paris Signed' })).toBeVisible();

    const parisMarker = page.getByRole('button', { name: /^Treaty of Paris Signed, 1783(,|$)/ });
    await expect(parisMarker).toBeVisible();

    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const map = document.querySelector('.leaflet-container')?.getBoundingClientRect();
            const marker = [...document.querySelectorAll('.custom-marker [role="button"]')]
              .find((el) => /^Treaty of Paris Signed, 1783(,|$)/.test(el.getAttribute('aria-label') || ''))
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
    await expect(page.getByRole('button', { name: /^Siege of Yorktown, 1781(,|$)/ })).toBeVisible();
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

    const marker = page.getByRole('button', { name: /Pensacola, 1781(,|$)/ });
    await expect(marker).toBeVisible();

    await expect
      .poll(async () =>
        page.evaluate(() => {
          const map = document.querySelector('.leaflet-container')?.getBoundingClientRect();
          const el = [...document.querySelectorAll('.custom-marker [role="button"]')]
            .find((n) => /Pensacola, 1781(,|$)/.test(n.getAttribute('aria-label') || ''));
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

  // 88° of longitude cannot fit a 390px viewport: flyToBounds bottomed out on
  // the zoom floor, centred on open ocean, and left the marker a pixel past
  // the right edge with no land on screen at all.
  test('the overseas frame keeps its target on screen on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [id, label] of [[125, /Treaty of Paris Signed, 1783(,|$)/], [129, /Commons Votes Against the War, 1782(,|$)/]]) {
      await page.goto(`${baseUrl}#/explore/${id}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.leaflet-container')).toBeVisible();

      await expect
        .poll(
          async () =>
            page.evaluate((src) => {
              const re = new RegExp(src);
              const map = document.querySelector('.leaflet-container')?.getBoundingClientRect();
              const sheet = document.querySelector('.bottom-sheet')?.getBoundingClientRect();
              const el = [...document.querySelectorAll('.custom-marker [role="button"]')]
                .find((n) => re.test(n.getAttribute('aria-label') || ''));
              const r = el?.getBoundingClientRect();
              if (!map || !r) return false;
              const floor = sheet ? Math.min(sheet.top, map.bottom) : map.bottom;
              // Inside the map *and* above the bottom sheet that covers it.
              return r.left >= map.left && r.right <= map.right && r.top >= map.top && r.bottom <= floor;
            }, label.source),
          { timeout: 15_000, message: `event ${id} marker never rested in the visible strip` },
        )
        .toBe(true);

      // And it is standing on the European coast, not open water.
      await expect(page.locator('.europe-coast')).toHaveCount(1);
    }
  });

  // Every layer used to share one SVG under overlayPane, which made the pane
  // z-indexes decorative and left paint order equal to mount order. Toggling
  // dark mode remounts the base layers, which re-appended the opaque land fill
  // over the colony borders and erased every state line.
  test('colony borders survive a dark mode toggle and a zoom out', async ({ page }) => {
    await page.getByRole('button', { name: 'Begin exploring' }).click();
    await expect(page.locator('.leaflet-container')).toBeVisible();

    // Each vector group owns a renderer in its own pane.
    const panes = async () =>
      page.$$eval('svg.leaflet-zoom-animated', (nodes) =>
        nodes.map((n) => n.parentElement.className).sort());
    expect((await panes()).join(' ')).toContain('base-land');
    expect(await panes()).toHaveLength(4);

    // The borders must paint after the land fill that would otherwise hide them.
    const bordersOnTop = () =>
      page.evaluate(() => {
        const z = (sel) => {
          const svg = document.querySelector(sel);
          return svg ? Number(getComputedStyle(svg.parentElement).zIndex) : null;
        };
        const land = z('.leaflet-base-land-pane svg');
        const colonies = z('.leaflet-colonies-pane svg');
        const count = document.querySelectorAll('path.colony-boundary').length;
        return land != null && colonies != null && colonies > land && count > 0;
      });

    expect(await bordersOnTop(), 'light mode').toBe(true);
    await page.keyboard.press('d');
    await expect.poll(bordersOnTop, { message: 'after dark mode toggle' }).toBe(true);
    await page.locator('.leaflet-control-zoom-out').click();
    await expect.poll(bordersOnTop, { message: 'after zooming out' }).toBe(true);
    await page.keyboard.press('d');
    await expect.poll(bordersOnTop, { message: 'back in light mode' }).toBe(true);
  });

  test('left and right move the story; up and down do not', async ({ page }) => {
    await page.getByRole('button', { name: 'Begin exploring' }).click();
    await expect(page.locator('.leaflet-container')).toBeVisible();

    const counter = page.locator('.status-chip-counter');
    const index = async () => Number((await counter.textContent()).split('/')[0]);
    // Let the opening step settle; the first hop also writes the hash.
    await expect.poll(index).toBe(1);
    const start = await index();

    // Reversing direction needs the previous step to land first — pressing
    // right then left inside ~300ms drops the second press. See ROADMAP.md.
    await page.keyboard.press('ArrowRight');
    await expect.poll(index).toBe(start + 1);
    await page.waitForTimeout(400);
    await page.keyboard.press('ArrowLeft');
    await expect.poll(index).toBe(start);
    await page.waitForTimeout(400);

    // Vertical is for reading the card, so it must not move the story.
    for (const key of ['ArrowDown', 'ArrowDown', 'ArrowUp']) await page.keyboard.press(key);
    await page.waitForTimeout(700);
    expect(await index(), 'up/down must not navigate').toBe(start);
  });

  test('arrow keys scroll a long event card', async ({ page }) => {
    // A deep link to an entry long enough to overflow the panel.
    await page.goto(`${baseUrl}#/explore/16`, { waitUntil: 'domcontentloaded' });
    const card = page.locator('.desktop-event-card');
    await expect(card).toBeVisible();

    const overflows = await card.evaluate((el) => el.scrollHeight > el.clientHeight + 1);
    test.skip(!overflows, 'card fits the viewport at this size, nothing to scroll');

    expect(await card.evaluate((el) => el.scrollTop)).toBe(0);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => card.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  });

  test('mobile swipes left to advance and right to go back', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Begin exploring' }).click();
    await expect(page.locator('.bottom-sheet')).toBeVisible();

    const counter = page.locator('.status-chip-counter');
    const index = async () => Number((await counter.textContent()).split('/')[0]);
    const start = await index();

    // Swipes are read from raw touch events, so they have to be dispatched as
    // touches — mouse drags never reach the handler.
    const swipe = (fromX, toX) =>
      page.evaluate(([x1, x2]) => {
        const el = document.querySelector('.bottom-sheet');
        const y = el.getBoundingClientRect().top + 160;
        const touch = (x) => [new Touch({ identifier: 1, target: el, clientX: x, clientY: y })];
        el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: touch(x1), changedTouches: touch(x1) }));
        el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: touch(x2) }));
      }, [fromX, toX]);

    await swipe(300, 80);
    await expect.poll(index, { message: 'swipe left should advance' }).toBe(start + 1);

    // Same settle as the keyboard test: a reversal inside ~300ms is dropped.
    await page.waitForTimeout(400);
    await swipe(80, 300);
    await expect.poll(index, { message: 'swipe right should go back' }).toBe(start);

    // A vertical drag is a scroll, not a navigation.
    await page.evaluate(() => {
      const el = document.querySelector('.bottom-sheet');
      const r = el.getBoundingClientRect();
      const t = (y) => [new Touch({ identifier: 1, target: el, clientX: 195, clientY: y })];
      el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: t(r.top + 300), changedTouches: t(r.top + 300) }));
      el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: t(r.top + 60) }));
    });
    await page.waitForTimeout(600);
    expect(await index(), 'vertical swipe must not navigate').toBe(start);
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

    await expect(page).toHaveURL(/#\/explore\/fall-of-fort-ticonderoga$/);
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

  // The map lifts the active event above the sheet by panning north. That pan
  // is only possible while the viewport fits inside `easternSeaboardBounds`;
  // zoom out far enough and Leaflet cannot pan at all, so the lift is silently
  // dropped and the marker sinks toward the sheet. Both phone shapes, because
  // the failure scales with viewport height.
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 754, height: 1254 },
  ]) {
    test(`the active event sits in the map strip on a ${viewport.width}x${viewport.height} screen`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`${baseUrl}#/explore/110`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Battle of Oriskany' })).toBeVisible();

      const offset = () =>
        page.evaluate(() => {
          const sheetTop = document.querySelector('.bottom-sheet').getBoundingClientRect().top;
          const pulse = document.querySelector('.marker-pulse-ring');
          const icon = pulse?.closest('.leaflet-marker-icon');
          if (!icon) return null;
          const box = icon.getBoundingClientRect();
          const markerY = box.top + box.height / 2;
          // How far off the centre of the visible strip, as a share of it.
          return Math.abs(markerY - sheetTop / 2) / sheetTop;
        });

      // Measured at zoom 6: 0.10 here and 0.12 on the tall window. At zoom 5 the
      // same cases were 0.28 and 0.40.
      await expect.poll(offset, { timeout: 15_000 }).toBeLessThan(0.15);
    });
  }

  test('the hero image yields its space at peek and returns on expand', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // Event 9 carries a hero image; most events do not.
    await page.goto(`${baseUrl}#/explore/9`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Battle of Long Island' })).toBeVisible();

    const hero = page.locator('.bottom-sheet-content .event-card-image');
    await expect(hero).toBeHidden();

    await page.getByRole('button', { name: 'Expand event details' }).click();
    await expect(hero).toBeVisible();

    // The card's -4px top margin used to be absorbed by the control row's
    // bottom padding. With that row gone the image overhung into the header
    // instead, and its top sliver read as a stray dark line across the sheet.
    const overhang = await page.evaluate(() => {
      const content = document.querySelector('.bottom-sheet-content');
      const image = document.querySelector('.bottom-sheet-content .event-card-image');
      return content.getBoundingClientRect().top - image.getBoundingClientRect().top;
    });
    expect(overhang).toBeLessThanOrEqual(0);
  });

  // The drag handle is a full-width button inside a sheet that clips its
  // children, so an outward focus ring showed only as its bottom edge: a dark
  // full-width line across the card, on every mouse click, because the rule was
  // `button:focus` rather than `button:focus-visible`.
  test('clicking the sheet handle does not paint a focus ring across the card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}#/explore/9`, { waitUntil: 'domcontentloaded' });
    const handle = page.getByRole('button', { name: 'Expand event details' });
    await expect(handle).toBeVisible();

    await handle.click();
    await expect(page.getByRole('button', { name: 'Collapse event details' })).toBeVisible();

    const afterClick = await page
      .locator('.bottom-sheet-handle')
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(afterClick, 'a pointer click must not draw a focus ring').toBe('none');

    // A keyboard user still gets an indicator, but on the chevron rather than
    // the button: the button spans the sheet, so any ring on it is a full-width
    // rectangle, and the sheet's clip reduces that to a line.
    // Tabbed for real: Chrome only matches :focus-visible on a programmatic
    // focus() when the last input was a keyboard, and we just clicked.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('.bottom-sheet-handle')).toBeVisible();
    // One Tab is enough to make the keyboard the last input modality; walking
    // all the way to the handle would mean tabbing through every map marker.
    await page.keyboard.press('Tab');
    const afterKeyboard = await page.locator('.bottom-sheet-handle').evaluate(async (el) => {
      el.focus();
      // Let style recalc run: read in the same tick as focus() and the computed
      // outline is still the pre-focus one.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const chevron = el.querySelector('.bottom-sheet-chevron');
      return {
        button: getComputedStyle(el).outlineStyle,
        chevron: getComputedStyle(chevron).outlineStyle,
        chevronWidth: chevron.getBoundingClientRect().width,
        buttonWidth: el.getBoundingClientRect().width,
      };
    });
    expect(afterKeyboard.button, 'the full-width button must never be ringed').toBe('none');
    expect(afterKeyboard.chevron, 'keyboard focus must stay visible').not.toBe('none');
    // The indicator is a small glyph, not a band across the sheet.
    expect(afterKeyboard.chevronWidth).toBeLessThan(afterKeyboard.buttonWidth / 3);
  });

  // Touch is not the only way to swipe vertically: a trackpad in a narrow
  // window sends wheel events, and the wheel handler's "let the panel scroll
  // first" exemption listed only the desktop card, so on mobile a two-finger
  // scroll walked the timeline instead of reading the entry.
  test('a vertical wheel reads the card on mobile, it does not navigate', async ({ page }) => {
    // Narrow enough for the mobile layout, short enough that the entry actually
    // overflows — on a 754x1254 the whole card fits and there is no scrolling
    // left to prove.
    await page.setViewportSize({ width: 754, height: 700 });
    await page.goto(`${baseUrl}#/explore/9`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.bottom-sheet')).toBeVisible();
    await page.getByRole('button', { name: 'Expand event details' }).click();
    await expect(page.getByRole('button', { name: 'Collapse event details' })).toBeVisible();

    const counter = page.locator('.status-chip-counter');
    const index = async () => Number((await counter.textContent()).split('/')[0]);
    const start = await index();

    const content = page.locator('.bottom-sheet-content');
    await expect
      .poll(() => content.evaluate((el) => el.scrollHeight > el.clientHeight + 1))
      .toBe(true);
    await content.hover();
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(80);
    }

    expect(await index(), 'vertical wheel must not walk the timeline').toBe(start);
    expect(
      await content.evaluate((el) => el.scrollTop),
      'vertical wheel should scroll the entry',
    ).toBeGreaterThan(0);
  });

  // The sheet bounces once per session to advertise that it drags. That hint
  // fires on a 1s timer and used to animate back to peek unconditionally, so
  // expanding inside the first second left the sheet at peek with the chevron
  // and aria-label still claiming it was open.
  test('the first-load bounce hint does not undo an expand', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}#/explore/1`, { waitUntil: 'domcontentloaded' });

    const expand = page.getByRole('button', { name: 'Expand event details' });
    await expand.click();
    await expect(page.getByRole('button', { name: 'Collapse event details' })).toBeVisible();

    // Past the bounce's 1s timer and both of its animations.
    await page.waitForTimeout(2000);

    const top = await page
      .locator('.bottom-sheet')
      .evaluate((element) => element.getBoundingClientRect().top);
    expect(top).toBeLessThan(100);
  });

  test('story controls sit behind one button, not across the peek sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}#/explore/1`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.bottom-sheet')).toBeVisible();

    // Chrome above the card. It was 214px of a 464px sheet: a 60px handle plus
    // a 154px control row that wrapped to three lines.
    const chrome = await page.evaluate(() => {
      const sheet = document.querySelector('.bottom-sheet');
      const content = document.querySelector('.bottom-sheet-content');
      return content.getBoundingClientRect().top - sheet.getBoundingClientRect().top;
    });
    expect(chrome).toBeLessThan(80);

    // Everything that left the row is still reachable, one tap away.
    const toggle = page.getByRole('button', { name: 'Story controls' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Search historical events' })).toBeVisible();
    // Exact, or this also matches the "Major Battles" preset chip beside it.
    await expect(page.getByRole('button', { name: 'Battles', exact: true })).toBeVisible();
  });

  test('cards focus is desktop-only and a resize to mobile restores the map', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${baseUrl}#/explore/1`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Focus cards' }).click();
    await expect(page.locator('.scrollytelling-view.view-mode-cards')).toBeVisible();

    // Narrowing must not strand the map hidden with no control to bring it back.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.scrollytelling-view.view-mode-map')).toBeVisible();
    await expect(page.locator('.bottom-sheet')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Focus cards' })).toHaveCount(0);
  });

  // The point of the mobile layout work: place and narrative on screen at the
  // same time, in the default state, without the reader toggling anything.
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 375, height: 667 },
  ]) {
    test(`the map and the opening paragraph share a ${viewport.width}x${viewport.height} screen`, async ({ page }) => {
      await page.setViewportSize(viewport);
      // Event 9 is the binding case in the set: one of the 18 events that can
      // carry a hero image, and the longest description among them at 333
      // characters. Event 1 fits comfortably and proves nothing.
      await page.goto(`${baseUrl}#/explore/9`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Battle of Long Island' })).toBeVisible();
      await settleCardAnimation(page, '.bottom-sheet');

      const layout = await page.evaluate(() => {
        const sheet = document.querySelector('.bottom-sheet');
        const prose = [...document.querySelectorAll('.bottom-sheet-content p')]
          .filter((p) => p.textContent.trim().length > 60)[0];
        return {
          viewportHeight: window.innerHeight,
          mapStripHeight: sheet.getBoundingClientRect().top,
          proseBottom: prose ? prose.getBoundingClientRect().bottom : null,
        };
      });

      expect(layout.proseBottom).not.toBeNull();
      // Fully above the fold, not merely started.
      expect(layout.proseBottom).toBeLessThanOrEqual(layout.viewportHeight);
      // And the map is still a map, not a sliver.
      expect(layout.mapStripHeight / layout.viewportHeight).toBeGreaterThanOrEqual(0.4);
    });
  }

  test('a data interlude leads with its argument at peek', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Battle of Bunker Hill' })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('heading', { name: 'The Cost of Rebellion' })).toBeVisible();
    await settleCardAnimation(page, '.bottom-sheet');

    // The standfirst, deliberately not the chart. The chart clears a 390x844
    // by 4px but overflows a 375x667 by 94px, so asserting on it would be
    // wrong rather than merely flaky.
    const proseBottom = await page.evaluate(() => {
      const prose = [...document.querySelectorAll('.bottom-sheet-content p')]
        .filter((p) => p.textContent.trim().length > 60)[0];
      return prose ? prose.getBoundingClientRect().bottom : null;
    });

    expect(proseBottom).not.toBeNull();
    expect(proseBottom).toBeLessThanOrEqual(667);
  });
});
