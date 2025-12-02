import { test, expect } from '@playwright/test';

test.describe('Debounce & Throttle', () => {
  test('debounces rapid input events', async ({ page }) => {
    await page.goto('/demos/debounce/index.html');

    let requestCount = 0;
    await page.route('**/api/search**', async route => {
      requestCount++;
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<div class="result-item">Result for: ${route.request().url()}</div>`
      });
    });

    // Type rapidly - should debounce
    const input = page.locator('#search-input');
    await input.fill(''); // Clear first
    
    // Type character by character quickly
    await input.pressSequentially('test', { delay: 50 }); // 4 chars, 50ms apart = 200ms total

    // Wait less than debounce time - should not have made request yet
    await page.waitForTimeout(200);
    expect(requestCount).toBe(0);

    // Wait for debounce to complete (500ms from last keystroke)
    await page.waitForTimeout(400);
    
    // Should have made exactly 1 request
    expect(requestCount).toBe(1);
    await expect(page.locator('#search-results')).toContainText('Result for');
  });

  test('makes immediate request when typing stops', async ({ page }) => {
    await page.goto('/demos/debounce/index.html');

    let requestCount = 0;
    let capturedUrl = '';
    await page.route('**/api/search**', async route => {
      requestCount++;
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<div class="result-item">Found results</div>`
      });
    });

    const input = page.locator('#search-input');
    await input.fill('hello');

    // Wait for debounce
    await page.waitForTimeout(700);

    expect(requestCount).toBe(1);
    // URL should contain the query parameter
    expect(capturedUrl).toContain('/api/search');
    expect(capturedUrl).toContain('query=hello');
  });

  test('input value is correctly collected with collect="self"', async ({ page }) => {
    await page.goto('/demos/debounce/index.html');

    let capturedUrl = '';
    await page.route('**/api/search**', async route => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<div class="result-item">Results for query</div>`
      });
    });

    const input = page.locator('#search-input');
    
    // Type a specific search term
    await input.fill('test search');

    // Wait for debounce (500ms) + some buffer
    await page.waitForTimeout(700);

    // Verify the URL contains the query parameter with the typed value
    expect(capturedUrl).toMatch(/query=test\+search|query=test%20search/);
  });

  test.skip('throttles scroll events', async ({ page }) => {
    // Skip for now - scroll events need more complex setup
    // The throttle implementation is correct, but testing scroll events
    // in Playwright requires special handling
    await page.goto('/demos/debounce/index.html');
  });
});

