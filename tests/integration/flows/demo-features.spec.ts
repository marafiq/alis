/**
 * ALIS Demo Server Integration Tests
 * Tests the real demo server features
 * 
 * These tests require the demo server to be running:
 * cd demo-server && bun run start
 */

import { test, expect } from '@playwright/test';

// Skip these tests if demo server is not running
const DEMO_URL = 'http://localhost:3333';

test.beforeEach(async ({ page }) => {
  // Check if demo server is available
  try {
    const response = await page.request.get(DEMO_URL);
    if (!response.ok()) {
      test.skip();
    }
  } catch {
    test.skip();
  }
});

test.describe('Demo Server - Debounced Search', () => {
  test('should maintain focus while typing in search input', async ({ page }) => {
    await page.goto(DEMO_URL);
    
    const searchInput = page.locator('#search-input');
    await searchInput.click();
    
    // Type slowly to trigger multiple debounced requests
    await searchInput.type('alice', { delay: 100 });
    
    // Wait for debounce + response
    await page.waitForTimeout(500);
    
    // Verify input still has focus
    const isFocused = await searchInput.evaluate(el => document.activeElement === el);
    expect(isFocused).toBe(true);
    
    // Verify input value is preserved
    expect(await searchInput.inputValue()).toBe('alice');
  });

  test('should show search results without losing input focus', async ({ page }) => {
    await page.goto(DEMO_URL);
    
    const searchInput = page.locator('#search-input');
    await searchInput.fill('bob');
    
    // Wait for results
    await page.waitForTimeout(500);
    
    // Should still be focused
    const isFocused = await searchInput.evaluate(el => document.activeElement === el);
    expect(isFocused).toBe(true);
    
    // Results should be visible
    const results = page.locator('#search-results-content');
    await expect(results).not.toContainText('Start typing');
  });
});

test.describe('Demo Server - Contact Form Validation', () => {
  test('should show validation errors next to fields', async ({ page }) => {
    await page.goto(DEMO_URL + '#contact');
    
    // Submit empty form
    await page.click('button:has-text("Send Message")');
    
    // Wait for response
    await page.waitForTimeout(600);
    
    // Check for validation messages next to fields
    const nameError = page.locator('[data-valmsg-for="name"]');
    const emailError = page.locator('[data-valmsg-for="email"]');
    
    await expect(nameError).toBeVisible();
    await expect(emailError).toBeVisible();
    await expect(nameError).toContainText('required');
    await expect(emailError).toContainText('required');
  });

  test('should clear validation errors when corrected', async ({ page }) => {
    await page.goto(DEMO_URL + '#contact');
    
    // Submit empty form
    await page.click('button:has-text("Send Message")');
    await page.waitForTimeout(600);
    
    // Fill in valid data
    await page.fill('#contact-name', 'John Doe');
    await page.fill('#contact-email', 'john@example.com');
    await page.selectOption('#contact-subject', 'general');
    await page.fill('#contact-message', 'This is a test message that is long enough.');
    await page.check('input[name="agree"]');
    
    // Submit again
    await page.click('button:has-text("Send Message")');
    await page.waitForTimeout(600);
    
    // Should show success
    const result = page.locator('#contact-result');
    await expect(result).toContainText('Message Sent');
  });
});

test.describe('Demo Server - Add User Modal', () => {
  test('should auto-close modal and refresh table on success', async ({ page }) => {
    await page.goto(DEMO_URL);
    
    // Wait for initial users load
    await page.waitForSelector('#users-table tr:not(.loading)');
    
    // Count initial users
    const initialCount = await page.locator('#users-table tr').count();
    
    // Open add user modal
    await page.click('button:has-text("Add User")');
    await page.waitForSelector('#modal-overlay.show');
    
    // Fill form
    await page.fill('#new-name', 'Test User');
    await page.fill('#new-email', 'test@example.com');
    await page.selectOption('#new-role', 'Viewer');
    
    // Submit
    await page.click('button:has-text("Create User")');
    
    // Wait for response
    await page.waitForTimeout(800);
    
    // Modal should auto-close
    const modalVisible = await page.locator('#modal-overlay').evaluate(
      el => el.classList.contains('show')
    );
    expect(modalVisible).toBe(false);
    
    // Toast should appear
    await expect(page.locator('.toast.success')).toBeVisible();
    
    // Table should be refreshed with new user
    await page.waitForTimeout(1000);
    const newCount = await page.locator('#users-table tr').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('should show validation errors in modal without closing', async ({ page }) => {
    await page.goto(DEMO_URL);
    
    // Open add user modal
    await page.click('button:has-text("Add User")');
    await page.waitForSelector('#modal-overlay.show');
    
    // Submit empty form
    await page.click('button:has-text("Create User")');
    await page.waitForTimeout(600);
    
    // Modal should still be open
    const modalVisible = await page.locator('#modal-overlay').evaluate(
      el => el.classList.contains('show')
    );
    expect(modalVisible).toBe(true);
    
    // Validation errors should be visible
    await expect(page.locator('[data-valmsg-for="name"]')).toContainText('required');
  });
});

test.describe('Demo Server - Delete User', () => {
  test('should show confirm dialog before delete', async ({ page }) => {
    await page.goto(DEMO_URL);
    
    // Wait for users to load
    await page.waitForSelector('#users-table tr:not(.loading)');
    
    // Click delete on first user
    await page.click('#users-table .btn-danger:first-child');
    
    // Confirm dialog should appear
    await expect(page.locator('#modal-overlay.show')).toBeVisible();
    await expect(page.locator('.modal')).toContainText('Confirm Delete');
  });
});

