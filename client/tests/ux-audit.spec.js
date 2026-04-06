import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('AmReViz UX & Accessibility Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (running on localhost:5174)
    await page.goto('http://localhost:5174/');
    // Wait for the welcome screen content to be definitely ready
    await page.waitForSelector('.welcome-content');
  });

  test('Welcome screen accessibility and main action', async ({ page }) => {
    // Check if the main heading is present
    await expect(page.getByRole('heading', { name: 'The American Revolution' })).toBeVisible();

    // Check accessibility of the welcome screen
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    console.log('Welcome Screen Accessibility Violations:', accessibilityScanResults.violations.length);
  });

  test('Map keyboard navigation validation', async ({ page }) => {
    // Go to Explore view using the ARIA label
    await page.click('button[aria-label*="Enter Explore mode"]');

    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });

    // Check if markers have tabindex="0" and role="button"
    const markers = page.locator('.custom-marker [role="button"]');
    await expect(markers.first()).toBeVisible();
    
    const count = await markers.count();
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const marker = markers.nth(i);
      const tabIndex = await marker.getAttribute('tabindex');
      expect(tabIndex).toBe('0');
      const role = await marker.getAttribute('role');
      expect(role).toBe('button');
    }
  });

  test('Search bar keyboard navigation validation', async ({ page }) => {
    // Go to Explore view
    await page.click('button[aria-label*="Enter Explore mode"]');
    
    // Find search input
    const searchInput = page.getByPlaceholder(/Search events/i);
    await searchInput.fill('Boston');
    
    // Wait for results
    await page.waitForSelector('.search-result-item');
    
    // Navigate results with arrow keys
    await page.keyboard.press('ArrowDown');
    
    // Check if first search result is highlighted/selected
    const firstResult = page.locator('.search-result-item').first();
    await expect(firstResult).toHaveClass(/active/);
    
    // Clear search
    await page.click('.search-clear-btn');
    await expect(searchInput).toHaveValue('');
  });

  test('Mobile bottom sheet baseline', async ({ page, isMobile }) => {
    if (!isMobile) return;

    // Go to Explore view
    await page.getByRole('button', { name: /Explore/i }).first().click();

    // Check for bottom sheet
    await expect(page.locator('.bottom-sheet')).toBeVisible();
    
    // Check for nested scroll indicators (Timeline inside bottom sheet)
    const timelineInSheet = await page.locator('.bottom-sheet .horizontal-timeline').count();
    expect(timelineInSheet).toBeGreaterThan(0);
  });
});
