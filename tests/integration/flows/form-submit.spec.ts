import { expect, test } from '@playwright/test';

test.describe('Form submit fixtures', () => {
  test('loads the default form fixture', async ({ page }) => {
    await page.goto('/tests/integration/pages/form-submit.html');
    await expect(page.locator('#fixture-form')).toBeVisible();
    await expect(page.locator('#fixture-result')).toContainText('Awaiting response');
  });

  test('loads the validation form fixture', async ({ page }) => {
    await page.goto('/tests/integration/pages/form-submit-validation.html');
    await expect(page.locator('#fixture-validation-form')).toBeVisible();
    await expect(page.locator('[data-valmsg-for="email"]')).toHaveText('');
  });
});

