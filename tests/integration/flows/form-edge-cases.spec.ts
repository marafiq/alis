import { test, expect } from '@playwright/test';

/**
 * Helper to parse FormData from multipart request body
 * FormData boundary looks like: ------WebKitFormBoundaryXXX
 */
function parseFormData(body: string, contentType: string): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  
  // Extract boundary from content-type
  const boundaryMatch = contentType.match(/boundary=(.+)/);
  if (!boundaryMatch) return result;
  
  const boundary = boundaryMatch[1];
  const parts = body.split(`--${boundary}`);
  
  for (const part of parts) {
    // Skip empty parts and closing boundary
    if (!part.trim() || part.trim() === '--') continue;
    
    // Parse Content-Disposition header
    const nameMatch = part.match(/name="([^"]+)"/);
    if (!nameMatch) continue;
    
    const name = nameMatch[1];
    
    // Extract value (after double newline)
    const valueMatch = part.split('\r\n\r\n')[1];
    if (valueMatch === undefined) continue;
    
    const value = valueMatch.replace(/\r\n$/, '');
    
    // Handle multiple values with same name
    if (name in result) {
      const existing = result[name];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        result[name] = [existing, value];
      }
    } else {
      result[name] = value;
    }
  }
  
  return result;
}

test.describe('Form Edge Cases', () => {
  test('empty form submits with FormData', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    let capturedBody = '';
    let capturedContentType = '';
    await page.route('**/api/submit', async route => {
      capturedBody = route.request().postData() || '';
      capturedContentType = route.request().headers()['content-type'] || '';
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    // Clear all inputs
    await page.evaluate(() => {
      document.querySelectorAll('form input').forEach(input => {
        (input as HTMLInputElement).value = '';
      });
    });

    await page.click('form button[type="submit"]');
    await expect(page.locator('#result')).toHaveText('OK');
    
    // Forms now send FormData
    expect(capturedContentType).toContain('multipart/form-data');
    const body = parseFormData(capturedBody, capturedContentType);
    expect(body).toBeDefined();
  });

  test('disabled inputs are not collected', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    let capturedBody = '';
    let capturedContentType = '';
    await page.route('**/api/submit', async route => {
      capturedBody = route.request().postData() || '';
      capturedContentType = route.request().headers()['content-type'] || '';
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    await page.evaluate(() => {
      const input = document.querySelector('form input[name="name"]') as HTMLInputElement;
      if (input) {
        input.disabled = true;
        input.value = 'ShouldNotAppear';
      }
    });

    await page.click('form button[type="submit"]');
    await expect(page.locator('#result')).toHaveText('OK');
    
    const body = parseFormData(capturedBody, capturedContentType);
    expect(body.name).toBeUndefined();
  });

  test('checkbox values are collected correctly', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    let capturedBody = '';
    let capturedContentType = '';
    await page.route('**/api/submit', async route => {
      capturedBody = route.request().postData() || '';
      capturedContentType = route.request().headers()['content-type'] || '';
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    // Add a checkbox to the form
    await page.evaluate(() => {
      const form = document.querySelector('form');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'agree';
      checkbox.checked = true;
      form?.appendChild(checkbox);
    });

    await page.click('form button[type="submit"]');
    await expect(page.locator('#result')).toHaveText('OK');
    
    const body = parseFormData(capturedBody, capturedContentType);
    // Checkboxes without explicit value send "on" when checked
    expect(body.agree).toBe('on');
  });

  test('unchecked checkbox is not included', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    let capturedBody = '';
    let capturedContentType = '';
    await page.route('**/api/submit', async route => {
      capturedBody = route.request().postData() || '';
      capturedContentType = route.request().headers()['content-type'] || '';
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    await page.evaluate(() => {
      const form = document.querySelector('form');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'agree';
      checkbox.checked = false;
      form?.appendChild(checkbox);
    });

    await page.click('form button[type="submit"]');
    await expect(page.locator('#result')).toHaveText('OK');
    
    const body = parseFormData(capturedBody, capturedContentType);
    expect(body.agree).toBeUndefined();
  });

  test('select element value is collected', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    let capturedBody = '';
    let capturedContentType = '';
    await page.route('**/api/submit', async route => {
      capturedBody = route.request().postData() || '';
      capturedContentType = route.request().headers()['content-type'] || '';
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    await page.evaluate(() => {
      const form = document.querySelector('form');
      const select = document.createElement('select');
      select.name = 'country';
      select.innerHTML = '<option value="us">US</option><option value="uk" selected>UK</option>';
      form?.appendChild(select);
    });

    await page.click('form button[type="submit"]');
    await expect(page.locator('#result')).toHaveText('OK');
    
    const body = parseFormData(capturedBody, capturedContentType);
    expect(body.country).toBe('uk');
  });

  test('textarea value is collected', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    let capturedBody = '';
    let capturedContentType = '';
    await page.route('**/api/submit', async route => {
      capturedBody = route.request().postData() || '';
      capturedContentType = route.request().headers()['content-type'] || '';
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    await page.evaluate(() => {
      const form = document.querySelector('form');
      const textarea = document.createElement('textarea');
      textarea.name = 'message';
      textarea.value = 'Hello World';
      form?.appendChild(textarea);
    });

    await page.click('form button[type="submit"]');
    await expect(page.locator('#result')).toHaveText('OK');
    
    const body = parseFormData(capturedBody, capturedContentType);
    expect(body.message).toBe('Hello World');
  });

  test('multiple inputs with same name creates array', async ({ page }) => {
    await page.goto('/demos/form-submit/index.html');
    
    let capturedBody = '';
    let capturedContentType = '';
    await page.route('**/api/submit', async route => {
      capturedBody = route.request().postData() || '';
      capturedContentType = route.request().headers()['content-type'] || '';
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    await page.evaluate(() => {
      const form = document.querySelector('form');
      ['red', 'blue', 'green'].forEach(color => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'colors';
        checkbox.value = color;
        checkbox.checked = color !== 'blue'; // Check red and green
        form?.appendChild(checkbox);
      });
    });

    await page.click('form button[type="submit"]');
    await expect(page.locator('#result')).toHaveText('OK');
    
    const body = parseFormData(capturedBody, capturedContentType);
    expect(body.colors).toEqual(['red', 'green']);
  });
});
