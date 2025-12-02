/**
 * Critical Happy Path Tests
 * 
 * These tests cover the 90% use cases that users will encounter most frequently.
 * Each test verifies the complete flow from user interaction to final DOM state.
 * 
 * Uses existing fixtures and demos to ensure tests are reliable.
 */
import { test, expect } from '@playwright/test';

// Helper to wait for ALIS initialization
async function waitForALIS(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    const w = window as typeof window & { __ALIS_INIT?: boolean; ALIS?: unknown };
    return w.__ALIS_INIT === true || w.ALIS !== undefined;
  });
}

test.describe('Happy Path 1: Form POST with target swap', () => {
  test('submits form and swaps HTML into target', async ({ page }) => {
    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="success">User created successfully!</div>'
      });
    });

    await page.goto('/tests/integration/pages/form-submit.html');
    await waitForALIS(page);

    await page.fill('[name="email"]', 'john@example.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('#fixture-result')).toContainText('User created successfully!');
  });

  test('disables submit button during request', async ({ page }) => {
    await page.route('**/api/users', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div>Done</div>'
      });
    });

    await page.goto('/tests/integration/pages/form-submit.html');
    await waitForALIS(page);

    await page.fill('[name="email"]', 'test@test.com');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    await expect(submitButton).toBeDisabled();
    await expect(page.locator('#fixture-result')).toContainText('Done');
    await expect(submitButton).toBeEnabled();
  });

  test('sets aria-busy on form during request', async ({ page }) => {
    await page.route('**/api/users', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div>Done</div>'
      });
    });

    await page.goto('/tests/integration/pages/form-submit.html');
    await waitForALIS(page);

    await page.fill('[name="email"]', 'test@test.com');
    
    const form = page.locator('form');
    await page.click('button[type="submit"]');
    
    await expect(form).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#fixture-result')).toContainText('Done');
    await expect(form).not.toHaveAttribute('aria-busy');
  });
});

test.describe('Happy Path 2: Form POST with validation errors (ProblemDetails)', () => {
  test('displays validation errors next to fields', async ({ page }) => {
    await page.route('**/api/validate', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Validation failed',
          status: 400,
          errors: {
            email: ['Email is required'],
            password: ['Password is required']
          }
        })
      });
    });

    await page.goto('/tests/integration/pages/form-submit-validation.html');
    await waitForALIS(page);

    await page.click('button[type="submit"]');

    await expect(page.locator('[data-valmsg-for="email"]')).toContainText('Email is required');
    await expect(page.locator('[data-valmsg-for="password"]')).toContainText('Password is required');
  });

  test('clears previous errors on new submission', async ({ page }) => {
    await page.route('**/api/validate', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Validation failed',
          status: 400,
          errors: { email: ['Email is required'] }
        })
      });
    });

    await page.goto('/tests/integration/pages/form-submit-validation.html');
    await waitForALIS(page);

    await page.click('button[type="submit"]');
    await expect(page.locator('[data-valmsg-for="email"]')).toContainText('Email is required');

    await page.unroute('**/api/validate');
    await page.route('**/api/validate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div>Success!</div>'
      });
    });

    await page.fill('[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-valmsg-for="email"]')).toBeEmpty();
  });

  test('sets aria-invalid on invalid fields', async ({ page }) => {
    await page.route('**/api/validate', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Validation failed',
          status: 400,
          errors: { email: ['Invalid email'] }
        })
      });
    });

    await page.goto('/tests/integration/pages/form-submit-validation.html');
    await waitForALIS(page);

    await page.click('button[type="submit"]');

    await expect(page.locator('[name="email"]')).toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('Happy Path 3: Debounced search input', () => {
  test('debounces rapid input events', async ({ page }) => {
    await page.goto('/demos/debounce/index.html');
    await waitForALIS(page);

    let requestCount = 0;
    let lastQuery = '';
    
    await page.route('**/api/search**', async (route) => {
      requestCount++;
      const url = new URL(route.request().url());
      lastQuery = url.searchParams.get('query') || '';
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<div class="result-item">Results for: ${lastQuery}</div>`
      });
    });

    const input = page.locator('#search-input');
    await input.fill('');
    await input.pressSequentially('hello', { delay: 50 });

    // Wait for debounce to complete (500ms + buffer)
    await page.waitForTimeout(700);

    expect(requestCount).toBe(1);
    expect(lastQuery).toBe('hello');
  });

  test('maintains focus while typing', async ({ page }) => {
    await page.goto('/demos/debounce/index.html');
    await waitForALIS(page);

    await page.route('**/api/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="result-item">Found results</div>'
      });
    });

    const input = page.locator('#search-input');
    await input.focus();
    await input.fill('test');
    
    // Wait for debounce and swap
    await page.waitForTimeout(700);
    await expect(page.locator('#search-results')).toContainText('Found results');
    
    // Focus should still be on input
    await expect(input).toBeFocused();
  });

  test('input is NOT disabled during debounced request', async ({ page }) => {
    await page.goto('/demos/debounce/index.html');
    await waitForALIS(page);

    await page.route('**/api/search**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="result-item">Results</div>'
      });
    });

    const input = page.locator('#search-input');
    await input.focus();
    await input.fill('a');
    
    // Wait for debounce to trigger (500ms)
    await page.waitForTimeout(550);
    
    // Input should NOT be disabled during request
    await expect(input).toBeEnabled();
    
    // Wait for completion
    await expect(page.locator('#search-results')).toContainText('Results');
  });
});

test.describe('Happy Path 4: Client-side validation', () => {
  test('prevents submission when validation fails', async ({ page }) => {
    await page.goto('/demos/client-validation/index.html');
    await waitForALIS(page);

    let requestMade = false;
    await page.route('**/api/**', async (route) => {
      requestMade = true;
      await route.fulfill({ status: 200, body: 'OK' });
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(200);

    expect(requestMade).toBe(false);
    await expect(page.locator('[data-valmsg-for="Employee.FirstName"]')).not.toBeEmpty();
  });

  test('clears errors as user types valid values', async ({ page }) => {
    await page.goto('/demos/client-validation/index.html');
    await waitForALIS(page);

    await page.click('button[type="submit"]');
    await expect(page.locator('[data-valmsg-for="Employee.FirstName"]')).not.toBeEmpty();

    await page.fill('[name="Employee.FirstName"]', 'John');
    await page.waitForTimeout(200);
    
    await expect(page.locator('[data-valmsg-for="Employee.FirstName"]')).toBeEmpty();
  });

  test('submits successfully when all validations pass', async ({ page }) => {
    await page.goto('/demos/client-validation/index.html');
    await waitForALIS(page);

    let requestMade = false;
    await page.route('**/api/employees', async (route) => {
      requestMade = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Employee registered!' })
      });
    });

    // Fill all required fields (use input[] selector for clarity)
    await page.fill('input[name="Employee.FirstName"]', 'John');
    await page.fill('input[name="Employee.LastName"]', 'Doe');
    await page.fill('input[name="Employee.Email"]', 'john@example.com');
    await page.fill('input[name="Employee.Address.Street"]', '123 Main St');
    await page.fill('input[name="Employee.Address.City"]', 'New York');
    await page.fill('input[name="Employee.Address.ZipCode"]', '10001');
    await page.selectOption('select[name="Employee.Department"]', 'engineering');
    await page.fill('input[name="Employee.Salary"]', '75000');
    await page.fill('input[name="Employee.StartDate"]', '2024-01-15');
    await page.fill('input[name="Employee.EmergencyContacts[0].Name"]', 'Jane Doe');
    await page.fill('input[name="Employee.EmergencyContacts[0].Phone"]', '+1 555-987-6543');
    await page.fill('input[name="Password"]', 'securepass123');
    await page.fill('input[name="ConfirmPassword"]', 'securepass123');

    await page.click('button[type="submit"]');

    // Wait for success message in result area
    await expect(page.locator('#form-result')).toContainText('Employee Registered', { timeout: 5000 });
    expect(requestMade).toBe(true);
  });
});

test.describe('Happy Path 5: Button click with data-alis-{method}', () => {
  test('GET method works', async ({ page }) => {
    await page.goto('/demos/methods/index.html');
    await waitForALIS(page);

    let capturedMethod = '';
    await page.route('**/api/resource**', async (route) => {
      capturedMethod = route.request().method();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div>Resource loaded</div>'
      });
    });

    await page.click('#btn-get');
    
    await expect(page.locator('#result')).toContainText('Resource loaded');
    expect(capturedMethod).toBe('GET');
  });

  test('POST method works', async ({ page }) => {
    await page.goto('/demos/methods/index.html');
    await waitForALIS(page);

    let capturedMethod = '';
    await page.route('**/api/resource', async (route) => {
      capturedMethod = route.request().method();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div>Resource created</div>'
      });
    });

    await page.click('#btn-post');
    
    await expect(page.locator('#result')).toContainText('Resource created');
    expect(capturedMethod).toBe('POST');
  });

  test('DELETE method works', async ({ page }) => {
    await page.goto('/demos/methods/index.html');
    await waitForALIS(page);

    let capturedMethod = '';
    await page.route('**/api/resource', async (route) => {
      capturedMethod = route.request().method();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div>Resource deleted</div>'
      });
    });

    await page.click('#btn-delete');
    
    await expect(page.locator('#result')).toContainText('Resource deleted');
    expect(capturedMethod).toBe('DELETE');
  });
});

test.describe('Edge Cases and Regression Prevention', () => {
  test('multiple rapid clicks only trigger one request (concurrency)', async ({ page }) => {
    await page.goto('/demos/methods/index.html');
    await waitForALIS(page);

    let requestCount = 0;
    await page.route('**/api/resource**', async (route) => {
      requestCount++;
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `<div>Request ${requestCount}</div>`
      });
    });

    const btn = page.locator('#btn-get');
    await btn.click();
    await btn.click({ force: true });
    await btn.click({ force: true });

    await expect(page.locator('#result')).toContainText('Request');

    // Only ONE request should have been made (others ignored by coordinator)
    expect(requestCount).toBe(1);
  });

  test('state is restored even when request fails', async ({ page }) => {
    await page.goto('/tests/integration/pages/form-submit.html');
    await waitForALIS(page);

    await page.route('**/api/users', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 50));
      await route.fulfill({
        status: 500,
        body: 'Server Error'
      });
    });

    const btn = page.locator('button[type="submit"]');
    await btn.click();

    await page.waitForTimeout(300);

    // Button should be re-enabled despite error
    await expect(btn).toBeEnabled();
    await expect(btn).not.toHaveAttribute('aria-busy');
  });

  test('confirm dialog prevents request when rejected', async ({ page }) => {
    await page.goto('/tests/integration/pages/confirm.html');
    await waitForALIS(page);

    // Set up window.confirm to return false
    await page.evaluate(() => {
      window.confirm = () => false;
    });

    let requestMade = false;
    await page.route('**/api/items/**', async (route) => {
      requestMade = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div>Deleted</div>'
      });
    });

    await page.click('button[data-alis-delete]');
    await page.waitForTimeout(200);

    // Request should NOT have been made
    expect(requestMade).toBe(false);
  });

  test('confirm dialog allows request when accepted', async ({ page }) => {
    await page.goto('/tests/integration/pages/confirm.html');
    await waitForALIS(page);

    // Set up window.confirm to return true
    await page.evaluate(() => {
      window.confirm = () => true;
    });

    let requestMade = false;
    await page.route('**/api/items/**', async (route) => {
      requestMade = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div>Deleted</div>'
      });
    });

    await page.click('button[data-alis-delete]');

    await expect(async () => {
      expect(requestMade).toBe(true);
    }).toPass();
  });
});
