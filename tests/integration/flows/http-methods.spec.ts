import { test, expect } from '@playwright/test';

test.describe('HTTP Methods', () => {
  test('GET appends data as query string', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    let capturedUrl = '';
    await page.route('**/api/submit**', async route => {
      capturedUrl = route.request().url();
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    // Modify form to use GET
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        form.method = 'get';
        form.querySelector('input[name="name"]')?.setAttribute('value', 'TestUser');
      }
    });

    await page.click('form button[type="submit"]');
    await expect(page.locator('#result')).toHaveText('OK');
    
    expect(capturedUrl).toContain('name=TestUser');
    expect(capturedUrl).not.toContain('?name=TestUser?'); // No double ?
  });

  test('POST sends FormData body by default for forms', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    let capturedBody = '';
    let capturedContentType = '';
    await page.route('**/api/submit', async route => {
      capturedBody = route.request().postData() || '';
      capturedContentType = route.request().headers()['content-type'] || '';
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    await page.fill('form input[name="name"]', 'FormDataTest');
    await page.click('form button[type="submit"]');
    
    await expect(page.locator('#result')).toHaveText('OK');
    // Forms now default to FormData (multipart/form-data)
    expect(capturedContentType).toContain('multipart/form-data');
    // FormData body contains the field
    expect(capturedBody).toContain('name');
    expect(capturedBody).toContain('FormDataTest');
  });

  test('PUT method works', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    let capturedMethod = '';
    await page.route('**/api/submit', async route => {
      capturedMethod = route.request().method();
      await route.fulfill({ status: 200, body: 'Updated', contentType: 'text/plain' });
    });

    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.method = 'put';
    });

    await page.click('form button[type="submit"]');
    await expect(page.locator('#result')).toHaveText('Updated');
    expect(capturedMethod).toBe('PUT');
  });

  test('DELETE method works', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    let capturedMethod = '';
    await page.route('**/api/submit', async route => {
      capturedMethod = route.request().method();
      await route.fulfill({ status: 200, body: 'Deleted', contentType: 'text/plain' });
    });

    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.method = 'delete';
    });

    await page.click('form button[type="submit"]');
    await expect(page.locator('#result')).toHaveText('Deleted');
    expect(capturedMethod).toBe('DELETE');
  });

  test('PATCH method works', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    let capturedMethod = '';
    await page.route('**/api/submit', async route => {
      capturedMethod = route.request().method();
      await route.fulfill({ status: 200, body: 'Patched', contentType: 'text/plain' });
    });

    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.method = 'patch';
    });

    await page.click('form button[type="submit"]');
    await expect(page.locator('#result')).toHaveText('Patched');
    expect(capturedMethod).toBe('PATCH');
  });
});

