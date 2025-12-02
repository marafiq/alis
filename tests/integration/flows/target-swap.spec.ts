import { test, expect } from '@playwright/test';

test.describe('Target & Swap', () => {
  test('missing target does not crash', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    await page.route('**/api/submit', async route => {
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    // Remove the target element
    await page.evaluate(() => {
      document.getElementById('result')?.remove();
    });

    // Should not throw
    await page.click('form button[type="submit"]');
    
    // Wait a bit to ensure no crash
    await page.waitForTimeout(500);
    
    // Page should still be functional
    await expect(page.locator('form')).toBeVisible();
  });

  test('outerHTML swap replaces entire element', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    await page.route('**/api/submit', async route => {
      await route.fulfill({ status: 200, body: '<div id="result" class="replaced">New Content</div>', contentType: 'text/html' });
    });

    // Set swap to outerHTML
    await page.evaluate(() => {
      const form = document.querySelector('form');
      form?.setAttribute('data-alis-swap', 'outerHTML');
    });

    await page.click('form button[type="submit"]');
    
    await expect(page.locator('#result')).toHaveClass(/replaced/);
    await expect(page.locator('#result')).toHaveText('New Content');
  });

  test('swap none does not modify DOM', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    await page.route('**/api/submit', async route => {
      await route.fulfill({ status: 200, body: 'Should Not Appear', contentType: 'text/plain' });
    });

    await page.evaluate(() => {
      const form = document.querySelector('form');
      form?.setAttribute('data-alis-swap', 'none');
      const result = document.getElementById('result');
      if (result) result.textContent = 'Original';
    });

    await page.click('form button[type="submit"]');
    await page.waitForTimeout(500);
    
    await expect(page.locator('#result')).toHaveText('Original');
  });

  test('target without # prefix still works', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    await page.route('**/api/submit', async route => {
      await route.fulfill({ status: 200, body: 'Auto-prefixed', contentType: 'text/plain' });
    });

    // Set target without #
    await page.evaluate(() => {
      const form = document.querySelector('form');
      form?.setAttribute('data-alis-target', 'result');
    });

    await page.click('form button[type="submit"]');
    await expect(page.locator('#result')).toHaveText('Auto-prefixed');
  });

  test('JSON response is stringified for swap', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    await page.route('**/api/submit', async route => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Hello', count: 42 })
      });
    });

    await page.click('form button[type="submit"]');
    
    // Should contain the stringified JSON
    await expect(page.locator('#result')).toContainText('message');
    await expect(page.locator('#result')).toContainText('Hello');
  });
});

