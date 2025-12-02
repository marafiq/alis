import { test, expect } from '@playwright/test';

test('state: restores button state after success', async ({ page }) => {
  await page.goto('/demos/programmatic/index.html');
  
  await page.route('**/api/programmatic/save', async route => {
    // Hold request to verify disabled state
    await new Promise(r => setTimeout(r, 200)); 
    await route.fulfill({ status: 200, body: 'OK' });
  });

  const button = page.locator('#programmatic-save');
  const promise = button.click();
  
  // While request is pending, should be disabled
  // We use a short wait to ensure the click processed and pipeline started
  await page.waitForTimeout(50); 
  await expect(button).toBeDisabled();
  
  await promise;
  
  // After finish, should be enabled
  await expect(button).toBeEnabled();
});

test('state: restores button state after error', async ({ page }) => {
  await page.goto('/demos/programmatic/index.html');
  
  await page.route('**/api/programmatic/save', async route => {
    await route.abort('failed');
  });

  const button = page.locator('#programmatic-save');
  await button.click();
  
  await expect(page.locator('#programmatic-result')).toContainText('Error');
  await expect(button).toBeEnabled();
});

