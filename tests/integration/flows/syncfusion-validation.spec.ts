import { test, expect } from '@playwright/test';

test.describe('Syncfusion Component Validation Demo', () => {
  test('validates required dropdown selection', async ({ page }) => {
    await page.goto('/demos/syncfusion-validation/index.html');
    
    // Try to submit without selecting category
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100);
    
    // Should show validation error
    await expect(page.locator('[data-valmsg-for="Order.Category"]')).toContainText('select a category');
  });

  test('validates numeric range', async ({ page }) => {
    await page.goto('/demos/syncfusion-validation/index.html');
    
    // Click minus to go below 1 (quantity starts at 1)
    await page.click('button:has-text("−")');
    await page.click('button:has-text("−")');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100);
    
    // Should show range error
    await expect(page.locator('[data-valmsg-for="Order.Quantity"]')).toContainText('between 1 and 100');
  });

  test('validates required date picker', async ({ page }) => {
    await page.goto('/demos/syncfusion-validation/index.html');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100);
    
    await expect(page.locator('[data-valmsg-for="Order.DeliveryDate"]')).toContainText('delivery date');
  });

  test('validates customer name minlength', async ({ page }) => {
    await page.goto('/demos/syncfusion-validation/index.html');
    
    // Enter short name
    await page.fill('#customerName-display', 'AB');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100);
    
    await expect(page.locator('[data-valmsg-for="Order.CustomerName"]')).toContainText('at least 3 characters');
  });

  test('validates phone format with regex', async ({ page }) => {
    await page.goto('/demos/syncfusion-validation/index.html');
    
    // Enter invalid phone
    await page.fill('#phone-display', '12345');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100);
    
    await expect(page.locator('[data-valmsg-for="Order.Phone"]')).toContainText('valid phone number');
  });

  test('validates checkbox required', async ({ page }) => {
    await page.goto('/demos/syncfusion-validation/index.html');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100);
    
    await expect(page.locator('[data-valmsg-for="Order.AcceptTerms"]')).toContainText('must accept');
  });

  test('adds e-error class to Syncfusion wrapper on error', async ({ page }) => {
    await page.goto('/demos/syncfusion-validation/index.html');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100);
    
    // Check that e-error class is added to wrapper
    const categoryWrapper = page.locator('#category-wrapper');
    await expect(categoryWrapper).toHaveClass(/e-error/);
  });

  test('dropdown selection works and clears error', async ({ page }) => {
    await page.goto('/demos/syncfusion-validation/index.html');
    
    // Submit to show error
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100);
    
    // Verify error shown
    await expect(page.locator('[data-valmsg-for="Order.Category"]')).toContainText('select a category');
    
    // Click on the dropdown icon to open
    await page.click('#category-wrapper .e-input-group-icon');
    await page.waitForSelector('.sf-dropdown-list.open');
    
    // Select a category
    await page.click('.sf-dropdown-item[data-value="electronics"]');
    
    // Re-submit to trigger validation again (client-side validation clears on valid submit)
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100);
    
    // Error should be cleared
    const errorSpan = page.locator('[data-valmsg-for="Order.Category"]');
    await expect(errorSpan).toHaveText('');
  });

  test('submits successfully when all validations pass', async ({ page }) => {
    await page.goto('/demos/syncfusion-validation/index.html');
    
    await page.route('**/api/order', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Order placed!',
          order: { id: 12345 }
        })
      });
    });
    
    // Fill all required fields
    // Select category - click on dropdown icon to open
    await page.click('#category-wrapper .e-input-group-icon');
    await page.waitForSelector('.sf-dropdown-list.open');
    await page.click('.sf-dropdown-item[data-value="electronics"]');
    
    // Quantity is already 1
    
    // Select date
    await page.fill('#deliveryDate-display', '2024-12-25');
    
    // Fill customer name
    await page.fill('#customerName-display', 'John Doe');
    
    // Fill phone (will be auto-formatted to 123-456-7890)
    await page.fill('#phone-display', '1234567890');
    
    // Check terms
    await page.check('#terms-display');
    
    await page.click('button[type="submit"]');
    
    // Wait for success
    await expect(page.locator('#form-result')).toContainText('Order Placed Successfully');
  });

  test('hidden input receives value from Syncfusion component', async ({ page }) => {
    await page.goto('/demos/syncfusion-validation/index.html');
    
    // Select category - click on dropdown icon to open
    await page.click('#category-wrapper .e-input-group-icon');
    await page.waitForSelector('.sf-dropdown-list.open');
    await page.click('.sf-dropdown-item[data-value="books"]');
    
    // Verify hidden input has the value
    const hiddenValue = await page.locator('#category').inputValue();
    expect(hiddenValue).toBe('books');
  });
});

