/**
 * Comprehensive Form Controls Tests
 * 
 * Tests all HTML form control types to ensure proper data collection and submission.
 * Covers: text, email, password, number, date, hidden, textarea, select, multi-select,
 * checkbox, checkbox groups, radio buttons, range, color, nested properties, arrays.
 */
import { test, expect } from '@playwright/test';

async function waitForALIS(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    const w = window as typeof window & { __ALIS_INIT?: boolean };
    return w.__ALIS_INIT === true;
  });
}

test.describe('Comprehensive Form Controls - POST', () => {
  test('collects all control types correctly', async ({ page }) => {
    await page.goto('/tests/integration/pages/comprehensive-controls.html');
    await waitForALIS(page);

    let capturedContentType = '';
    
    await page.route('**/api/comprehensive', async (route) => {
      const request = route.request();
      capturedContentType = request.headers()['content-type'] || '';
      
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="success">Form submitted successfully!</div>'
      });
    });

    // Fill all form fields
    await page.fill('#username', 'johndoe');
    await page.fill('#email', 'john@example.com');
    await page.fill('#password', 'secret123');
    await page.fill('#age', '30');
    await page.fill('#birthdate', '1994-05-15');
    await page.fill('#bio', 'Hello, I am John.\nI like coding.');
    await page.selectOption('#country', 'us');
    
    // Multi-select - select multiple options
    await page.selectOption('#languages', ['en', 'es', 'fr']);
    
    // Single checkbox
    await page.check('#newsletter');
    
    // Checkbox group - select multiple
    await page.check('#interest-sports');
    await page.check('#interest-tech');
    
    // Radio button
    await page.check('#gender-male');
    
    // Range (default is 5, change to 8)
    await page.fill('#satisfaction', '8');
    
    // Color picker
    await page.fill('#favColor', '#ff5500');
    
    // Nested properties
    await page.fill('#address-street', '123 Main St');
    await page.fill('#address-city', 'New York');
    
    // Array notation
    await page.fill('#tags-0', 'javascript');
    await page.fill('#tags-1', 'typescript');

    // Submit
    await page.click('#comprehensive-form button[type="submit"]');

    // Wait for success
    await expect(page.locator('#form-result')).toContainText('Form submitted successfully!');
    
    // Verify content type is multipart/form-data (default for forms)
    expect(capturedContentType).toContain('multipart/form-data');
  });

  test('verifies FormData contains all expected fields', async ({ page }) => {
    await page.goto('/tests/integration/pages/comprehensive-controls.html');
    await waitForALIS(page);

    const capturedFields: Record<string, string[]> = {};
    
    await page.route('**/api/comprehensive', async (route) => {
      const request = route.request();
      const postData = request.postData() || '';
      
      // Parse multipart form data manually
      // The boundary is in the content-type header
      const contentType = request.headers()['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)/);
      
      if (boundaryMatch) {
        const boundary = boundaryMatch[1];
        const parts = postData.split(`--${boundary}`);
        
        for (const part of parts) {
          const nameMatch = part.match(/name="([^"]+)"/);
          if (nameMatch) {
            const name = nameMatch[1];
            // Extract value (after double newline)
            const valueMatch = part.split('\r\n\r\n')[1];
            if (valueMatch) {
              const value = valueMatch.replace(/\r\n--$/, '').trim();
              if (!capturedFields[name]) {
                capturedFields[name] = [];
              }
              capturedFields[name].push(value);
            }
          }
        }
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="success">OK</div>'
      });
    });

    // Fill form
    await page.fill('#username', 'testuser');
    await page.fill('#email', 'test@test.com');
    await page.fill('#password', 'pass123');
    await page.fill('#age', '25');
    await page.fill('#birthdate', '1999-01-01');
    await page.fill('#bio', 'Test bio');
    await page.selectOption('#country', 'uk');
    await page.selectOption('#languages', ['en', 'de']);
    await page.check('#newsletter');
    await page.check('#interest-music');
    await page.check('#interest-art');
    await page.check('#gender-female');
    await page.fill('#satisfaction', '7');
    await page.fill('#favColor', '#00ff00');
    await page.fill('#address-street', '456 Oak Ave');
    await page.fill('#address-city', 'London');
    await page.fill('#tags-0', 'tag1');
    await page.fill('#tags-1', 'tag2');

    await page.click('#comprehensive-form button[type="submit"]');
    await expect(page.locator('#form-result')).toContainText('OK');

    // Verify all expected fields are present
    expect(capturedFields['username']).toContain('testuser');
    expect(capturedFields['email']).toContain('test@test.com');
    expect(capturedFields['password']).toContain('pass123');
    expect(capturedFields['age']).toContain('25');
    expect(capturedFields['birthdate']).toContain('1999-01-01');
    expect(capturedFields['bio']).toContain('Test bio');
    expect(capturedFields['country']).toContain('uk');
    expect(capturedFields['userId']).toContain('hidden-123'); // Hidden field
    
    // Multi-select should have multiple entries
    expect(capturedFields['languages']).toContain('en');
    expect(capturedFields['languages']).toContain('de');
    expect(capturedFields['languages']?.length).toBe(2);
    
    // Checkbox group
    expect(capturedFields['interests']).toContain('music');
    expect(capturedFields['interests']).toContain('art');
    expect(capturedFields['interests']?.length).toBe(2);
    
    // Single checkbox
    expect(capturedFields['newsletter']).toContain('yes');
    
    // Radio
    expect(capturedFields['gender']).toContain('female');
    
    // Range
    expect(capturedFields['satisfaction']).toContain('7');
    
    // Color
    expect(capturedFields['favColor']).toContain('#00ff00');
    
    // Nested properties (ASP.NET style)
    expect(capturedFields['Address.Street']).toContain('456 Oak Ave');
    expect(capturedFields['Address.City']).toContain('London');
    
    // Array notation
    expect(capturedFields['Tags[0]']).toContain('tag1');
    expect(capturedFields['Tags[1]']).toContain('tag2');
    
    // Disabled field should NOT be present
    expect(capturedFields['disabledField']).toBeUndefined();
  });

  test('unchecked checkboxes are not included', async ({ page }) => {
    await page.goto('/tests/integration/pages/comprehensive-controls.html');
    await waitForALIS(page);

    const capturedFields: Record<string, string[]> = {};
    
    await page.route('**/api/comprehensive', async (route) => {
      const request = route.request();
      const postData = request.postData() || '';
      const contentType = request.headers()['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)/);
      
      if (boundaryMatch) {
        const boundary = boundaryMatch[1];
        const parts = postData.split(`--${boundary}`);
        
        for (const part of parts) {
          const nameMatch = part.match(/name="([^"]+)"/);
          if (nameMatch) {
            const name = nameMatch[1];
            const valueMatch = part.split('\r\n\r\n')[1];
            if (valueMatch) {
              const value = valueMatch.replace(/\r\n--$/, '').trim();
              if (!capturedFields[name]) {
                capturedFields[name] = [];
              }
              capturedFields[name].push(value);
            }
          }
        }
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="success">OK</div>'
      });
    });

    // Fill minimal required fields, leave checkboxes unchecked
    await page.fill('#username', 'minimal');
    await page.fill('#email', 'min@test.com');
    
    // Do NOT check any checkboxes

    await page.click('#comprehensive-form button[type="submit"]');
    await expect(page.locator('#form-result')).toContainText('OK');

    // Unchecked checkboxes should not appear
    expect(capturedFields['newsletter']).toBeUndefined();
    expect(capturedFields['interests']).toBeUndefined();
    expect(capturedFields['gender']).toBeUndefined();
  });

  test('empty multi-select sends nothing', async ({ page }) => {
    await page.goto('/tests/integration/pages/comprehensive-controls.html');
    await waitForALIS(page);

    const capturedFields: Record<string, string[]> = {};
    
    await page.route('**/api/comprehensive', async (route) => {
      const request = route.request();
      const postData = request.postData() || '';
      const contentType = request.headers()['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)/);
      
      if (boundaryMatch) {
        const boundary = boundaryMatch[1];
        const parts = postData.split(`--${boundary}`);
        
        for (const part of parts) {
          const nameMatch = part.match(/name="([^"]+)"/);
          if (nameMatch) {
            const name = nameMatch[1];
            const valueMatch = part.split('\r\n\r\n')[1];
            if (valueMatch) {
              const value = valueMatch.replace(/\r\n--$/, '').trim();
              if (!capturedFields[name]) {
                capturedFields[name] = [];
              }
              capturedFields[name].push(value);
            }
          }
        }
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="success">OK</div>'
      });
    });

    // Don't select anything in multi-select
    await page.fill('#username', 'test');

    await page.click('#comprehensive-form button[type="submit"]');
    await expect(page.locator('#form-result')).toContainText('OK');

    // Empty multi-select should not appear or be empty
    expect(capturedFields['languages']).toBeUndefined();
  });
});

test.describe('Comprehensive Form Controls - GET with Arrays', () => {
  test('checkbox array appears as multiple query params', async ({ page }) => {
    await page.goto('/tests/integration/pages/comprehensive-controls.html');
    await waitForALIS(page);

    let capturedUrl = '';
    
    await page.route('**/api/filter**', async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="success">Filtered!</div>'
      });
    });

    // Check multiple IDs
    await page.check('#id-1');
    await page.check('#id-3');
    await page.check('#id-4');
    
    await page.fill('#search', 'test query');

    await page.click('#filter-form button[type="submit"]');
    await expect(page.locator('#filter-result')).toContainText('Filtered!');

    // Parse the URL
    const url = new URL(capturedUrl);
    const ids = url.searchParams.getAll('ids');
    
    // Should have multiple ids params
    expect(ids).toContain('1');
    expect(ids).toContain('3');
    expect(ids).toContain('4');
    expect(ids.length).toBe(3);
    
    // Search should be present
    expect(url.searchParams.get('search')).toBe('test query');
  });

  test('multi-select array appears as multiple query params in GET', async ({ page }) => {
    await page.goto('/tests/integration/pages/comprehensive-controls.html');
    await waitForALIS(page);

    let capturedUrl = '';
    
    await page.route('**/api/filter**', async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="success">Filtered!</div>'
      });
    });

    // Select multiple statuses
    await page.selectOption('#status', ['active', 'pending']);

    await page.click('#filter-form button[type="submit"]');
    await expect(page.locator('#filter-result')).toContainText('Filtered!');

    // Parse the URL
    const url = new URL(capturedUrl);
    const statuses = url.searchParams.getAll('status');
    
    // Should have multiple status params
    expect(statuses).toContain('active');
    expect(statuses).toContain('pending');
    expect(statuses.length).toBe(2);
  });

  test('combined checkbox and multi-select arrays in GET', async ({ page }) => {
    await page.goto('/tests/integration/pages/comprehensive-controls.html');
    await waitForALIS(page);

    let capturedUrl = '';
    
    await page.route('**/api/filter**', async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="success">Filtered!</div>'
      });
    });

    // Check IDs
    await page.check('#id-2');
    await page.check('#id-4');
    
    // Select statuses
    await page.selectOption('#status', ['active', 'archived']);
    
    // Add search
    await page.fill('#search', 'combined test');

    await page.click('#filter-form button[type="submit"]');
    await expect(page.locator('#filter-result')).toContainText('Filtered!');

    // Parse the URL
    const url = new URL(capturedUrl);
    
    // Verify IDs
    const ids = url.searchParams.getAll('ids');
    expect(ids).toContain('2');
    expect(ids).toContain('4');
    expect(ids.length).toBe(2);
    
    // Verify statuses
    const statuses = url.searchParams.getAll('status');
    expect(statuses).toContain('active');
    expect(statuses).toContain('archived');
    expect(statuses.length).toBe(2);
    
    // Verify search
    expect(url.searchParams.get('search')).toBe('combined test');
  });

  test('empty arrays do not appear in GET query string', async ({ page }) => {
    await page.goto('/tests/integration/pages/comprehensive-controls.html');
    await waitForALIS(page);

    let capturedUrl = '';
    
    await page.route('**/api/filter**', async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="success">Filtered!</div>'
      });
    });

    // Don't check any IDs or select any statuses
    await page.fill('#search', 'only search');

    await page.click('#filter-form button[type="submit"]');
    await expect(page.locator('#filter-result')).toContainText('Filtered!');

    // Parse the URL
    const url = new URL(capturedUrl);
    
    // IDs and statuses should not be present
    expect(url.searchParams.has('ids')).toBe(false);
    expect(url.searchParams.has('status')).toBe(false);
    
    // Search should be present
    expect(url.searchParams.get('search')).toBe('only search');
  });
});

test.describe('Edge Cases for Form Controls', () => {
  test('special characters in text inputs are encoded properly', async ({ page }) => {
    await page.goto('/tests/integration/pages/comprehensive-controls.html');
    await waitForALIS(page);

    const capturedFields: Record<string, string[]> = {};
    
    await page.route('**/api/comprehensive', async (route) => {
      const request = route.request();
      const postData = request.postData() || '';
      const contentType = request.headers()['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)/);
      
      if (boundaryMatch) {
        const boundary = boundaryMatch[1];
        const parts = postData.split(`--${boundary}`);
        
        for (const part of parts) {
          const nameMatch = part.match(/name="([^"]+)"/);
          if (nameMatch) {
            const name = nameMatch[1];
            const valueMatch = part.split('\r\n\r\n')[1];
            if (valueMatch) {
              const value = valueMatch.replace(/\r\n--$/, '').trim();
              if (!capturedFields[name]) {
                capturedFields[name] = [];
              }
              capturedFields[name].push(value);
            }
          }
        }
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="success">OK</div>'
      });
    });

    // Use special characters
    await page.fill('#username', 'user&name=test');
    await page.fill('#bio', 'Line 1\nLine 2\n<script>alert("xss")</script>');

    await page.click('#comprehensive-form button[type="submit"]');
    await expect(page.locator('#form-result')).toContainText('OK');

    // Verify special characters are preserved
    expect(capturedFields['username']).toContain('user&name=test');
    expect(capturedFields['bio']?.[0]).toContain('Line 1');
    expect(capturedFields['bio']?.[0]).toContain('<script>');
  });

  test('special characters in GET query are URL encoded', async ({ page }) => {
    await page.goto('/tests/integration/pages/comprehensive-controls.html');
    await waitForALIS(page);

    let capturedUrl = '';
    
    await page.route('**/api/filter**', async (route) => {
      capturedUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="success">OK</div>'
      });
    });

    await page.fill('#search', 'test&query=value with spaces');

    await page.click('#filter-form button[type="submit"]');
    await expect(page.locator('#filter-result')).toContainText('OK');

    // The URL should have encoded the special characters
    expect(capturedUrl).toContain('search=');
    
    // Parse and verify the decoded value
    const url = new URL(capturedUrl);
    expect(url.searchParams.get('search')).toBe('test&query=value with spaces');
  });

  test('form with all empty fields still submits', async ({ page }) => {
    await page.goto('/tests/integration/pages/comprehensive-controls.html');
    await waitForALIS(page);

    let requestMade = false;
    
    await page.route('**/api/comprehensive', async (route) => {
      requestMade = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<div class="success">Empty form submitted</div>'
      });
    });

    // Don't fill anything, just submit
    await page.click('#comprehensive-form button[type="submit"]');
    await expect(page.locator('#form-result')).toContainText('Empty form submitted');

    expect(requestMade).toBe(true);
  });
});

