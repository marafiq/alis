/**
 * Critical Happy Path Tests
 * 
 * These tests cover the 10 Core Happy Paths defined in the review guide.
 * Each test verifies the complete flow from user interaction to final DOM state.
 */
import { test, expect } from '@playwright/test';

// Helper to wait for ALIS initialization
async function waitForALIS(page) {
  await page.waitForFunction(() => {
    const w = window;
    return w.__ALIS_INIT === true || w.ALIS !== undefined;
  });
}

test.describe('Happy Path 1: Form POST with FormData', () => {
  test('submits form and swaps HTML into target', async ({ page }) => {
    await page.route('**/api/users', async (route) => {
      const request = route.request();
      expect(request.method()).toBe('POST');
      expect(request.headers()['content-type']).toContain('multipart/form-data');
      
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
    
    const promise = submitButton.click();
    await expect(submitButton).toBeDisabled();
    await promise;
    
    await expect(page.locator('#fixture-result')).toContainText('Done');
    await expect(submitButton).toBeEnabled();
  });
});

test.describe('Happy Path 2: Form GET with Query String', () => {
  test('appends data to URL as query string', async ({ page }) => {
    await page.goto('/tests/integration/pages/form-submit.html');
    await waitForALIS(page);

    // Replace body with GET form
    await page.evaluate(() => {
      document.body.innerHTML = `
        <form data-alis-get="/api/search" data-alis-target="#result">
          <input name="email" value="search-term">
          <button type="submit" id="search-btn">Search</button>
        </form>
        <div id="result"></div>
      `;
    });

    let capturedUrl = '';
    await page.route('**/api/search**', async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div>Results</div>'
      });
    });

    await page.click('#search-btn');

    await expect(page.locator('#result')).toContainText('Results');
    expect(capturedUrl).toContain('/api/search');
    expect(capturedUrl).toContain('email=search-term');
  });
});

test.describe('Happy Path 3: Debounced Search Input', () => {
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

    await page.waitForTimeout(1500);

    expect(requestCount).toBe(1);
    expect(lastQuery).toBe('hello');
  });

  test('input is NOT disabled during debounced request', async ({ page }) => {
    await page.goto('/demos/debounce/index.html');
    await waitForALIS(page);

    await page.route('**/api/search**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="result-item">Results</div>'
      });
    });

    const input = page.locator('#search-input');
    await input.focus();
    await input.fill('a');
    
    await page.waitForTimeout(600);
    await expect(input).toBeEnabled();
  });
});

test.describe('Happy Path 4: Button Click with JSON', () => {
  test('sends JSON body when configured', async ({ page }) => {
    await page.goto('/tests/integration/pages/form-submit.html');
    await waitForALIS(page);

    // Replace body with JSON button
    await page.evaluate(() => {
      document.body.innerHTML = `
        <button id="btn-post" 
          data-alis-post="/api/resource" 
          data-alis-target="#result"
          data-alis-serialize="json"
          data-alis-collect="self"
          name="action"
          value="some-value">
          Post JSON
        </button>
        <div id="result"></div>
      `;
    });

    let capturedBody = null;
    let contentType = '';
    
    await page.route('**/api/resource', async (route) => {
      const headers = route.request().headers();
      contentType = headers['content-type'];
      capturedBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div>Done</div>'
      });
    });

    await page.click('#btn-post');
    
    await expect(page.locator('#result')).toContainText('Done');
    expect(contentType).toContain('application/json');
    expect(capturedBody).toEqual({ action: 'some-value' });
  });
});

test.describe('Happy Path 5: Server Validation Errors (ProblemDetails)', () => {
  test('displays validation errors next to fields', async ({ page }) => {
    await page.goto('/tests/integration/pages/form-submit-validation.html');
    await waitForALIS(page);

    await page.route('**/api/validate', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://tools.ietf.org/html/rfc7807',
          title: 'Validation failed',
          status: 400,
          errors: {
            email: ['Email is required']
          }
        })
      });
    });

    await page.click('button[type="submit"]');

    await expect(page.locator('[data-valmsg-for="email"]')).toContainText('Email is required');
    await expect(page.locator('[name="email"]')).toHaveAttribute('aria-invalid', 'true');
  });
});

test.describe('Happy Path 6 & 7: Client-Side Validation & Nested Properties', () => {
  test('prevents submission and shows errors for nested fields', async ({ page }) => {
    await page.goto('/demos/client-validation/index.html');
    await waitForALIS(page);

    let requestMade = false;
    await page.route('**/api/**', async (route) => {
      requestMade = true;
      await route.fulfill({ status: 200, body: 'OK' });
    });

    await page.fill('input[name="Employee.FirstName"]', '');
    await page.click('button[type="submit"]');
    
    expect(requestMade).toBe(false);
    await expect(page.locator('[data-valmsg-for="Employee.FirstName"]')).not.toBeEmpty();
  });

  test('errors clear when user fixes input ("forgiving on input")', async ({ page }) => {
    await page.goto('/demos/client-validation/index.html');
    await waitForALIS(page);

    await page.click('button[type="submit"]');
    await expect(page.locator('[data-valmsg-for="Employee.FirstName"]')).not.toBeEmpty();

    await page.fill('input[name="Employee.FirstName"]', 'Valid Name');
    await page.waitForTimeout(300);
    
    await expect(page.locator('[data-valmsg-for="Employee.FirstName"]')).toBeEmpty();
  });
});

test.describe('Happy Path 8: Loading Indicator', () => {
  test('shows spinner and sets aria-busy', async ({ page }) => {
    await page.goto('/demos/indicators/index.html');
    await waitForALIS(page);

    await page.route('**/api/slow', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div>Loaded</div>'
      });
    });

    const button = page.locator('button[data-alis-post]');
    const spinner = page.locator('#spinner');
    
    await expect(spinner).toBeHidden();
    
    const promise = button.click();
    
    await expect(spinner).toBeVisible();
    await expect(button).toHaveAttribute('aria-busy', 'true');
    
    await promise;
    
    await expect(spinner).toBeHidden();
    await expect(button).not.toHaveAttribute('aria-busy');
    await expect(page.locator('#indicator-result')).toContainText('Loaded');
  });
});

test.describe('Happy Path 9: Hooks (Before/After)', () => {
  test('executes hooks in order', async ({ page }) => {
    await page.goto('/demos/methods/index.html');
    await waitForALIS(page);

    await page.evaluate(() => {
      window.hookLogs = [];
      window.hook1 = (_ctx) => { window.hookLogs.push('hook1'); };
      window.hook2 = (_ctx) => { window.hookLogs.push('hook2'); };
      
      const btn = document.getElementById('btn-get');
      btn.setAttribute('data-alis-on-after', 'hook1, hook2');
    });

    await page.route('**/api/resource', async (route) => {
      await route.fulfill({ status: 200, body: 'OK' });
    });

    await page.click('#btn-get');
    
    // Wait for hooks to run
    await page.waitForFunction(() => window.hookLogs && window.hookLogs.length === 2);
    
    const logs = await page.evaluate(() => window.hookLogs);
    expect(logs).toEqual(['hook1', 'hook2']);
  });
});

test.describe('Happy Path 10: Confirmation Dialog', () => {
  test('dialog controls request execution', async ({ page }) => {
    await page.goto('/tests/integration/pages/confirm.html');
    await waitForALIS(page);

    await page.evaluate(() => { window.confirm = () => false; });

    let requestMade = false;
    await page.route('**/api/**', async (route) => {
      requestMade = true;
      await route.fulfill({ status: 200, body: 'OK' });
    });

    await page.click('button[data-alis-delete]');
    expect(requestMade).toBe(false);

    await page.evaluate(() => { window.confirm = () => true; });

    await page.click('button[data-alis-delete]');
    await expect(async () => {
      expect(requestMade).toBe(true);
    }).toPass();
  });
});
