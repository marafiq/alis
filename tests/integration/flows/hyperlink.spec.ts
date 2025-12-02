import { test, expect } from '@playwright/test';

test.describe('Hyperlink Demo', () => {
  test('clicking link fetches content without navigation', async ({ page }) => {
    await page.route('**/api/links?item=alpha', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<article><h3>Alpha Feature</h3><p>Alpha copy.</p></article>'
      });
    });

    await page.goto('/demos/hyperlink/index.html');
    const initialUrl = page.url();

    await page.click('a[href="#feature-alpha"]');
    await expect(page.locator('#link-result')).toContainText('Alpha Feature');
    expect(page.url()).toBe(initialUrl);
  });

  test('indicator toggles while hyperlink request is in flight', async ({ page }) => {
    await page.route('**/api/links?item=beta', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 400));
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<article><h3>Beta Feature</h3><p>Beta copy.</p></article>'
      });
    });

    await page.goto('/demos/hyperlink/index.html');

    const spinner = page.locator('#link-spinner');
    await expect(spinner).toBeHidden();

    await page.click('a[href="#feature-beta"]');
    await expect(spinner).toBeVisible();
    await expect(page.locator('#link-result')).toContainText('Beta Feature');
    await expect(spinner).toBeHidden();
  });
});

