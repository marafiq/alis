import { test, expect } from '@playwright/test';

test.describe('Validation Display', () => {
  test('displays multiple field errors from ProblemDetails', async ({ page }) => {
    await page.goto('/tests/integration/pages/form-submit-validation.html');
    
    await page.route('**/api/validate', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'validation',
          title: 'Validation Failed',
          errors: {
            email: ['Email is required', 'Email format invalid'],
            password: ['Password too short']
          }
        })
      });
    });

    await page.click('form button[type="submit"]');
    
    // Should display first error for email
    await expect(page.locator('[data-valmsg-for="email"]')).toContainText('Email is required');
    // Should display password error
    await expect(page.locator('[data-valmsg-for="password"]')).toContainText('Password too short');
  });

  test('clears previous errors on new submit', async ({ page }) => {
    await page.goto('/tests/integration/pages/form-submit-validation.html');
    
    let requestCount = 0;
    await page.route('**/api/validate', async route => {
      requestCount++;
      if (requestCount === 1) {
        await route.fulfill({
          status: 400,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'validation',
            title: 'Validation Failed',
            errors: { email: ['Email is required'] }
          })
        });
      } else {
        await route.fulfill({ status: 200, body: 'Success' });
      }
    });

    // First submit - should show error
    await page.click('form button[type="submit"]');
    await expect(page.locator('[data-valmsg-for="email"]')).toContainText('Email is required');

    // Fill in email and submit again
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('form button[type="submit"]');
    
    // Error should be cleared
    await expect(page.locator('[data-valmsg-for="email"]')).toHaveText('');
  });

  test('handles non-ProblemDetails 400 response', async ({ page }) => {
    await page.goto('/tests/integration/pages/form-submit-validation.html');
    
    await page.route('**/api/validate', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'text/plain',
        body: 'Bad Request'
      });
    });

    await page.click('form button[type="submit"]');
    
    // Should not crash, validation spans should remain empty or show generic error
    await expect(page.locator('[data-valmsg-for="email"]')).toHaveText('');
  });

  test('handles 422 Unprocessable Entity with ProblemDetails', async ({ page }) => {
    await page.goto('/tests/integration/pages/form-submit-validation.html');
    
    await page.route('**/api/validate', async route => {
      await route.fulfill({
        status: 422,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'validation',
          title: 'Unprocessable',
          errors: { email: ['Invalid domain'] }
        })
      });
    });

    await page.click('form button[type="submit"]');
    await expect(page.locator('[data-valmsg-for="email"]')).toContainText('Invalid domain');
  });
});

