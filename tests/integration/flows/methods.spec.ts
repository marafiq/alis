import { test, expect } from '@playwright/test';

test.describe('HTTP Methods', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/methods/index.html');
  });

  ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].forEach(method => {
    test(`sends ${method} request correctly`, async ({ page }) => {
      await page.route('**/api/resource', async route => {
        const req = route.request();
        if (req.method() !== method) {
          await route.fulfill({ status: 405, body: `Expected ${method} but got ${req.method()}`, contentType: 'text/plain' });
          return;
        }
        await route.fulfill({ status: 200, body: `${method} Success`, contentType: 'text/plain' });
      });

      await page.click(`#btn-${method.toLowerCase()}`);
      await expect(page.locator('#result')).toHaveText(`${method} Success`);
    });
  });
});
