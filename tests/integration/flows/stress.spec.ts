/**
 * Stress Testing & Edge Cases
 * 
 * These tests explore race conditions, error handling, and complex data scenarios.
 */
import { test, expect } from '@playwright/test';

async function waitForALIS(page) {
  await page.waitForFunction(() => {
    const w = window;
    return w.__ALIS_INIT === true || w.ALIS !== undefined;
  });
}

test.describe('Stress Test 1: Concurrency & Race Conditions', () => {
  test('handles rapid-fire submissions correctly (ignore strategy)', async ({ page }) => {
    await page.goto('/tests/integration/pages/form-submit.html');
    await waitForALIS(page);

    let requestCount = 0;
    await page.route('**/api/users', async (route) => {
      requestCount++;
      // Simulate slow server
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<div>Response ${requestCount}</div>`
      });
    });

    // Click 10 times rapidly
    for (let i = 0; i < 10; i++) {
      await page.click('button[type="submit"]', { force: true });
    }

    // Wait for everything to settle
    await page.waitForTimeout(1000);

    // Should only process ONE request (default ignore strategy)
    expect(requestCount).toBe(1);
    await expect(page.locator('#fixture-result')).toContainText('Response 1');
  });

  test('handles abort-previous strategy correctly', async ({ page }) => {
    await page.goto('/tests/integration/pages/form-submit.html');
    await waitForALIS(page);

    // Change strategy to abort-previous
    await page.evaluate(() => {
      const form = document.querySelector('form');
      form.setAttribute('data-alis-concurrency', 'abort-previous');
      form.setAttribute('data-alis-duplicate-request', 'abort-previous');
    });

    let requestsStarted = 0;

    await page.route('**/api/users', async (route) => {
      requestsStarted++;
      const id = requestsStarted;
      await new Promise(resolve => setTimeout(resolve, id === 1 ? 800 : 200));
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<div>Response ${id}</div>`
      });
    });

    const result = page.locator('#fixture-result');

    // Click, wait a bit, click again
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100); // Allow first request to start
    await expect(result).toHaveText('Awaiting response...');
    await page.click('button[type="submit"]'); // Should abort first

    await expect(result).toContainText('Response 2', { timeout: 2000 });
    await page.waitForTimeout(600);
    await expect(result).toContainText('Response 2');

    expect(requestsStarted).toBe(2);
  });
});

test.describe('Stress Test 2: Error Handling & Recovery', () => {
  test('recovers gracefully from network timeout', async ({ page }) => {
    await page.goto('/tests/integration/pages/form-submit.html');
    await waitForALIS(page);

    await page.route('**/api/users', async (route) => {
      // Simulate connection failure
      await route.abort('connectionrefused');
    });

    const btn = page.locator('button[type="submit"]');
    await btn.click();

    // Button should be re-enabled
    await expect(btn).toBeEnabled();
    await expect(btn).not.toHaveAttribute('aria-busy');
  });

  test('handles invalid JSON response gracefully', async ({ page }) => {
    await page.goto('/demos/methods/index.html');
    await waitForALIS(page);

    await page.evaluate(() => {
      const btn = document.getElementById('btn-post');
      btn.setAttribute('data-alis-serialize', 'json');
    });

    await page.route('**/api/resource', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json', // Claim it's JSON
        body: '{ invalid json here ' // But send garbage
      });
    });

    // Listen for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.click('#btn-post');
    await page.waitForTimeout(500);

    // Should not crash, button enabled
    await expect(page.locator('#btn-post')).toBeEnabled();
  });
});

test.describe('Stress Test 3: Complex Data Collection', () => {
  test('collects mixture of disabled, readonly, hidden, and array fields', async ({ page }) => {
    await page.goto('/tests/integration/pages/form-submit.html');
    await waitForALIS(page);

    // Inject complex form
    await page.evaluate(() => {
      document.body.innerHTML = `
        <form data-alis-post="/api/complex" data-alis-target="#result">
          <input type="text" name="visible" value="visible">
          <input type="text" name="disabled" value="disabled" disabled>
          <input type="text" name="readonly" value="readonly" readonly>
          <input type="hidden" name="hidden" value="hidden">
          
          <input type="checkbox" name="tags" value="a" checked>
          <input type="checkbox" name="tags" value="b" checked>
          <input type="checkbox" name="tags" value="c">
          
          <input type="text" name="nested.prop" value="nested">
          <input type="text" name="array[0].val" value="arr0">
          
          <button type="submit">Submit</button>
        </form>
        <div id="result"></div>
      `;
      ALIS.init();
    });

    let capturedBody;
    await page.route('**/api/complex', async (route) => {
      const rawBody = route.request().postData();
      // Parse FormData manually or use a library, simplified check here
      capturedBody = rawBody; 
      await route.fulfill({ status: 200, body: 'OK' });
    });

    await page.click('button[type="submit"]');

    // disabled should NOT be present
    expect(capturedBody).not.toContain('name="disabled"');
    
    // readonly SHOULD be present
    expect(capturedBody).toContain('name="readonly"');
    
    // hidden SHOULD be present
    expect(capturedBody).toContain('name="hidden"');
    
    // array values
    expect(capturedBody).toContain('name="tags"\r\n\r\na');
    expect(capturedBody).toContain('name="tags"\r\n\r\nb');
    expect(capturedBody).not.toContain('name="tags"\r\n\r\nc');
    
    // nested
    expect(capturedBody).toContain('name="nested.prop"');
    expect(capturedBody).toContain('name="array[0].val"');
  });
});
