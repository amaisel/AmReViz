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

  test('late deep links settle on the requested event', async ({ page }) => {
    await page.goto('/#/explore/18');
    await expect(page.getByRole('heading', { name: 'Washington Resigns Commission' })).toBeVisible();
    await expect(page.locator('.explore-status')).toHaveAttribute('aria-label', 'Event 18 of 18');
    await expect(page).toHaveURL(/#\/explore\/18$/);
    await page.waitForTimeout(1200);
    await expect(page.locator('.explore-status')).toHaveAttribute('aria-label', 'Event 18 of 18');
    await expect(page).toHaveURL(/#\/explore\/18$/);
  });

  test('final event offers replay instead of a stuck pause state', async ({ page }) => {
    await page.goto('/#/explore/18');
    await expect(page.locator('.explore-status')).toHaveAttribute('aria-label', 'Event 18 of 18');

    const playback = page.locator('button.explore-btn.primary');
    await expect(playback).toHaveText('Replay');
    await playback.click();
    await expect(page.locator('.explore-status')).toHaveAttribute('aria-label', 'Event 1 of 18');
    await expect(playback).toHaveText('Pause');
    await expect(playback).toHaveAttribute('aria-pressed', 'true');
  });

  test('data graphics expose sources and tables', async ({ page }) => {
    await page.getByRole('button', { name: 'Explore the data' }).click();
    await expect(page.getByRole('heading', { name: 'How an outmatched rebellion endured' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'An army built and rebuilt' })).toHaveAttribute('id', 'forces-title');
    await expect(page.getByText('FIG. 01')).toBeVisible();
    await page.getByText('View data table').first().click();
    await expect(page.getByRole('table', { name: 'Troop strength by year' })).toBeVisible();
  });
});

test.describe('Desktop story interactions', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop project only');

  test('story navigation syncs the URL without fighting scroll', async ({ page }) => {
    await page.goto('/#/explore');
    await expect(page.locator('.desktop-story')).toBeVisible();
    await expect(page.locator('.story-step')).toHaveCount(18);
    await page.evaluate(() => {
      window.__scrollCalls = [];
      Element.prototype.scrollIntoView = function scrollIntoView(options) {
        window.__scrollCalls.push({
          index: this.dataset?.eventIndex,
          behavior: options?.behavior ?? 'auto',
        });
      };
      document.activeElement?.blur();
    });

    await page.keyboard.press('ArrowDown');

    await expect(page.locator('.explore-status')).toHaveAttribute('aria-label', 'Event 2 of 18');
    await expect(page).toHaveURL(/#\/explore\/2$/);
    await expect.poll(async () => page.evaluate(() => window.__scrollCalls)).toEqual([
      { index: '1', behavior: 'smooth' },
    ]);
  });

  test('keyboard shortcuts dialog blocks story shortcuts', async ({ page }) => {
    await page.goto('/#/explore');
    await expect(page.locator('.desktop-story')).toBeVisible();
    await page.getByRole('button', { name: 'Show keyboard shortcuts' }).click();

    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close keyboard shortcuts' })).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(page.locator('.explore-status')).toHaveAttribute('aria-label', 'Event 1 of 18');
    await expect(page.locator('button.explore-btn.primary')).toHaveText(/Play|Replay/);
  });

  test('timeline space selection does not toggle playback', async ({ page }) => {
    await page.goto('/#/explore');
    await expect(page.locator('.desktop-story')).toBeVisible();
    await page.getByRole('button', { name: 'Timeline' }).click();

    const secondEvent = page.locator('.h-timeline-event', { hasText: 'First Continental Congress' });
    await secondEvent.focus();
    await page.keyboard.press('Space');

    await expect(page).toHaveURL(/#\/explore\/2$/);
    await expect(page.locator('.explore-status')).toHaveAttribute('aria-label', 'Event 2 of 18');
    await expect(page.locator('button.explore-btn.primary')).toHaveText('Play');
    await expect(page.locator('button.explore-btn.primary')).toHaveAttribute('aria-pressed', 'false');
  });

  test('timeline jumps settle without intermediate event flicker', async ({ page }) => {
    await page.goto('/#/explore');
    await expect(page.locator('.desktop-story')).toBeVisible();
    await page.getByRole('button', { name: 'Timeline' }).click();

    await page.evaluate(() => {
      window.__statuses = [];
      const status = document.querySelector('.explore-status');
      const push = () => {
        const value = status?.getAttribute('aria-label');
        if (value && window.__statuses[window.__statuses.length - 1] !== value) {
          window.__statuses.push(value);
        }
      };
      push();
      new MutationObserver(push).observe(status, { attributes: true, childList: true, subtree: true });
    });

    await page.locator('.h-timeline-event', { hasText: 'British Surrender at Saratoga' }).click();
    await expect(page.locator('.explore-status')).toHaveAttribute('aria-label', 'Event 11 of 18');
    await expect(page).toHaveURL(/#\/explore\/11$/);
    await page.waitForTimeout(900);

    const statuses = await page.evaluate(() => window.__statuses);
    expect(statuses.filter((value) => value !== 'Event 1 of 18' && value !== 'Event 11 of 18')).toEqual([]);
    expect(statuses.at(-1)).toBe('Event 11 of 18');
  });
});

test.describe('Tablet story layout', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop project only');
  test.use({ viewport: { width: 850, height: 900 } });

  test('centers the active marker in the compact layout', async ({ page }) => {
    await page.goto('/#/explore/1');
    await expect(page.locator('.mobile-story')).toBeVisible();
    await expect(page.locator('.marker-pulse-ring')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(900);

    const geometry = await page.evaluate(() => {
      const map = document.querySelector('.leaflet-container').getBoundingClientRect();
      const marker = document
        .querySelector('.marker-pulse-ring')
        .closest('.leaflet-marker-icon')
        .getBoundingClientRect();
      return {
        mapCenter: map.left + map.width / 2,
        markerCenter: marker.left + marker.width / 2,
      };
    });

    expect(Math.abs(geometry.markerCenter - geometry.mapCenter)).toBeLessThan(24);
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
