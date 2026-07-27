import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const baseUrl = globalThis.process?.env.AMREVIZ_TEST_URL || 'http://localhost:5174/';

test.describe('AmReViz UX & Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('region', { name: 'The American Revolution' })).toBeVisible();
  });

  test('welcome screen is accessible and exposes both entry points', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'The American Revolution' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Begin exploring' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open the data' })).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).analyze();
    const seriousViolations = violations.filter(
      ({ impact }) => impact === 'serious' || impact === 'critical',
    );

    expect(
      seriousViolations,
      seriousViolations.map(({ id, help }) => `${id}: ${help}`).join('\n'),
    ).toEqual([]);
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

    const searchInput = page.getByRole('textbox', { name: 'Search historical events' });
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
