import { test, expect } from '@playwright/test';

test.describe('Client-Side Validation Demo', () => {
  test('validates required fields on submit', async ({ page }) => {
    await page.goto('/demos/client-validation/index.html');
    
    // Route the API to verify it's not called when client validation fails
    let apiCalled = false;
    await page.route('**/api/employees', async route => {
      apiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Wait for validation
    await page.waitForTimeout(100);
    
    // Should show validation errors
    await expect(page.locator('[data-valmsg-for="Employee.FirstName"]')).toContainText('First name is required');
    await expect(page.locator('[data-valmsg-for="Employee.LastName"]')).toContainText('Last name is required');
    await expect(page.locator('[data-valmsg-for="Employee.Email"]')).toContainText('Email is required');
    
    // API should NOT be called due to client-side validation
    expect(apiCalled).toBe(false);
  });

  test('validates nested property names (Employee.FirstName)', async ({ page }) => {
    await page.goto('/demos/client-validation/index.html');
    
    // Fill only first name with too short value
    await page.fill('input[name="Employee.FirstName"]', 'A');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(100);
    
    // Should show minlength error
    await expect(page.locator('[data-valmsg-for="Employee.FirstName"]')).toContainText('Minimum 2 characters');
  });

  test('validates email format', async ({ page }) => {
    await page.goto('/demos/client-validation/index.html');
    
    // Fill with invalid email
    await page.fill('input[name="Employee.Email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(100);
    
    await expect(page.locator('[data-valmsg-for="Employee.Email"]')).toContainText('valid email');
  });

  test('validates deeply nested properties (Employee.Address.City)', async ({ page }) => {
    await page.goto('/demos/client-validation/index.html');
    
    // Leave address fields empty
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(100);
    
    await expect(page.locator('[data-valmsg-for="Employee.Address.Street"]')).toContainText('Street address is required');
    await expect(page.locator('[data-valmsg-for="Employee.Address.City"]')).toContainText('City is required');
    await expect(page.locator('[data-valmsg-for="Employee.Address.ZipCode"]')).toContainText('Zip code is required');
  });

  test('validates array notation (Employee.EmergencyContacts[0].Name)', async ({ page }) => {
    await page.goto('/demos/client-validation/index.html');
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(100);
    
    await expect(page.locator('[data-valmsg-for="Employee.EmergencyContacts[0].Name"]')).toContainText('Emergency contact name is required');
  });

  test('validates password match with equalto', async ({ page }) => {
    await page.goto('/demos/client-validation/index.html');
    
    // Fill passwords that don't match
    await page.fill('input[name="Password"]', 'password123');
    await page.fill('input[name="ConfirmPassword"]', 'different123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(100);
    
    await expect(page.locator('[data-valmsg-for="ConfirmPassword"]')).toContainText('Passwords do not match');
  });

  test('clears errors when valid input provided and form re-submitted', async ({ page }) => {
    await page.goto('/demos/client-validation/index.html');
    
    // Submit to show errors
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100);
    
    // Verify error is shown
    await expect(page.locator('[data-valmsg-for="Employee.FirstName"]')).toContainText('required');
    
    // Fill valid value
    await page.fill('input[name="Employee.FirstName"]', 'John');
    
    // Re-submit to trigger validation again
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100);
    
    // Error for FirstName should be cleared (but others remain)
    const errorSpan = page.locator('[data-valmsg-for="Employee.FirstName"]');
    await expect(errorSpan).toHaveText('');
    
    // Other errors should still be shown
    await expect(page.locator('[data-valmsg-for="Employee.LastName"]')).toContainText('required');
  });

  test('submits successfully when all validations pass', async ({ page }) => {
    await page.goto('/demos/client-validation/index.html');
    
    let capturedBody = '';
    await page.route('**/api/employees', async route => {
      capturedBody = route.request().postData() || '';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Employee registered!',
          employee: { firstName: 'John', lastName: 'Doe' }
        })
      });
    });
    
    // Fill all required fields
    await page.fill('input[name="Employee.FirstName"]', 'John');
    await page.fill('input[name="Employee.LastName"]', 'Doe');
    await page.fill('input[name="Employee.Email"]', 'john.doe@example.com');
    await page.fill('input[name="Employee.Phone"]', '+1 555-123-4567');
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
    
    // Wait for success
    await expect(page.locator('#form-result')).toContainText('Employee Registered Successfully');
    
    // Verify nested properties were sent
    expect(capturedBody).toContain('Employee.FirstName');
    expect(capturedBody).toContain('John');
  });
});

