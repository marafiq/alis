import { test, expect } from '@playwright/test';

/**
 * Helper to parse FormData from multipart request body
 */
function parseFormData(body: string, contentType: string): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  
  const boundaryMatch = contentType.match(/boundary=(.+)/);
  if (!boundaryMatch) return result;
  
  const boundary = boundaryMatch[1];
  const parts = body.split(`--${boundary}`);
  
  for (const part of parts) {
    if (!part.trim() || part.trim() === '--') continue;
    
    const nameMatch = part.match(/name="([^"]+)"/);
    if (!nameMatch) continue;
    
    const name = nameMatch[1];
    const valueMatch = part.split('\r\n\r\n')[1];
    if (valueMatch === undefined) continue;
    
    const value = valueMatch.replace(/\r\n$/, '');
    
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

test.describe('Custom Components (Syncfusion-like)', () => {
  test('reads values from custom selectors', async ({ page }) => {
    await page.goto('/demos/custom-components/index.html');

    let capturedBody: Record<string, string | string[]> = {};
    await page.route('**/api/custom-components', async route => {
      const contentType = route.request().headers()['content-type'] || '';
      const postData = route.request().postData() || '';
      capturedBody = parseFormData(postData, contentType);
      await route.fulfill({
        status: 200,
        body: 'OK',
        contentType: 'text/plain'
      });
    });

    // Select an item in the custom dropdown
    await page.click('#department-dropdown');
    await page.click('.sf-dropdown-item[data-value="engineering"]');

    // Submit the form
    await page.click('#custom-form button[type="submit"]');
    await expect(page.locator('#custom-result')).toHaveText('OK');

    // Verify custom component values were collected
    expect(capturedBody.department).toBe('engineering');
    expect(capturedBody.startDate).toBe('2024-01-15');
    expect(capturedBody.skills).toBe('javascript,typescript');
    expect(capturedBody.salary).toBe('75000');
    expect(capturedBody.notes).toBe('Standard textarea works normally');
  });

  test('custom value function is called', async ({ page }) => {
    await page.goto('/demos/custom-components/index.html');

    let capturedBody: Record<string, string | string[]> = {};
    await page.route('**/api/custom-components', async route => {
      const contentType = route.request().headers()['content-type'] || '';
      const postData = route.request().postData() || '';
      capturedBody = parseFormData(postData, contentType);
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    // Remove one skill tag
    await page.click('#skills-tags .sf-tag[data-value="typescript"] .sf-tag-remove');

    await page.click('#custom-form button[type="submit"]');

    // Skills should only have javascript now
    expect(capturedBody.skills).toBe('javascript');
  });

  test('numeric component updates via buttons', async ({ page }) => {
    await page.goto('/demos/custom-components/index.html');

    let capturedBody: Record<string, string | string[]> = {};
    await page.route('**/api/custom-components', async route => {
      const contentType = route.request().headers()['content-type'] || '';
      const postData = route.request().postData() || '';
      capturedBody = parseFormData(postData, contentType);
      await route.fulfill({ status: 200, body: 'OK', contentType: 'text/plain' });
    });

    // Increase salary twice
    await page.click('#salary-numeric button:last-child'); // +1000
    await page.click('#salary-numeric button:last-child'); // +1000

    await page.click('#custom-form button[type="submit"]');

    expect(capturedBody.salary).toBe('77000');
  });
});
