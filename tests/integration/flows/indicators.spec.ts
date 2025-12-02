import { test, expect } from '@playwright/test';

test.describe('Loading Indicators', () => {
  test('adds class to trigger element during request', async ({ page }) => {
    await page.goto('/demos/indicators/index.html');
    
    await page.route('**/api/slow', async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 200, body: 'Done' });
    });

    const button = page.locator('button[data-alis-post]');
    const clickPromise = button.click();
    
    await page.waitForTimeout(100);
    await expect(button).toHaveClass(/is-loading/);
    
    await clickPromise;
    await expect(button).not.toHaveClass(/is-loading/);
  });

  test('shows hidden indicator element', async ({ page }) => {
    await page.goto('/demos/indicators/index.html');
    
    await page.route('**/api/slow', async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 200, body: 'Done' });
    });

    // Assuming there's a #spinner element
    const spinner = page.locator('#spinner');
    
    // Initially hidden
    await expect(spinner).toBeHidden();
    
    const button = page.locator('button[data-alis-post]');
    const clickPromise = button.click();
    
    await page.waitForTimeout(100);
    await expect(spinner).toBeVisible();
    
    await clickPromise;
    await expect(spinner).toBeHidden();
  });

  test('aria-busy is set during request', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    await page.route('**/api/submit', async route => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({ status: 200, body: 'Done' });
    });

    const form = page.locator('form');
    const clickPromise = page.click('form button[type="submit"]');
    
    await page.waitForTimeout(100);
    await expect(form).toHaveAttribute('aria-busy', 'true');
    
    await clickPromise;
    await expect(form).not.toHaveAttribute('aria-busy', 'true');
  });
});

