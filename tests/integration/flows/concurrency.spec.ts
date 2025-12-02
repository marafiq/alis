import { test, expect } from '@playwright/test';

test('concurrency: ignores duplicate clicks by default', async ({ page }) => {
  await page.goto('/demos/programmatic/index.html');

  let requestCount = 0;
  await page.route('**/api/programmatic/save', async route => {
    requestCount++;
    // Simulate slow network
    await new Promise(r => setTimeout(r, 500));
    await route.fulfill({
      status: 200,
      body: 'Saved',
      contentType: 'text/plain'
    });
  });

  // Click twice rapidly - use force to bypass disabled check
  // This tests the coordination layer, not the button disabled state
  const btn = page.locator('#programmatic-save');
  await btn.click();
  await btn.click({ force: true }); // Force click even if disabled

  // Wait for result
  await expect(page.locator('#programmatic-result')).toHaveText('Saved');
  expect(requestCount).toBe(1);

  // NEW: Assert that the system reset correctly so we can click again
  // This currently fails because ACTIVE_REQUESTS is never cleared
  await page.click('#programmatic-save');
  await expect(page.locator('#programmatic-result')).toHaveText('Saved'); 
  expect(requestCount).toBe(2);
});

test('concurrency: abort-previous strategy cancels first request', async ({ page: _page }) => {
  // We need a way to configure strategy dynamically or use a different button
  // For now, we'll skip until we have a way to set config in the demo page
  // or we add a new button with data-alis-duplicate-request="abort-previous"
});

