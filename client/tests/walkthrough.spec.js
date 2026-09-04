/**
 * A single, repeatable walk through the whole app.
 *
 * The other three suites each go deep on one thing — map framing and sheet
 * geometry, individual fixed regressions, the colour and accessibility floor.
 * This one is the pass over everything: it enters from the welcome screen, steps
 * through all 47 events and 4 data interludes in order, exercises every
 * control in the explore view, reads every chart in the data view, checks
 * deep links and history, and does the mobile layout too — asserting as it
 * goes that no step throws.
 *
 *   npm run walkthrough                 # the whole walk
 *   npm run walkthrough:shots           # ... and write screenshots
 *   npx playwright test walkthrough -g "data view"   # one leg of it
 *
 * The expected story sequence is derived from `src/data`, not typed out here,
 * so adding an event or an interlude extends the walk instead of breaking it.
 */
import { test as base, expect } from '@playwright/test';
import { events, eventSlug } from '../src/data/events.js';
import { interludes } from '../src/data/interludes.js';

const env = globalThis.process?.env ?? {};
const baseUrl = env.AMREVIZ_TEST_URL || 'http://127.0.0.1:5174/';
const wantShots = Boolean(env.WALKTHROUGH_SHOTS);

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

// The same interleave ExploreView does: each event, then any interlude
// anchored to it. An interlude holds the map on the event before it, so its
// anchor is what the address bar and the year chip should still be showing.
const storyItems = events.flatMap((event) => [
  { title: event.title, anchor: event, kind: 'event' },
  ...interludes
    .filter((interlude) => interlude.afterEventId === event.id)
    .map((interlude) => ({ title: interlude.title, anchor: event, kind: 'interlude' })),
]);

// Errors the app is responsible for. A hero image that fails to load is not
// one of them: an event whose bundled file is missing falls back to hotlinking
// Wikipedia, so an offline or proxied run fails those loads by design and the
// card renders without a picture.
const IGNORED_CONSOLE = [
  /Failed to load resource/i,
  /ERR_(NAME_NOT_RESOLVED|INTERNET_DISCONNECTED|CONNECTION|BLOCKED|FAILED|ABORTED|TIMED_OUT)/i,
  /net::/i,
  /wikipedia\.org/i,
  /favicon/i,
  /Download the React DevTools/i,
];

// Every test in the file watches for uncaught exceptions and console errors,
// and fails on them at the end of the test whatever else it asserted.
const test = base.extend({
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

    expect(problems, 'the browser reported errors during the walk').toEqual([]);
  },
});

// Framer Motion animates opacity inline; a screenshot or a click that lands
// mid-transition is the flakiest thing in this app. Wait for the element to be
// opaque with nothing still running on it — ignoring the active marker's pulse
// ring, which loops forever on purpose.
async function settle(page, selector) {
  await expect
    .poll(
      () =>
        page.locator(selector).first().evaluate((el) => {
          const opaque = Number(getComputedStyle(el).opacity) === 1;
          const running = el
            .getAnimations({ subtree: true })
            .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity);
          return opaque && running.length === 0;
        }),
      { timeout: 15_000, message: `${selector} never came to rest` },
    )
    .toBe(true);
}

// Screenshots are for looking at, not for comparing: `WALKTHROUGH_SHOTS=1`
// leaves one per stop of the walk in test-results/walkthrough, which git
// ignores. Named rather than numbered — the legs run in parallel, so a
// counter would say nothing about the order they were taken in.
async function shot(page, name) {
  if (!wantShots) return;
  await page.screenshot({ path: `test-results/walkthrough/${name}.png` });
}

const stepCounter = (page) => page.locator('.status-chip-counter');
const cardTitle = (page) => page.locator('.event-card-title').first();

/**
 * Open the app at `hash` on a desktop viewport.
 *
 * By way of `about:blank`, so that going from one hash to another is a real
 * document load rather than a same-document hash change — the app boots from
 * the address bar, and a walk that skipped the boot would not be testing it.
 */
async function open(page, hash = '') {
  await page.setViewportSize(DESKTOP);
  if (new URL(page.url(), baseUrl).protocol !== 'about:') await page.goto('about:blank');
  await page.goto(`${baseUrl}${hash}`, { waitUntil: 'domcontentloaded' });
}

/** Enter the story from the welcome screen and wait for the map and card. */
async function enterStory(page) {
  await page.getByRole('button', { name: 'Begin exploring' }).click();
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(cardTitle(page)).toBeVisible();
}

test.describe('AmReViz — full walkthrough', () => {
  test('welcome screen offers both ways in', async ({ page }) => {
    await open(page);

    await expect(page.getByRole('heading', { name: 'The American Revolution' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Begin exploring' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open the data' })).toBeVisible();

    // The stat block counts the data rather than repeating a number by hand.
    const overview = page.getByRole('group', { name: 'Project overview' });
    await expect(overview).toContainText(String(events.length));
    await expect(overview).toContainText(String(events.filter((e) => e.type === 'battle').length));
    await expect(overview).toContainText('13');

    // Shortcuts open from the footer and close on Escape, handing focus back.
    await page.getByRole('button', { name: 'Shortcuts' }).click();
    const dialog = page.getByRole('dialog', { name: 'Keyboard Shortcuts' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await shot(page, 'welcome');
  });

  test('the story walks every event and interlude in order', async ({ page }) => {
    // 51 steps, each moving the map and swapping the card: this is the long
    // leg of the walk and it needs room beyond the default timeout.
    test.setTimeout(240_000);

    await open(page);
    await enterStory(page);

    await expect(stepCounter(page)).toHaveText(`1/${storyItems.length}`);
    await expect(cardTitle(page)).toHaveText(storyItems[0].title);
    await shot(page, 'explore-first-event');

    const seen = [];
    for (let index = 0; index < storyItems.length; index += 1) {
      const step = storyItems[index];

      await expect(stepCounter(page), `step ${index + 1} counter`).toHaveText(
        `${index + 1}/${storyItems.length}`,
      );
      await expect(cardTitle(page), `step ${index + 1} title`).toHaveText(step.title);

      // The address bar names the anchor event by slug — an interlude holds
      // the URL on the event it follows.
      await expect
        .poll(() => new URL(page.url()).hash, {
          message: `step ${index + 1} never wrote its slug to the address bar`,
        })
        .toBe(`#/explore/${eventSlug(step.anchor.id)}`);

      // The year chip tracks the anchor event too.
      await expect(page.locator('.status-chip-year')).toHaveText(String(step.anchor.year));

      // An interlude carries a chart instead of a source link; an event card
      // carries its narrative and the source it came from.
      if (step.kind === 'interlude') {
        await expect(page.locator('.interlude-chart-wrap .chart-container').first()).toBeVisible();
      } else {
        await expect(page.locator('.event-card-description')).not.toBeEmpty();
        if (step.anchor.source) {
          await expect(page.locator('.event-card-source')).toHaveAttribute(
            'href',
            step.anchor.source.url,
          );
        }
      }

      seen.push(step.title);
      if (index < storyItems.length - 1) await page.keyboard.press('ArrowRight');
    }

    expect(seen, 'every event and interlude was walked, in order').toEqual(
      storyItems.map((item) => item.title),
    );

    // The last step offers the way back to the beginning.
    const end = page.locator('.story-end');
    await expect(end).toContainText('End of Timeline');
    await shot(page, 'explore-end-of-timeline');

    await end.getByRole('button', { name: 'Replay' }).click();
    await expect(stepCounter(page)).toHaveText(`1/${storyItems.length}`);

    // Replay starts playing; stop it so the run ends quietly.
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
  });

  test('arrow keys, the card buttons and the map all move the story', async ({ page }) => {
    await open(page);
    await enterStory(page);

    const third = storyItems[2].title;

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(cardTitle(page)).toHaveText(third);

    await page.getByRole('button', { name: 'Previous event' }).click();
    await expect(cardTitle(page)).toHaveText(storyItems[1].title);
    await page.getByRole('button', { name: 'Next event' }).click();
    await expect(cardTitle(page)).toHaveText(third);

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(cardTitle(page)).toHaveText(storyItems[0].title);
    await expect(stepCounter(page)).toHaveText(`1/${storyItems.length}`);

    // A marker on the map is a way into its event. Walk forward far enough
    // that the second event's marker has been drawn, then click it.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const first = events[0];
    const firstMarker = page.getByRole('button', {
      name: new RegExp(`^${first.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}, ${first.year}(,|$)`),
    });
    await expect(firstMarker).toBeVisible();
    await firstMarker.click();
    await expect(cardTitle(page)).toHaveText(first.title);
  });

  test('playback, speed, filters, search and cards focus all work', async ({ page }) => {
    test.setTimeout(120_000);

    await open(page);
    await enterStory(page);

    // Play advances on its own, and Pause stops it where it is.
    await page.getByRole('button', { name: 'Play' }).click();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect(stepCounter(page)).not.toHaveText(`1/${storyItems.length}`, { timeout: 20_000 });
    await page.getByRole('button', { name: 'Pause' }).click();
    const paused = await stepCounter(page).textContent();
    await page.waitForTimeout(1500);
    await expect(stepCounter(page)).toHaveText(paused);

    // Speed cycles 1x → 1.5x → 2x → 1x.
    const speed = page.locator('.speed-indicator');
    await expect(speed).toHaveText('1x');
    await speed.click();
    await expect(speed).toHaveText('1.5x');
    await speed.click();
    await expect(speed).toHaveText('2x');
    await speed.click();
    await expect(speed).toHaveText('1x');

    // Filters: a preset narrows the map, and the toggle reports the count.
    await page.getByRole('button', { name: /^Filter/ }).click();
    const filters = page.locator('.filters-panel');
    await expect(filters).toBeVisible();
    await filters.getByRole('button', { name: 'Major Battles' }).click();
    await expect(page.locator('.filter-count-badge')).toHaveText('1');
    await expect(
      page.getByRole('group', { name: 'Filter events by type' }).getByRole('button', { name: /Battles/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    await filters.getByRole('checkbox', { name: 'Color colonies' }).check();
    await filters.getByRole('button', { name: 'All Events' }).click();
    await expect(page.locator('.filter-count-badge')).toHaveCount(0);
    await shot(page, 'explore-filters');
    await page.getByRole('button', { name: /^Filter/ }).click();
    await expect(filters).toBeHidden();

    // Search jumps straight to an event.
    const target = events.find((event) => /Yorktown/i.test(event.title)) ?? events[10];
    const search = page.getByRole('combobox', { name: 'Search historical events' });
    await search.click();
    await search.fill(target.title.slice(0, 8));
    const option = page.getByRole('option').filter({ hasText: target.title }).first();
    await expect(option).toBeVisible();
    await option.click();
    await expect(cardTitle(page)).toHaveText(target.title);
    await expect
      .poll(() => new URL(page.url()).hash)
      .toBe(`#/explore/${eventSlug(target.id)}`);

    // A search that matches nothing says so rather than going blank.
    await search.click();
    await search.fill('zzzzz');
    await expect(page.locator('.search-no-results')).toBeVisible();
    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(search).toHaveValue('');

    // Cards focus hides the map; Escape brings it back. Blur first — the
    // shortcut handler ignores keys typed into a field, and clearing the
    // search puts the cursor back in it.
    await search.blur();
    await page.keyboard.press('c');
    await expect(page.locator('.view-mode-cards')).toBeVisible();
    await settle(page, '.view-mode-cards');
    await shot(page, 'explore-cards-focus');
    await page.keyboard.press('Escape');
    await expect(page.locator('.scrollytelling-view.view-mode-map')).toBeVisible();
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('deep links, legacy links and junk links all land somewhere sensible', async ({ page }) => {
    const target = events.find((event) => /Bunker Hill/i.test(event.title)) ?? events[4];

    // A slug link opens that event directly.
    await open(page, `#/explore/${eventSlug(target.id)}`);
    await expect(cardTitle(page)).toHaveText(target.title);

    // A pre-slug numeric link still resolves, and is rewritten to the slug.
    await open(page, `#/explore/${target.id}`);
    await expect(cardTitle(page)).toHaveText(target.title);
    await expect
      .poll(() => new URL(page.url()).hash, { message: 'the numeric link was never rewritten' })
      .toBe(`#/explore/${eventSlug(target.id)}`);

    // A slug that names nothing falls back to the start of the story rather
    // than to an empty view.
    await open(page, '#/explore/not-a-real-event');
    await expect(cardTitle(page)).toHaveText(storyItems[0].title);

    // Back and Forward retrace the steps the story pushed.
    await open(page);
    await enterStory(page);
    await page.keyboard.press('ArrowRight');
    await expect(cardTitle(page)).toHaveText(storyItems[1].title);
    await page.goBack();
    await expect(cardTitle(page)).toHaveText(storyItems[0].title);
    await page.goForward();
    await expect(cardTitle(page)).toHaveText(storyItems[1].title);

    // The header toggle and the number keys move between the two views.
    await page.getByRole('button', { name: 'Data', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'War in Numbers' })).toBeVisible();
    await expect.poll(() => new URL(page.url()).hash).toBe('#/data');
    await page.keyboard.press('1');
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await page.keyboard.press('2');
    await expect(page.getByRole('heading', { name: 'War in Numbers' })).toBeVisible();
  });

  test('the data view carries every chart, its table and its controls', async ({ page }) => {
    await open(page, '#/data');
    await expect(page.getByRole('heading', { name: 'War in Numbers' })).toBeVisible();

    // The three headline figures count up to a number, not to nothing.
    const insights = page.locator('.insight-card .insight-value');
    await expect(insights).toHaveCount(3);
    for (let i = 0; i < 3; i += 1) {
      await expect
        .poll(async () => (await insights.nth(i).textContent())?.replace(/\D/g, '').length ?? 0, {
          message: `insight ${i + 1} never counted up`,
        })
        .toBeGreaterThan(0);
    }

    // Every chart is a labelled region, and each carries the same numbers as
    // a table for readers who cannot see it.
    const charts = [
      'American Troops Furnished by Year Chart',
      'Colonial Trade Chart',
      'Casualties by Major Battle Chart',
      'Military Campaigns Timeline',
    ];
    for (const name of charts) {
      const region = page.getByRole('region', { name });
      await expect(region, name).toBeVisible();
      const rows = region.locator('table.sr-only tbody tr');
      await expect(rows, `${name} data table`).not.toHaveCount(0);
    }
    await shot(page, 'data-view');

    // The comparison tool follows the select, and opens the story from it.
    const comparison = page.getByRole('region', { name: 'Battle Comparison Tool' });
    const select = comparison.getByRole('combobox', { name: 'Select a battle to compare' });
    const battle = events.find((event) => /Yorktown/i.test(event.title) && event.forces);
    await select.selectOption(String(battle.id));
    await expect(comparison).toContainText(battle.combatants?.american || 'American / allied');
    await expect(comparison.locator('.comparison-value').first()).not.toBeEmpty();

    await comparison.getByRole('button', { name: 'Open in the story' }).click();
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(cardTitle(page)).toHaveText(battle.title);
    await expect.poll(() => new URL(page.url()).hash).toBe(`#/explore/${eventSlug(battle.id)}`);

    // Every source link on the data view points somewhere.
    await open(page, '#/data');
    const links = page.locator('.data-method-links a');
    await expect(links).not.toHaveCount(0);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('href', /^https?:\/\//);
    }
  });

  test('dark mode applies across both views and survives a reload', async ({ page }) => {
    await open(page);
    await enterStory(page);

    await page.keyboard.press('d');
    await expect(page.locator('body')).toHaveClass(/dark-mode/);
    await expect(page.locator('.scrollytelling-view')).toHaveClass(/dark/);
    await settle(page, '.desktop-event-card');
    await shot(page, 'explore-dark');

    await page.keyboard.press('2');
    await expect(page.getByRole('heading', { name: 'War in Numbers' })).toBeVisible();
    await shot(page, 'data-dark');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toHaveClass(/dark-mode/);

    // And the header toggle turns it back off.
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await expect(page.locator('body')).toHaveClass(/light-mode/);
  });

});

// The sheet is a touch surface, so the phone leg runs in a context that has
// one — without `hasTouch` the swipe below dispatches into nothing.
test.describe('AmReViz — full walkthrough on a phone', () => {
  test.use({ viewport: MOBILE, hasTouch: true });

  test('the mobile layout carries the same story', async ({ page }) => {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Begin exploring' }).click();

    const sheet = page.locator('.bottom-sheet');
    await expect(sheet).toBeVisible();
    await settle(page, '.bottom-sheet');
    await expect(cardTitle(page)).toHaveText(storyItems[0].title);
    // One card, not one per layout.
    await expect(page.locator('.event-card-fixed')).toHaveCount(1);
    await shot(page, 'mobile-peek');

    // The handle opens the sheet to read the rest, and closes it again.
    await page.getByRole('button', { name: 'Expand event details' }).click();
    const collapse = page.getByRole('button', { name: 'Collapse event details' });
    await expect(collapse).toBeVisible();
    await shot(page, 'mobile-expanded');
    await collapse.click();
    await expect(page.getByRole('button', { name: 'Expand event details' })).toBeVisible();

    // The header keeps Prev/Next in reach at both snap points.
    await page.getByRole('button', { name: 'Next event' }).click();
    await expect(cardTitle(page)).toHaveText(storyItems[1].title);
    await page.getByRole('button', { name: 'Previous event' }).click();
    await expect(cardTitle(page)).toHaveText(storyItems[0].title);

    // A sideways swipe moves the story too.
    const box = await sheet.boundingBox();
    await swipe(page, box.x + box.width - 40, box.x + 40, box.y + 40);
    await expect(cardTitle(page)).toHaveText(storyItems[1].title);

    // Playback, search and the filter chips live behind the controls button.
    await page.getByRole('button', { name: 'Story controls' }).click();
    const panel = page.locator('.sheet-controls-panel');
    await expect(panel.getByRole('button', { name: 'Play' })).toBeVisible();
    await expect(panel.getByRole('combobox', { name: 'Search historical events' })).toHaveCount(1);
    await expect(panel.getByRole('button', { name: 'Major Battles' })).toBeVisible();
    await shot(page, 'mobile-controls');

    // And the data view is reachable and readable at this width.
    await page.getByRole('button', { name: 'Data', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'War in Numbers' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Colonial Trade Chart' })).toBeVisible();
    await shot(page, 'mobile-data');

    // Nothing should force the page sideways at 390px.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, 'the data view scrolls horizontally on a phone').toBeLessThanOrEqual(1);
  });
});

/** A horizontal drag across the sheet, as a thumb would make it. */
async function swipe(page, fromX, toX, y) {
  // Built in the page rather than through `dispatchEvent`: the sheet's handler
  // reads `touches[0].clientX`, and only a real `Touch` carries one.
  await page.evaluate(
    ([from, to, clientY]) => {
      const sheet = document.querySelector('.bottom-sheet');
      const point = (clientX) => new Touch({ identifier: 1, target: sheet, clientX, clientY });
      const start = point(from);
      const end = point(to);
      sheet.dispatchEvent(
        new TouchEvent('touchstart', {
          bubbles: true,
          touches: [start],
          targetTouches: [start],
          changedTouches: [start],
        }),
      );
      sheet.dispatchEvent(
        new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [end] }),
      );
    },
    [fromX, toX, y],
  );
}
