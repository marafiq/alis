import { test, expect } from '@playwright/test';

test('retry: retries on 500 error', async ({ page }) => {
  await page.goto('/demos/programmatic/index.html');

  let attempt = 0;
  await page.route('**/api/programmatic/save', async route => {
    attempt++;
    if (attempt === 1) {
      await route.fulfill({ status: 500, body: 'Server Error' });
    } else {
      await route.fulfill({ status: 200, body: 'Retry Success', contentType: 'text/plain' });
    }
  });

  // We need to inject config to enable retries if they are not default
  // But default is 3 attempts.
  await page.click('#programmatic-save');

  await expect(page.locator('#programmatic-result')).toHaveText('Retry Success');
  expect(attempt).toBe(2);
});

test('retry: gives up after max attempts', async ({ page }) => {
  await page.goto('/demos/programmatic/index.html');

  let attempt = 0;
  await page.route('**/api/programmatic/save', async route => {
    attempt++;
    await route.fulfill({ status: 500, body: 'Persistent Error' });
  });

  await page.click('#programmatic-save');

  // Should eventually fail
  await expect(page.locator('#programmatic-result')).toContainText('Error');
  // Default maxAttempts is 3
  expect(attempt).toBe(3);
});

