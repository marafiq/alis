import { test, expect } from '@playwright/test';

test('happy-path: standard form post updates target', async ({ page }) => {
  await page.goto('/demos/form-submit/index.html');

  await page.route('**/api/submit', async route => {
    const method = route.request().method();
    if (method !== 'POST') {
      await route.fulfill({ status: 405, body: 'Method Not Allowed' });
      return;
    }
    await route.fulfill({ 
      status: 200, 
      body: '<div class="success">Form Saved</div>',
      contentType: 'text/html'
    });
  });

  await page.fill('input[name="name"]', 'John Doe');
  await page.click('button[type="submit"]');

  await expect(page.locator('#result')).toContainText('Form Saved');
  await expect(page.locator('.success')).toBeVisible();
});

test('happy-path: validation error displays on field', async ({ page }) => {
  await page.goto('/demos/form-submit/index.html');

  // Add validation message container if not present in demo
  // The demo has none by default in the file I wrote earlier?
  // Let's check demo content dynamically or assume I need to update demo.
  // The current demo has <div id="result"></div> but no span[data-valmsg-for].
  // I'll inject it to verify logic works if elements exist.
  await page.evaluate(() => {
    const input = document.querySelector('input[name="name"]');
    const msg = document.createElement('span');
    msg.setAttribute('data-valmsg-for', 'name');
    input.parentNode.appendChild(msg);
  });

  await page.route('**/api/submit', async route => {
    await route.fulfill({ 
      status: 400, 
      body: JSON.stringify({
        type: 'https://example.com/probs/validation',
        title: 'Validation Error',
        errors: {
          name: ['Name is required']
        }
      }),
      headers: { 'Content-Type': 'application/problem+json' }
    });
  });

  await page.click('button[type="submit"]');

  await expect(page.locator('[data-valmsg-for="name"]')).toHaveText('Name is required');
});

