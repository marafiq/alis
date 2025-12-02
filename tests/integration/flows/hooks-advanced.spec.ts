import { test, expect } from '@playwright/test';

test.describe('Advanced Hooks (Modal, Toast, Grid)', () => {
  test('shows confirm modal before delete', async ({ page }) => {
    await page.goto('/demos/hooks-advanced/index.html');
    
    // Wait for grid to render
    await expect(page.locator('.grid-row')).toHaveCount(3);

    await page.route('**/api/users/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'User deleted' })
      });
    });

    // Click delete on first user
    await page.click('.grid-row:first-child .btn-delete');

    // Modal should appear
    await expect(page.locator('#confirm-modal')).toHaveClass(/show/);
    await expect(page.locator('#modal-title')).toHaveText('Delete User');
    await expect(page.locator('#modal-body')).toContainText('Are you sure');

    // Cancel should close modal without deleting
    await page.click('#modal-cancel');
    await expect(page.locator('#confirm-modal')).not.toHaveClass(/show/);

    // User should still be in grid
    await expect(page.locator('.grid-row')).toHaveCount(3);
  });

  test('confirms delete and shows toast', async ({ page }) => {
    await page.goto('/demos/hooks-advanced/index.html');
    
    // Wait for grid to render
    await expect(page.locator('.grid-row')).toHaveCount(3);

    await page.route('**/api/users/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'User deleted successfully' })
      });
    });

    // Click delete
    await page.click('.grid-row:first-child .btn-delete');
    
    // Confirm in modal
    await page.click('#modal-confirm');

    // Toast should appear with success message
    await expect(page.locator('.toast.success')).toBeVisible();
    await expect(page.locator('.toast.success')).toContainText('User deleted successfully');

    // Grid should be refreshed (one less row)
    await expect(page.locator('.grid-row')).toHaveCount(2);
  });

  test('shows error toast on failure', async ({ page }) => {
    await page.goto('/demos/hooks-advanced/index.html');
    
    // Wait for grid to render
    await expect(page.locator('.grid-row')).toHaveCount(3);

    await page.route('**/api/users/**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Server error' })
      });
    });

    // Click delete and confirm
    await page.click('.grid-row:first-child .btn-delete');
    await page.click('#modal-confirm');

    // Error toast should appear
    await expect(page.locator('.toast.error')).toBeVisible();
  });

  test('add user with confirm modal', async ({ page }) => {
    await page.goto('/demos/hooks-advanced/index.html');

    await page.route('**/api/users', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'User added',
            user: { id: 4, name: 'New User', email: 'new@example.com' }
          })
        });
      }
    });

    // Click add user
    await page.click('#add-user-btn');

    // Modal should show
    await expect(page.locator('#modal-title')).toHaveText('Add User');

    // Confirm
    await page.click('#modal-confirm');

    // Toast and grid refresh
    await expect(page.locator('.toast.success')).toBeVisible();
    await expect(page.locator('.grid-row')).toHaveCount(4);
  });

  test('form submission triggers hooks', async ({ page }) => {
    await page.goto('/demos/hooks-advanced/index.html');
    
    // Wait for grid to render
    await expect(page.locator('.grid-row')).toHaveCount(3);

    await page.route('**/api/users', async route => {
      if (route.request().method() === 'POST') {
        // Parse the body - now FormData (multipart)
        const postData = route.request().postData() || '';
        let name = 'Unknown';
        let email = '';
        
        const contentType = route.request().headers()['content-type'] || '';
        if (contentType.includes('json')) {
          const body = JSON.parse(postData);
          name = body.name;
          email = body.email;
        } else if (contentType.includes('multipart/form-data')) {
          // Parse FormData - extract name from multipart body
          const nameMatch = postData.match(/name="name"\r\n\r\n([^\r\n]+)/);
          const emailMatch = postData.match(/name="email"\r\n\r\n([^\r\n]+)/);
          name = nameMatch ? nameMatch[1] : 'Unknown';
          email = emailMatch ? emailMatch[1] : '';
        } else {
          // URL-encoded
          const params = new URLSearchParams(postData);
          name = params.get('name') || 'Unknown';
          email = params.get('email') || '';
        }
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: `Created user: ${name}`,
            user: { id: 5, name, email }
          })
        });
      }
    });

    // Fill form
    await page.fill('#user-form input[name="name"]', 'Test User');
    await page.fill('#user-form input[name="email"]', 'test@example.com');

    // Submit
    await page.click('#user-form button[type="submit"]');

    // Should show success toast
    await expect(page.locator('.toast.success')).toContainText('Created user: Test User');

    // Grid should have new user
    await expect(page.locator('.grid-row')).toHaveCount(4);
  });
});

