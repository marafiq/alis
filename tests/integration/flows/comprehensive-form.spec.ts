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

test.describe('Comprehensive Form', () => {
  test('collects all standard input types correctly', async ({ page }) => {
    await page.goto('/demos/comprehensive-form/index.html');

    let capturedBody: Record<string, string | string[]> = {};
    await page.route('**/api/comprehensive', async route => {
      const contentType = route.request().headers()['content-type'] || '';
      const postData = route.request().postData() || '';
      capturedBody = parseFormData(postData, contentType);
      await route.fulfill({
        status: 200,
        body: '<p class="success">Form submitted successfully!</p>',
        contentType: 'text/html'
      });
    });

    await page.click('form button[type="submit"]');
    await expect(page.locator('#form-result')).toContainText('Form submitted successfully');

    // Text inputs
    expect(capturedBody.username).toBe('johndoe');
    expect(capturedBody.email).toBe('john@example.com');
    expect(capturedBody.password).toBe('secret123');

    // Number
    expect(capturedBody.age).toBe('30');

    // Range
    expect(capturedBody.salary).toBe('50000');

    // Date/Time
    expect(capturedBody.birthdate).toBe('1990-05-15');
    expect(capturedBody.meetingTime).toBe('14:30');
    expect(capturedBody.appointment).toBe('2024-12-25T10:00');

    // URL, Tel, Color, Search
    expect(capturedBody.website).toBe('https://example.com');
    expect(capturedBody.phone).toBe('+1-555-123-4567');
    expect(capturedBody.favoriteColor).toBe('#3498db');
    expect(capturedBody.searchQuery).toBe('test query');

    // Hidden fields
    expect(capturedBody.hiddenField).toBe('secret-value');
    expect(capturedBody.userId).toBe('12345');

    // Select
    expect(capturedBody.country).toBe('uk');

    // Multi-select (array)
    expect(capturedBody.languages).toEqual(['en', 'es']);

    // Textarea
    expect(capturedBody.bio).toBe('This is my biography.');

    // Radio
    expect(capturedBody.gender).toBe('male');

    // Checkboxes (multiple checked = array)
    expect(capturedBody.interests).toEqual(['sports', 'music']);

    // Single checkbox
    expect(capturedBody.newsletter).toBe('yes');

    // Unchecked checkbox should NOT be present
    expect(capturedBody.terms).toBeUndefined();

    // Disabled field should NOT be collected
    expect(capturedBody.disabledField).toBeUndefined();
  });

  test('displays validation errors for required fields', async ({ page }) => {
    await page.goto('/demos/comprehensive-form/index.html');

    await page.route('**/api/comprehensive', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'validation',
          title: 'Validation Failed',
          errors: {
            username: ['Username is required'],
            email: ['Invalid email format'],
            terms: ['You must accept the terms']
          }
        })
      });
    });

    // Clear username to trigger validation
    await page.fill('#username', '');
    await page.click('form button[type="submit"]');

    // Check validation messages are displayed
    await expect(page.locator('[data-valmsg-for="username"]')).toContainText('Username is required');
    await expect(page.locator('[data-valmsg-for="email"]')).toContainText('Invalid email format');
    await expect(page.locator('[data-valmsg-for="terms"]')).toContainText('You must accept the terms');
  });
});
