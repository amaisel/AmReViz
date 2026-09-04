import {
  test,
  expect,
  baseUrl,
  cardTitle as title,
  openEvent,
} from './helpers.js';
import { battleData } from '../src/data/metrics.js';
import { events } from '../src/data/events.js';
import { interludes } from '../src/data/interludes.js';

test.describe('The current event is always on the map', () => {
  // The map read its active event from the filtered marker list. A preset that
  // hid the current event's type left no active marker, flew the map to the
  // default centre and flipped the cartouche back to "The British Colonies".
  //
  // Filters now narrow the story as well as the map, so the case has changed
  // shape: rather than staying on an event the filter excludes, the story
  // moves to the nearest one it keeps. What must hold either way is that the
  // event on screen is the event on the map.
  test('a filter that hides the current type leaves the story on the map', async ({ page }) => {
    await openEvent(page, 'siege-of-yorktown');
    const cartouche = page.locator('.cartouche-title');
    await expect(cartouche).toHaveText('The United States of America');

    await page.locator('.filter-toggle-btn').click();
    await page.getByRole('button', { name: /Political Milestones/ }).click();
    await page.waitForTimeout(800);

    // The story moved to a political event rather than being stranded.
    await expect(page.locator('.event-card-type-badge')).toHaveText(/Political/);
    const shown = (await title(page).textContent()).trim();

    // And that event is the one the map is marking.
    await expect(page.locator('.marker-pulse-ring')).toHaveCount(1);
    await expect(cartouche).toHaveText('The United States of America');
    await expect(
      page.locator(`.custom-marker [role="button"][aria-label^="${shown}"]`),
    ).toBeVisible();
  });

  // The safety net the case above used to test: whatever puts an event on
  // screen, the map marks it. Search reaches outside the filters, so this is
  // the path that can still ask the map for an event the filters exclude.
  test('an event found outside the filters is marked on the map', async ({ page }) => {
    await openEvent(page, 'declaration-of-independence');
    await page.locator('.filter-toggle-btn').click();
    await page.getByRole('button', { name: /Political Milestones/ }).click();
    await page.waitForTimeout(600);

    const search = page.getByRole('combobox', { name: 'Search historical events' });
    await search.click();
    await search.fill('Cowpens');
    await page.getByRole('option').first().click();

    await expect(title(page)).toHaveText('Battle of Cowpens');
    await expect(page.locator('.marker-pulse-ring')).toHaveCount(1);
    await expect(
      page.locator('.custom-marker [role="button"][aria-label^="Battle of Cowpens"]'),
    ).toBeVisible();
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

  // The takeaway promises "Click a row to compare it below", and the row is
  // mostly empty plot: on a square-root scale a small engagement draws a
  // sliver a few pixels wide. The chart reads its target from `activeIndex`,
  // which Recharts tracks from the pointer's category band rather than from
  // the ink, so the whole row works — this pins that, because a change to how
  // the click resolves its datum would leave the bars working and quietly
  // shrink the target to them.
  // Dragging the page under a finger is not a choice of row.
  test('a scroll across the rows selects nothing', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.battle-comparison')).toBeVisible();
    await page.waitForTimeout(1200);

    const chart = page.locator('.casualties-chart');
    await chart.locator('.recharts-bar-rectangle').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const y = await chart.evaluate((el) => {
      const first = el.querySelector('.recharts-bar-rectangle').getBoundingClientRect();
      return first.top + first.height / 2;
    });

    const select = page.locator('.battle-select');
    await select.selectOption('16');
    await page.mouse.move(400, y);
    await page.mouse.down();
    await page.mouse.move(400, y - 200, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    await expect(select, 'a drag across the chart selected a row').toHaveValue('16');
  });

  // The chart is ~1300px tall, so the panel a row updates is below the fold on
  // every viewport it is read in: the click worked and nothing moved where the
  // reader was looking.
  test('choosing a row brings the comparison into view', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.battle-comparison')).toBeVisible();
    await page.waitForTimeout(1200);

    const chart = page.locator('.casualties-chart');
    await chart.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const onScreen = () => page.locator('.battle-comparison').evaluate((el) => {
      const box = el.getBoundingClientRect();
      return box.top < window.innerHeight && box.bottom > 0;
    });

    const bar = chart.locator('.recharts-bar-rectangle').nth(6);
    await bar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    expect(await onScreen(), 'the panel should start out of view for this test').toBe(false);

    await bar.click({ force: true });
    await expect.poll(onScreen, {
      message: 'the comparison stayed off screen after a row was chosen',
      timeout: 5_000,
    }).toBe(true);
  });

  test('a click anywhere along a row selects that battle', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.battle-comparison')).toBeVisible();
    await page.waitForTimeout(1200);

    const chart = page.locator('.casualties-chart');

    const select = page.locator('.battle-select');
    // Everything is re-measured per click and the expected battle read from
    // the row itself: choosing one can bring the comparison into view, which
    // moves the chart, and a row that happens to be the battle already
    // selected would look like a click that did nothing.
    for (const fraction of [0.1, 0.4, 0.75, 0.95]) {
      // Seed a selection first: choosing through the dropdown scrolls it into
      // view, and anything measured before that is measured in the wrong place.
      await select.selectOption(String(battleData[0].id));
      await expect(select).toHaveValue(String(battleData[0].id));
      // Back to the chart, where a reader clicks from. The container, not a
      // bar: the bars are re-rendered when the selection changes.
      await chart.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);

      const here = await chart.evaluate((el) => {
        const bars = [...el.querySelectorAll('.recharts-bar-rectangle')];
        const surface = el.querySelector('.recharts-surface').getBoundingClientRect();
        const centres = [...el.querySelectorAll('.recharts-yAxis .recharts-cartesian-axis-tick')]
          .map((tick) => {
            const box = tick.getBoundingClientRect();
            return box.top + box.height / 2;
          });
        // A row that is on screen and is not the one already selected.
        const index = centres.findIndex((y, i) => i > 0 && y > 140 && y < window.innerHeight - 140);
        return index === -1 ? null : {
          index,
          y: centres[index],
          left: Math.min(...bars.map((b) => b.getBoundingClientRect().left)),
          right: surface.right,
        };
      });
      expect(here, 'no row was on screen to click').toBeTruthy();
      const expected = String(battleData[here.index].id);

      await page.mouse.click(here.left + (here.right - here.left) * fraction, here.y);
      await expect(
        select,
        `a click ${Math.round(fraction * 100)}% along the row did not select ${battleData[here.index].title}`,
      ).toHaveValue(expected);
    }
  });
});

test.describe('The shared year axis', () => {
  // Seven labels, `interval={0}` so Recharts drops none of them, and on a
  // phone about 200px of plot to put them in: 1775 through 1781 rendered as
  // one unbroken string of digits, overlapping by up to 9.6px at 360. The
  // alignment test above it passed throughout — it compared the two charts to
  // each other, and they were illegible in exactly the same way.
  // Year labels that share a baseline — an axis, in practice. Grouping by
  // baseline matters: the casualties chart stacks a year against every battle
  // row, one under another at the same x, and comparing those left-to-right
  // reads as a 22px overlap that no one can see.
  const axisRows = (page) => page.evaluate(() => {
    const rows = [];
    for (const svg of document.querySelectorAll('.recharts-surface')) {
      if (svg.closest('.recharts-legend-wrapper')) continue;
      const host = svg.closest('.chart-container, .interlude-chart-wrap');
      const title = host?.querySelector('.chart-title')?.textContent?.trim()
        || host?.getAttribute('aria-label') || 'chart';
      const labels = [...svg.querySelectorAll('text')]
        .map((t) => ({ text: t.textContent.trim(), box: t.getBoundingClientRect() }))
        .filter((t) => /^1[678]\d\d$/.test(t.text) && t.box.width > 0);

      const baselines = new Map();
      for (const label of labels) {
        const key = Math.round(label.box.top / 4);
        if (!baselines.has(key)) baselines.set(key, []);
        baselines.get(key).push(label);
      }
      for (const row of baselines.values()) {
        if (row.length < 2) continue;
        row.sort((a, b) => a.box.left - b.box.left);
        rows.push({
          title,
          years: row.map((l) => l.text),
          minGap: Math.min(...row.slice(1).map((l, i) => l.box.left - row[i].box.right)),
        });
      }
    }
    return rows;
  });

  // The troop curve and the campaign bars are the two on the shared scale.
  // Colonial Trade plots 1770-76 on its own axis and is measured for
  // legibility like everything else, but it has no business agreeing with them.
  const SHARED = /American Troops Furnished by Year|Theater of Operations|Military Campaigns Timeline/;

  const assertLegible = async (page) => {
    const rows = await axisRows(page);
    expect(rows.length, 'no year axis was measured').toBeGreaterThan(0);

    // No chart may run its year labels together.
    for (const row of rows) {
      expect(row.minGap, `${row.title}: "${row.years.join(' ')}" labels touch`).toBeGreaterThanOrEqual(2);
    }

    const shared = rows.filter((row) => SHARED.test(row.title));
    expect(shared.length, 'neither shared-axis chart was measured').toBeGreaterThan(0);
    for (const row of shared) {
      // Thinning must not cost the two dates that place the war.
      expect(row.years, `${row.title} lost an endpoint`).toEqual(
        expect.arrayContaining(['1775', '1781']),
      );
    }
    // They share a scale, so they have to thin together or stop lining up.
    const sets = [...new Set(shared.map((r) => r.years.join(',')))];
    expect(sets.length, `the stacked charts disagree on their years: ${sets.join(' vs ')}`).toBe(1);
  };

  for (const [w, h] of [[360, 740], [390, 844], [1280, 800]]) {
    test(`${w}x${h}: the data view's year labels are legible`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.data-stack--shared-time .recharts-surface').first()).toBeVisible();
      await page.locator('.data-stack--shared-time').scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);
      await assertLegible(page);
    });
  }

  test("390x844: the Full Ledger's year labels are legible", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openEvent(page, 'siege-of-yorktown');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.data-interlude-card')).toBeVisible();
    await page.getByRole('button', { name: 'Expand event details' }).click();
    await page.waitForTimeout(1200);
    await assertLegible(page);
  });
});

test.describe('Data view on a phone', () => {
  // A touchscreen, so a tap is a tap rather than a synthesised click.
  test.use({ hasTouch: true, isMobile: true });

  // A tap has no hover phase. The chart used to read Recharts' `activeIndex`,
  // which is set by whatever the pointer moved over, so a mouse — which always
  // moves before it clicks — worked and a phone did not: on iOS the first tap
  // raised the tooltip and the selection never happened.
  test('a tap selects a row without hovering first', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.battle-comparison')).toBeVisible();
    await page.waitForTimeout(1200);

    const chart = page.locator('.casualties-chart');

    const select = page.locator('.battle-select');
    // Every part of the row, not only where the ink reaches: the name in the
    // gutter, the bar, and the empty plot beyond it.
    for (const part of ['the battle name', 'the bar', 'the empty row']) {
      // Seed first, then measure: the dropdown scrolls itself into view.
      await select.selectOption(String(battleData[0].id));
      await expect(select).toHaveValue(String(battleData[0].id));
      // Back to the chart, where a reader taps from. The container, not a bar:
      // the bars are re-rendered when the selection changes, and a locator on
      // one detaches mid-action.
      await chart.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);

      const here = await chart.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const centres = [...el.querySelectorAll('.recharts-yAxis .recharts-cartesian-axis-tick')]
          .map((tick) => {
            const b = tick.getBoundingClientRect();
            return b.top + b.height / 2;
          });
        const index = centres.findIndex((y, i) => i > 0 && y > 140 && y < window.innerHeight - 140);
        // From the plot's own geometry rather than guessed offsets: the
        // gutter carries the battle name, the bars start where the plot does.
        const bars = [...el.querySelectorAll('.recharts-bar-rectangle')];
        const plotLeft = Math.min(...bars.map((b) => b.getBoundingClientRect().left));
        const surface = el.querySelector('.recharts-surface').getBoundingClientRect();
        return index === -1 ? null : {
          index,
          y: centres[index],
          name: box.left + (plotLeft - box.left) / 2,
          bar: plotLeft + 4,
          empty: surface.right - 12,
        };
      });
      expect(here, 'no row was on screen to tap').toBeTruthy();
      const expected = String(battleData[here.index].id);

      const x = part === 'the battle name' ? here.name : part === 'the bar' ? here.bar : here.empty;
      await page.touchscreen.tap(x, here.y);
      await expect(
        select,
        `a tap on ${part} did not select ${battleData[here.index].title}`,
      ).toHaveValue(expected);
    }
  });
});

test.describe('The story follows the filters', () => {
  // The filters used to hide markers and nothing else: with "Major Battles"
  // chosen the story still walked into the next political and diplomatic
  // events and the counter still read /51, which is a filter that does not
  // filter. They now narrow the story itself.
  const counter = (page) => page.locator('.status-chip-counter');
  const openFilters = async (page) => {
    await page.locator('.filter-toggle-btn').click();
    await expect(page.locator('.filters-panel')).toBeVisible();
  };

  test('a preset narrows the story, and every step matches it', async ({ page }) => {
    await openEvent(page, 'siege-of-yorktown');
    await expect(counter(page)).toHaveText(/\/51$/);

    await openFilters(page);
    await page.getByRole('button', { name: 'Major Battles', exact: true }).click();

    // 24 battles, plus the two interludes anchored to battles.
    await expect(counter(page)).toHaveText('25/26');
    await expect(title(page)).toHaveText('Siege of Yorktown');

    // Stepping stays inside the filter rather than walking out of it.
    for (let step = 0; step < 3; step += 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(400);
      const badge = await page.locator('.event-card-type-badge').textContent();
      expect(badge.trim(), 'a step left the filter').toMatch(/Battle|Data Dispatch/);
    }
  });

  test('the reader keeps their place across a filter change', async ({ page }) => {
    await openEvent(page, 'washington-resigns-commission');
    await openFilters(page);

    // Narrowing to a filter this event belongs to keeps it on screen.
    await page.getByRole('button', { name: 'Political Milestones', exact: true }).click();
    await expect(title(page)).toHaveText('Washington Resigns Commission');
    await expect(counter(page)).toHaveText('15/15');

    // And widening again returns to the same event, not to the same number.
    await page.getByRole('button', { name: 'All Events', exact: true }).click();
    await expect(title(page)).toHaveText('Washington Resigns Commission');
    await expect(counter(page)).toHaveText('51/51');
  });

  test('an event the filter excludes hands the reader the nearest one kept', async ({ page }) => {
    await openEvent(page, 'declaration-of-independence');
    await openFilters(page);
    await page.getByRole('button', { name: 'Major Battles', exact: true }).click();

    // Not back to 1765: the fighting either side of where they were.
    await expect(counter(page)).not.toHaveText('1/26');
    const year = Number(await page.locator('.status-chip-year').textContent());
    expect(year, 'landed far from the event the reader was on').toBeGreaterThanOrEqual(1775);
    await expect(page.locator('.event-card-type-badge')).toHaveText(/Battle/);
  });

  test('search reaches an event the filter excludes, and brings its type back', async ({ page }) => {
    await openEvent(page, 'declaration-of-independence');
    await openFilters(page);
    await page.getByRole('button', { name: 'Political Milestones', exact: true }).click();
    await expect(page.locator('.event-card-type-badge')).toHaveText(/Political/);

    const search = page.getByRole('combobox', { name: 'Search historical events' });
    await search.click();
    await search.fill('Cowpens');
    await page.getByRole('option').first().click();

    // Silence would be the worst answer: the battle is shown, and battles are
    // back in the story rather than the reader being stranded outside it.
    await expect(title(page)).toHaveText('Battle of Cowpens');
    await expect(
      page.getByRole('group', { name: 'Filter events by type' }).getByRole('button', { name: /Battles/ }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Turning points', () => {
  // The preset used to be `battle + diplomatic`: every engagement plus the
  // four treaties, 28 of 47 events, and a strict superset of the battles
  // preset next to it. Nothing was selected for being a turning point. The
  // judgement now lives on the events themselves.
  test('the preset shows the flagged events and nothing else', async ({ page }) => {
    const flagged = events.filter((event) => event.turningPoint);
    expect(flagged.length, 'no events are flagged').toBeGreaterThan(5);

    // The sequence the story should walk: each flagged event, then any
    // interlude anchored to it. Derived from the data rather than typed out,
    // so flagging another event extends this instead of breaking it.
    const expected = flagged.flatMap((event) => [
      event.title,
      ...interludes
        .filter((interlude) => interlude.afterEventId === event.id)
        .map((interlude) => interlude.title),
    ]);

    await openEvent(page, 'battles-of-lexington-and-concord');
    await page.locator('.filter-toggle-btn').click();
    await page.getByRole('button', { name: 'Turning Points', exact: true }).click();

    await expect(page.locator('.status-chip-counter')).toHaveText(`1/${expected.length}`);
    for (let step = 0; step < expected.length; step += 1) {
      // `toHaveText` polls, so a card still crossfading is waited out rather
      // than sampled — reading on a timer recorded one card twice and skipped
      // the Declaration entirely.
      await expect(title(page), `step ${step + 1} of the turning points`)
        .toHaveText(expected[step]);
      if (step < expected.length - 1) await page.keyboard.press('ArrowRight');
    }

    // 24 battles under the old preset; 11 flagged events under this one.
    expect(expected.length, 'the set has grown to most of the story').toBeLessThan(20);
  });

  // It spans battles, a declaration, a treaty and a vote in the Commons, so
  // no union of types can describe it — which is the reason for the flag.
  test('the set is not any union of event types', async ({ page }) => {
    const flagged = events.filter((event) => event.turningPoint);
    const types = [...new Set(flagged.map((event) => event.type))];
    expect(types.length, 'a single type would not need a flag').toBeGreaterThan(2);
    for (const type of types) {
      const all = events.filter((event) => event.type === type);
      expect(
        flagged.filter((event) => event.type === type).length,
        `every ${type} event is flagged, so the flag is doing nothing there`,
      ).toBeLessThan(all.length);
    }

    // And each one says why it was chosen.
    for (const event of flagged) {
      expect(typeof event.turningPoint, `${event.title} carries no reason`).toBe('string');
      expect(event.turningPoint.length).toBeGreaterThan(10);
    }
    await page.goto(`${baseUrl}#/explore/siege-of-yorktown`, { waitUntil: 'domcontentloaded' });
    await expect(title(page)).toHaveText('Siege of Yorktown');
  });

  test('reaching an event outside the set brings the rest of the story back', async ({ page }) => {
    // Taken from the data, not named here: this test used to search for Valley
    // Forge, which then joined the set and left the test asserting nothing.
    const outside = events.find((event) => !event.turningPoint && event.type === 'battle');
    expect(outside, 'every event is flagged').toBeTruthy();

    await openEvent(page, 'battles-of-lexington-and-concord');
    await page.locator('.filter-toggle-btn').click();
    await page.getByRole('button', { name: 'Turning Points', exact: true }).click();
    await page.waitForTimeout(500);

    const search = page.getByRole('combobox', { name: 'Search historical events' });
    await search.click();
    await search.fill(outside.title);
    await page.getByRole('option').filter({ hasText: outside.title }).first().click();

    await expect(title(page)).toHaveText(outside.title);
    // Back to the whole story rather than a set that cannot contain it.
    await expect(page.locator('.status-chip-counter')).toHaveText(/\/51$/);
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
