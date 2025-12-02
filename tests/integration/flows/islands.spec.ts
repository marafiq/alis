/**
 * ALIS Islands Demo E2E Tests
 * Tests that ALIS works with dynamically injected content
 */

import { test, expect } from '@playwright/test';

test.describe('Islands Demo', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to islands demo page (in demos folder)
    await page.goto('/demos/islands/');
    await page.waitForSelector('#add-island-btn');
  });

  test('page loads with Add Island button', async ({ page }) => {
    const button = page.locator('#add-island-btn');
    await expect(button).toBeVisible();
    await expect(button).toHaveText('➕ Add Island');
  });

  test('clicking Add Island creates a new island', async ({ page }) => {
    // Initially no island
    await expect(page.locator('.island')).not.toBeVisible();
    
    // Click Add Island
    await page.click('#add-island-btn');
    
    // Island should appear
    const island = page.locator('.island');
    await expect(island).toBeVisible();
    await expect(island.locator('h2')).toContainText('Time Island #1');
  });

  test('Update Time button fetches server time', async ({ page }) => {
    // Mock the time endpoint
    await page.route('**/api/time', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '12:34:56 PM'
      });
    });

    // Add island
    await page.click('#add-island-btn');
    await page.waitForSelector('.island');

    // Get the time display element
    const timeDisplay = page.locator('#time-display-1');
    
    // Initial text should be the placeholder
    await expect(timeDisplay).toContainText('Click "Update Time"');

    // Click Update Time
    await page.click('button:has-text("Update Time")');

    // Wait for the time to be updated
    await expect(timeDisplay).toHaveText('12:34:56 PM');
  });

  test('Increment Counter button updates counter', async ({ page }) => {
    // Mock the counter endpoint
    await page.route('**/api/counter', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '42'
      });
    });

    // Add island
    await page.click('#add-island-btn');
    await page.waitForSelector('.island');

    // Get the counter display element
    const counterDisplay = page.locator('#counter-1');
    
    // Initial counter should be 0
    await expect(counterDisplay).toHaveText('0');

    // Click Increment Counter
    await page.click('button:has-text("Increment Counter")');

    // Wait for the counter to be updated
    await expect(counterDisplay).toHaveText('42');
  });

  test('ALIS handles dynamically added elements via event delegation', async ({ page }) => {
    // Track API calls
    const apiCalls: string[] = [];
    await page.route('**/api/**', async route => {
      apiCalls.push(route.request().url());
      if (route.request().url().includes('/api/time')) {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '1:00:00 AM'
        });
      } else if (route.request().url().includes('/api/counter')) {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '99'
        });
      }
    });

    // Add island (content is added dynamically via innerHTML)
    await page.click('#add-island-btn');
    await page.waitForSelector('.island');

    // Click both buttons to verify ALIS picks up dynamically added elements
    await page.click('button:has-text("Update Time")');
    await page.waitForSelector('#time-display-1:has-text("1:00:00 AM")');

    await page.click('button:has-text("Increment Counter")');
    await page.waitForSelector('#counter-1:has-text("99")');

    // Verify API calls were made
    expect(apiCalls.some(url => url.includes('/api/time'))).toBe(true);
    expect(apiCalls.some(url => url.includes('/api/counter'))).toBe(true);
  });

  test('loading indicator is shown during request', async ({ page }) => {
    // Slow down the response
    await page.route('**/api/time', async route => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '3:00:00 PM'
      });
    });

    // Add island
    await page.click('#add-island-btn');
    await page.waitForSelector('.island');

    // Click Update Time
    const button = page.locator('button:has-text("Update Time")');
    await button.click();

    // Button should have is-loading class during request
    await expect(button).toHaveClass(/is-loading/);

    // Wait for response and verify loading class is removed
    await page.waitForSelector('#time-display-1:has-text("3:00:00 PM")');
    await expect(button).not.toHaveClass(/is-loading/);
  });
});

