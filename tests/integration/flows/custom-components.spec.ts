import { test, expect } from '@playwright/test';

test.describe('Custom Components (Syncfusion-like)', () => {
  test('reads values from custom selectors', async ({ page }) => {
    await page.goto('/demos/custom-components/index.html');

    let capturedBody: Record<string, unknown> = {};
    await page.route('**/api/custom-components', async route => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        body: 'OK',
        contentType: 'text/plain'
      });
    });

    // Select an item in the custom dropdown
    await page.click('#department-dropdown');
    await page.click('.sf-dropdown-item[data-value="engineering"]');

    // Submit the form
    await page.click('#custom-form button[type="submit"]');
    await expect(page.locator('#custom-result')).toHaveText('OK');

    // Verify custom component values were collected
    expect(capturedBody.department).toBe('engineering');
    expect(capturedBody.startDate).toBe('2024-01-15');
    expect(capturedBody.skills).toBe('javascript,typescript');
    expect(capturedBody.salary).toBe('75000');
    expect(capturedBody.notes).toBe('Standard textarea works normally');
  });

  test('custom value function is called', async ({ page }) => {
    await page.goto('/demos/custom-components/index.html');

    let capturedBody: Record<string, unknown> = {};
    await page.route('**/api/custom-components', async route => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    // Remove one skill tag
    await page.click('#skills-tags .sf-tag[data-value="typescript"] .sf-tag-remove');

    await page.click('#custom-form button[type="submit"]');

    // Skills should only have javascript now
    expect(capturedBody.skills).toBe('javascript');
  });

  test('numeric component updates via buttons', async ({ page }) => {
    await page.goto('/demos/custom-components/index.html');

    let capturedBody: Record<string, unknown> = {};
    await page.route('**/api/custom-components', async route => {
      capturedBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    // Increase salary twice
    await page.click('#salary-numeric button:last-child'); // +1000
    await page.click('#salary-numeric button:last-child'); // +1000

    await page.click('#custom-form button[type="submit"]');

    expect(capturedBody.salary).toBe('77000');
  });
});

