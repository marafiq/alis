import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('console', message => {
    // Surface browser console output when running tests
    // eslint-disable-next-line no-console
    console.log('[browser]', message.type(), message.text());
  });
});

test.describe('Form submit flows', () => {
  test('swaps target on success', async ({ page }) => {
    await page.route('**/api/users', route =>
      route.fulfill({
        status: 200,
        body: '<p>Saved!</p>',
        headers: { 'Content-Type': 'text/html' }
      })
    );

    await page.goto('/tests/integration/pages/form-submit.html');
    await page.waitForFunction(() => {
      const w = window as typeof window & { __ALIS_INIT?: boolean };
      return w.__ALIS_INIT === true;
    });
    await page.fill('#fixture-form input[name="email"]', 'new@example.com');
    await page.click('#fixture-form button[type="submit"]');
    await expect(page).toHaveURL(/form-submit\.html$/);

    await expect(page.locator('#fixture-result')).toContainText('Saved!');
  });

  test('shows validation errors from problem details', async ({ page }) => {
    await page.route('**/api/users', route =>
      route.fulfill({
        status: 400,
        body: JSON.stringify({
          title: 'Invalid',
          errors: { email: ['Email is required'] }
        }),
        headers: { 'Content-Type': 'application/problem+json' }
      })
    );

    await page.goto('/tests/integration/pages/form-submit-validation.html');
    await page.waitForFunction(() => {
      const w = window as typeof window & { __ALIS_INIT?: boolean };
      return w.__ALIS_INIT === true;
    });
    await page.click('#fixture-validation-form button[type="submit"]');
    await expect(page).toHaveURL(/form-submit-validation\.html$/);

    await expect(page.locator('[data-valmsg-for="email"]')).toContainText('Email is required');
  });

  test('disables submit button during request', async ({ page }) => {
    await page.route('**/api/users', async route => {
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.fulfill({
        status: 200,
        body: '<p>Done</p>',
        headers: { 'Content-Type': 'text/html' }
      });
    });

    await page.goto('/tests/integration/pages/form-submit.html');
    await page.waitForFunction(() => {
      const w = window as typeof window & { __ALIS_INIT?: boolean };
      return w.__ALIS_INIT === true;
    });
    const button = page.locator('#fixture-form button[type="submit"]');
    await page.click('#fixture-form button[type="submit"]');

    await expect(button).toBeDisabled();
    await expect(button).toBeEnabled();
  });
});

