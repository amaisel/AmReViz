import {
  test,
  expect,
  baseUrl,
  contrastRatio,
  EFFECTIVE_BG,
  setTheme,
  quietFirstVisit,
} from './helpers.js';
import AxeBuilder from '@axe-core/playwright';

// ---------------------------------------------------------------------------

test.describe('axe across every view and theme', () => {
  // The older suite scans three states, all of them light and all of them on
  // event 101. Two moderate violations — a heading level skipped in the data
  // view and a complementary landmark nested inside another — lived in the
  // gap between those scans and the rest of the app.
  const VIEWS = [
    ['welcome', ''],
    ['explore battle', '#/explore/3'],
    ['explore diplomatic', '#/explore/127'],
    ['explore military', '#/explore/7'],
    ['explore interlude', '#/explore/5'],
    ['data', '#/data'],
  ];

  for (const [width, height, device] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
    for (const dark of [false, true]) {
      for (const [name, hash] of VIEWS) {
        test(`${device} ${dark ? 'dark' : 'light'} — ${name}`, async ({ page }) => {
          await quietFirstVisit(page);
          // Scan with motion reduced. axe blends a half-faded badge against
          // whatever is behind it and reports a contrast failure no user ever
          // sees, so the page has to be at rest first — and waiting for it to
          // settle is a race the suite loses under four parallel workers
          // against one dev server. Reducing motion removes the thing being
          // waited on instead of racing it: the entry animations become short
          // crossfades and the marker's endless pulse stops. It changes no
          // colour, which is all this scan measures.
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.setViewportSize({ width, height });
          await page.goto(`${baseUrl}${hash}`, { waitUntil: 'domcontentloaded' });
          await setTheme(page, dark);
          await expect(page.locator('.app')).toBeVisible();
          // The explore route is a lazy chunk. Under load, "no animation is
          // running" is true before the card has mounted at all, and axe then
          // scans the crossfade it starts a moment later. Wait for the card.
          if (hash.startsWith('#/explore')) {
            await expect(page.locator('.event-card-title').first()).toBeVisible();
          }
          await expect
            .poll(() => page.evaluate(() => document
              .getAnimations()
              .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity)
              .length), { timeout: 15_000 })
            .toBe(0);

          const { violations } = await new AxeBuilder({ page }).analyze();
          const found = violations.map(
            ({ id, impact, nodes }) => `${id} (${impact}) on ${nodes[0].target.join(' ')}`,
          );
          // Every impact level, not just serious and critical.
          expect(found).toEqual([]);
        });
      }
    }
  }
});

test.describe('Text contrast, measured rather than assumed', () => {
  // axe skips what it cannot resolve — anything over a gradient, and anything
  // Recharts draws — which is exactly where the failures were. This walks
  // every rendered text node instead.
  const SWEEP = `(effectiveBgSrc) => {
    const effectiveBg = eval(effectiveBgSrc);
    const parse = (s) => { const p = (s||'').match(/[\\d.]+/g); return p ? { rgb: p.slice(0,3).map(Number), a: p.length>3?Number(p[3]):1 } : null; };
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (!text) continue;
      const el = node.parentElement;
      if (!el || seen.has(el)) continue;
      seen.add(el);
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (Number(cs.opacity) < 0.95) continue;
      if (el.closest('.sr-only')) continue;
      const fg = parse(cs.color);
      if (!fg || fg.a < 0.95) continue;
      const size = parseFloat(cs.fontSize);
      const weight = Number(cs.fontWeight) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const { bg, imagery } = effectiveBg(el);
      out.push({
        text: text.slice(0, 40),
        sel: el.tagName.toLowerCase() + '.' + String(el.className).slice(0, 30),
        fg: cs.color, bg, imagery, need: large ? 3.0 : 4.5,
        disabled: Boolean(el.closest('[disabled], .leaflet-disabled, [aria-disabled="true"]')),
      });
    }
    return out;
  }`;

  for (const [name, hash] of [
    ['explore', '#/explore/127'],
    ['data', '#/data'],
    ['welcome', ''],
  ]) {
    for (const dark of [false, true]) {
      test(`${name} in ${dark ? 'dark' : 'light'} mode`, async ({ page }) => {
        await quietFirstVisit(page);
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.goto(`${baseUrl}${hash}`, { waitUntil: 'domcontentloaded' });
        await setTheme(page, dark);
        await expect(page.locator('.app')).toBeVisible();
        await page.waitForTimeout(1200);

        const samples = await page.evaluate(
          ([sweepSrc, bgSrc]) => eval(sweepSrc)(bgSrc),
          [SWEEP, EFFECTIVE_BG],
        );
        expect(samples.length, 'nothing was measured').toBeGreaterThan(5);

        const failures = samples
          // Anything over a gradient or image: the declared colours do not
          // describe what is rendered, so a computed ratio here is fiction.
          // These were verified separately by sampling rendered pixels — the
          // welcome stat labels measure 12.6:1, the theme glyph 10.7:1.
          .filter((s) => !s.imagery)
          // A control at the end of its range. WCAG 1.4.3 exempts inactive
          // controls, and the app deliberately dims rather than hides them.
          .filter((s) => !s.disabled)
          .map((s) => ({ ...s, got: contrastRatio(s.fg, s.bg) }))
          .filter((s) => s.got + 0.001 < s.need)
          .map((s) => `${s.got.toFixed(2)}:1 (need ${s.need}) "${s.text}" ${s.sel} — ${s.fg} on ${s.bg}`);

        expect(failures).toEqual([]);
      });
    }
  }
});

test.describe('Charts', () => {
  // Every series was painted in its light-theme hue whatever the theme, so in
  // dark mode the navy area sat on near-black at 1.15:1 — not a contrast nit
  // but an unreadable chart.
  for (const dark of [false, true]) {
    test(`series marks clear the graphic threshold in ${dark ? 'dark' : 'light'} mode`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });
      await setTheme(page, dark);
      await expect(page.getByRole('heading', { name: 'War in Numbers' })).toBeVisible();
      await expect(page.locator('.recharts-area').first()).toBeVisible();

      const marks = await page.evaluate((bgSrc) => {
        const effectiveBg = eval(bgSrc);
        const seen = new Map();
        const nodes = document.querySelectorAll(
          '.recharts-area-curve, .recharts-line-curve, .recharts-bar-rectangle path',
        );
        for (const n of nodes) {
          const stroke = n.getAttribute('stroke');
          const fill = n.getAttribute('fill');
          const colour = (stroke && stroke !== 'none' ? stroke : fill) || '';
          // Gradient and pattern fills are resolved elsewhere; the stroke is
          // what carries the line, and a hatch keeps its base colour.
          if (!colour.startsWith('#')) continue;
          const host = n.closest('.chart-container');
          if (!host) continue;
          seen.set(colour, effectiveBg(host).bg);
        }
        return [...seen.entries()];
      }, EFFECTIVE_BG);

      expect(marks.length, 'no series marks found').toBeGreaterThan(1);
      const weak = marks
        .map(([hue, bg]) => ({ hue, bg, got: contrastRatio(hue, bg) }))
        // WCAG 1.4.11: a graphic that carries meaning needs 3:1.
        .filter((m) => m.got < 3)
        .map((m) => `${m.hue} on ${m.bg} = ${m.got.toFixed(2)}:1`);
      expect(weak).toEqual([]);
    });
  }

  // Recharts paints legend labels in the series colour by default, which is
  // what dragged the gold to 2.41:1 as text while it was perfectly legible as
  // a line. The label takes body ink and the swatch carries the colour.
  for (const dark of [false, true]) {
    test(`legend labels are readable in ${dark ? 'dark' : 'light'} mode`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });
      await setTheme(page, dark);
      await expect(page.locator('.recharts-legend-item-text').first()).toBeVisible();

      const labels = await page.locator('.recharts-legend-item-text').evaluateAll((els, bgSrc) => {
        const effectiveBg = eval(bgSrc);
        return els.map((el) => {
          // Recharts leaves the series colour on this wrapper and the
          // formatter's node sits inside it. Measuring the wrapper reports a
          // colour no glyph is ever painted in.
          const painted = el.querySelector('*') ?? el;
          return {
            text: painted.textContent.trim(),
            fg: getComputedStyle(painted).color,
            bg: effectiveBg(painted).bg,
          };
        });
      }, EFFECTIVE_BG);

      expect(labels.length).toBeGreaterThan(2);
      const weak = labels
        .map((l) => ({ ...l, got: contrastRatio(l.fg, l.bg) }))
        .filter((l) => l.got < 4.5)
        .map((l) => `"${l.text}" ${l.got.toFixed(2)}:1 (${l.fg} on ${l.bg})`);
      expect(weak).toEqual([]);
    });
  }

  // Red and green collapse under deuteranopia, and the dark trio's gold and
  // red sit close after simulation. Every chart therefore says it twice.
  test('series are distinguishable without colour', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.recharts-area-curve').first()).toBeVisible();

    // One of the two stacked areas is dashed.
    const areaDashes = await page.locator('.recharts-area-curve')
      .evaluateAll((els) => els.map((el) => el.getAttribute('stroke-dasharray')));
    expect(areaDashes.filter(Boolean).length, 'no dashed area series').toBeGreaterThan(0);
    expect(areaDashes.filter((d) => !d).length, 'no solid area series').toBeGreaterThan(0);

    // One of the two trade lines is dashed.
    const lineDashes = await page.locator('.recharts-line-curve')
      .evaluateAll((els) => els.map((el) => el.getAttribute('stroke-dasharray')));
    expect(lineDashes.filter(Boolean).length, 'no dashed line series').toBeGreaterThan(0);

    // Casualties are two solid fills (navy / Crown red). Scoped and scrolled:
    // `.recharts-bar-rectangle` also matches the campaign timeline at the top
    // of the page, and the casualties chart does not render until it is near
    // the viewport — so an unscoped query returns the wrong chart's bars.
    const casualties = page.getByRole('region', { name: 'Casualties by Major Battle Chart' });
    await casualties.scrollIntoViewIfNeeded();
    await expect(casualties.locator('.recharts-bar-rectangle').first()).toBeVisible();
    const barFills = await casualties.locator('.recharts-bar-rectangle path')
      .evaluateAll((els) => [...new Set(els.map((el) => el.getAttribute('fill')))]);
    expect(barFills.length, 'casualties chart needs two solid series').toBeGreaterThanOrEqual(2);
    expect(
      barFills.every((f) => f && !String(f).startsWith('url(')),
      'Crown series still uses a pattern',
    ).toBe(true);
  });

  // An SVG in a labelled region announces that a chart exists and then offers
  // nothing. These carry the numbers behind it.
  test('each chart has a data table for readers who cannot see it', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${baseUrl}#/data`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'War in Numbers' })).toBeVisible();

    const tables = page.locator('table.sr-only');
    await expect(tables).toHaveCount(4);

    // Real content, with headers a screen reader can navigate by.
    const shapes = await tables.evaluateAll((els) => els.map((t) => ({
      caption: t.querySelector('caption')?.textContent ?? '',
      colHeaders: t.querySelectorAll('thead th[scope="col"]').length,
      rowHeaders: t.querySelectorAll('tbody th[scope="row"]').length,
      rows: t.querySelectorAll('tbody tr').length,
      paints: t.getBoundingClientRect().height > 0 && getComputedStyle(t).clipPath === 'none',
      clickable: getComputedStyle(t).pointerEvents !== 'none',
    })));

    for (const s of shapes) {
      expect(s.caption.length, 'table has no caption').toBeGreaterThan(5);
      expect(s.colHeaders).toBeGreaterThan(1);
      expect(s.rowHeaders).toBe(s.rows);
      expect(s.rows).toBeGreaterThan(3);
      expect(s.paints, `"${s.caption}" is painted on screen`).toBe(false);
      // A display:table ignores the 1px width, so these are full-size boxes
      // positioned over the chart. Without pointer-events:none they swallow
      // clicks meant for a bar.
      expect(s.clickable, `"${s.caption}" can intercept pointer events`).toBe(false);
    }

    // Spot-check one number against the chart it describes.
    await expect(page.getByRole('table', { name: /casualties by major battle/i }))
      .toContainText('Bunker Hill');
  });
});

test.describe('Focus', () => {
  // The ring was `2px solid currentColor` — the button's own text colour,
  // chosen to contrast with the button and saying nothing about the page it is
  // drawn on. On an active filter chip in light mode that was white on
  // parchment, 1.14:1; on the dark view toggle, navy on the dark header,
  // 1.23:1. A keyboard user simply lost the cursor.
  for (const dark of [false, true]) {
    test(`the focus ring is visible in ${dark ? 'dark' : 'light'} mode`, async ({ page }) => {
      await quietFirstVisit(page);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
      await setTheme(page, dark);
      await page.getByRole('button', { name: 'Filter' }).click();
      await expect(page.locator('.filters-panel')).toBeVisible();
      // Chrome only matches :focus-visible on a programmatic focus() when the
      // last input was a keyboard, and we just clicked.
      await page.keyboard.press('Tab');

      const rings = await page.evaluate(async (bgSrc) => {
        const effectiveBg = eval(bgSrc);
        const out = [];
        const selectors = [
          '.explore-btn', '.filter-btn', '.filter-btn.active', '.filter-preset-chip',
          '.speed-indicator', '.view-toggle button.active', '.mode-toggle',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (!el) continue;
          el.focus();
          // Style recalc has to run, and the ring transitions in.
          for (let i = 0; i < 30; i += 1) {
            await new Promise((r) => requestAnimationFrame(r));
          }
          const cs = getComputedStyle(el);
          out.push({
            sel,
            style: cs.outlineStyle,
            width: parseFloat(cs.outlineWidth),
            colour: cs.outlineColor,
            // The ring sits outside the button, on whatever is behind it.
            against: effectiveBg(el.parentElement).bg,
          });
        }
        return out;
      }, EFFECTIVE_BG);

      expect(rings.length).toBeGreaterThan(4);
      const invisible = rings
        .map((r) => ({ ...r, got: contrastRatio(r.colour, r.against) }))
        .filter((r) => r.style === 'none' || r.width < 1 || r.got < 3)
        .map((r) => `${r.sel}: ${r.style} ${r.width}px ${r.colour} on ${r.against} = ${r.got.toFixed(2)}:1`);
      expect(invisible).toEqual([]);
    });
  }
});

test.describe('Colour is never the only signal', () => {
  // Which side held a place is drawn as a fill colour and nothing else. Navy
  // against crimson survives most colour vision but sits close under
  // protanopia, and a screen reader cannot see a fill at all.
  test('a map marker says which side held the place', async ({ page }) => {
    await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.custom-marker [role="button"]').first()).toBeVisible();

    const labels = await page.locator('.custom-marker [role="button"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));

    expect(labels.length).toBeGreaterThan(2);
    const silent = labels.filter((l) => !/(American|British)-held$/.test(l || ''));
    expect(silent, 'markers with no side in their name').toEqual([]);
    // Both sides are actually represented by this point in the story.
    expect(labels.some((l) => l.endsWith('American-held'))).toBe(true);
    expect(labels.some((l) => l.endsWith('British-held'))).toBe(true);
  });

  // The four event types are told apart by a symbol as well as a hue — red and
  // green are the pairing deuteranopia flattens, and these two are `battle`
  // and `military`.
  test('event type is carried by a symbol, not only a colour', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Filter' }).click();

    const chips = page.locator('.filter-btn');
    await expect(chips).toHaveCount(4);
    const shapes = await chips.evaluateAll((els) => els.map((el) => {
      const svg = el.querySelector('.filter-icon svg');
      return svg ? svg.innerHTML.replace(/\s+/g, '') : null;
    }));
    expect(shapes.filter(Boolean)).toHaveLength(4);
    // Four distinct glyphs, not one glyph in four colours.
    expect(new Set(shapes).size).toBe(4);
  });
});
