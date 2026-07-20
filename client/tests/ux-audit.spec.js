import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Editorial experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.welcome-content')).toBeVisible();
  });

  test('welcome presents a clear editorial entry point', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /A revolution, mapped/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /begin the interactive story/i })).toBeVisible();
    await expect(page.getByText('A decade in five turning points')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('story preserves map and search keyboard contracts', async ({ page }) => {
    await page.getByRole('button', { name: /begin the interactive story/i }).click();
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10_000 });

    const markers = page.locator('.custom-marker [role="button"]');
    await expect(markers.first()).toBeVisible();
    expect(await markers.count()).toBeGreaterThan(0);
    await expect(markers.first()).toHaveAttribute('tabindex', '0');

    const searchInput = page.getByPlaceholder(/Search events/i);
    await searchInput.fill('Boston');
    await expect(page.locator('.search-result-item').first()).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.search-result-item').first()).toHaveClass(/active/);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/explore\/1$/);
  });

  test('deep links open the requested chapter and event', async ({ page }) => {
    await page.goto('/#/explore/11');
    await expect(page.getByText('The turning tide').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'British Surrender at Saratoga' })).toBeVisible();
    await expect(page).toHaveURL(/#\/explore\/11$/);
  });

  test('data graphics expose sources and tables', async ({ page }) => {
    await page.getByRole('button', { name: 'Explore the data' }).click();
    await expect(page.getByRole('heading', { name: 'How an outmatched rebellion endured' })).toBeVisible();
    await expect(page.getByText('FIG. 01')).toBeVisible();
    await page.getByText('View data table').first().click();
    await expect(page.getByRole('table', { name: 'Troop strength by year' })).toBeVisible();
  });
});

test.describe('Mobile editorial experience', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile project only');

  test('bottom sheet supports progressive disclosure', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /begin the interactive story/i }).click();

    const sheet = page.locator('.bottom-sheet');
    await expect(sheet).toBeVisible();
    const handle = page.getByRole('button', { name: /event details are collapsed/i });
    await expect(handle).toBeVisible();
    await handle.click();
    await expect(page.getByRole('button', { name: /event details are half open/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Boston Tea Party' })).toBeVisible();
  });
});
