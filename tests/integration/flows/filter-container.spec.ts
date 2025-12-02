import { test, expect } from '@playwright/test';

test.describe('Filter Container (Non-Form POST)', () => {
  test('collects values from container and POSTs', async ({ page }) => {
    await page.goto('/demos/filter-container/index.html');

    let capturedBody: Record<string, unknown> = {};
    let capturedMethod = '';
    await page.route('**/api/products/filter', async route => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      capturedMethod = route.request().method();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <div class="grid-row"><div>1</div><div>Product A</div><div>Active</div><div>$50</div></div>
          <div class="grid-row"><div>2</div><div>Product B</div><div>Active</div><div>$75</div></div>
        `
      });
    });

    // Set filter values
    await page.fill('#filter-name', 'Test Product');
    await page.selectOption('#filter-status', 'active');
    await page.fill('#filter-min-price', '25');
    await page.fill('#filter-max-price', '100');
    await page.fill('#filter-date', '2024-01-01');

    // Click apply filters
    await page.click('#apply-filters');

    // Verify request
    expect(capturedMethod).toBe('POST');
    expect(capturedBody.name).toBe('Test Product');
    expect(capturedBody.status).toBe('active');
    expect(capturedBody.minPrice).toBe('25');
    expect(capturedBody.maxPrice).toBe('100');
    expect(capturedBody.createdAfter).toBe('2024-01-01');

    // Verify grid updated
    await expect(page.locator('#grid-body')).toContainText('Product A');
    await expect(page.locator('#grid-body')).toContainText('Product B');
  });

  test('uses closest: selector to find container', async ({ page }) => {
    await page.goto('/demos/filter-container/index.html');

    let capturedBody: Record<string, unknown> = {};
    await page.route('**/api/products/filter', async route => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    await page.click('#apply-filters');

    // Should have collected from the filter-panel container
    expect(capturedBody).toHaveProperty('name');
    expect(capturedBody).toHaveProperty('status');
    expect(capturedBody).toHaveProperty('minPrice');
  });
});

