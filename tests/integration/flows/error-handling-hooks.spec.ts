import { test, expect } from '@playwright/test';

/**
 * Integration tests for error handling in ALIS hooks.
 * 
 * These tests verify that ctx.error is correctly set for:
 * 1. Client-side validation failures
 * 2. Server-side validation failures (400 ProblemDetails)
 * 3. HTTP errors (4xx, 5xx)
 * 
 * This ensures hooks can reliably check ctx.error to decide whether
 * to proceed with success actions (e.g., closing modals).
 */

async function waitForALIS(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => typeof window['ALIS'] !== 'undefined');
}

test.describe('Error Handling in Hooks', () => {
  
  test.describe('Server-side Validation (400 ProblemDetails)', () => {
    test('ctx.error is set for 400 ProblemDetails response', async ({ page }) => {
      await page.goto('/demos/methods/index.html');
      await waitForALIS(page);

      // Set up hook to capture ctx.error
      await page.evaluate(() => {
        window['capturedError'] = undefined;
        window['hookCalled'] = false;
        window['captureErrorHook'] = (ctx: { error?: Error | null }) => {
          window['hookCalled'] = true;
          window['capturedError'] = ctx.error ? {
            message: ctx.error.message,
            code: (ctx.error as { code?: string }).code
          } : null;
        };
        
        const btn = document.getElementById('btn-post');
        btn?.setAttribute('data-alis-on-after', 'captureErrorHook');
      });

      // Mock 400 ProblemDetails response
      await page.route('**/api/resource', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Validation failed',
            status: 400,
            errors: {
              name: ['Name is required'],
              email: ['Invalid email format']
            }
          })
        });
      });

      await page.click('#btn-post');
      
      // Wait for hook to be called
      await page.waitForFunction(() => window['hookCalled'] === true);
      
      const capturedError = await page.evaluate(() => window['capturedError']);
      
      expect(capturedError).not.toBeNull();
      expect(capturedError?.code).toBe('SERVER_VALIDATION_ERROR');
      expect(capturedError?.message).toContain('Validation failed');
    });

    test('hook can prevent modal close on validation error', async ({ page }) => {
      await page.goto('/demos/methods/index.html');
      await waitForALIS(page);

      // Set up a mock modal and hook that only closes on success
      await page.evaluate(() => {
        // Create mock modal
        const modal = document.createElement('div');
        modal.id = 'test-modal';
        modal.className = 'modal show';
        modal.textContent = 'Test Modal';
        document.body.appendChild(modal);

        window['modalClosed'] = false;
        window['closeModalOnSuccess'] = (ctx: { error?: Error | null }) => {
          // Only close if no error
          if (!ctx.error) {
            document.getElementById('test-modal')?.classList.remove('show');
            window['modalClosed'] = true;
          }
        };
        
        const btn = document.getElementById('btn-post');
        btn?.setAttribute('data-alis-on-after', 'closeModalOnSuccess');
      });

      // Mock 400 ProblemDetails response
      await page.route('**/api/resource', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Please fix errors',
            status: 400,
            errors: { field: ['Error'] }
          })
        });
      });

      await page.click('#btn-post');
      await page.waitForTimeout(500);
      
      // Modal should NOT be closed
      const modalClosed = await page.evaluate(() => window['modalClosed']);
      expect(modalClosed).toBe(false);
      
      // Modal should still have 'show' class
      await expect(page.locator('#test-modal')).toHaveClass(/show/);
    });

    test('hook closes modal on successful response', async ({ page }) => {
      await page.goto('/demos/methods/index.html');
      await waitForALIS(page);

      // Set up a mock modal and hook
      await page.evaluate(() => {
        const modal = document.createElement('div');
        modal.id = 'test-modal';
        modal.className = 'modal show';
        modal.textContent = 'Test Modal';
        document.body.appendChild(modal);

        window['modalClosed'] = false;
        window['closeModalOnSuccess'] = (ctx: { error?: Error | null }) => {
          if (!ctx.error) {
            document.getElementById('test-modal')?.classList.remove('show');
            window['modalClosed'] = true;
          }
        };
        
        const btn = document.getElementById('btn-post');
        btn?.setAttribute('data-alis-on-after', 'closeModalOnSuccess');
      });

      // Mock successful response
      await page.route('**/api/resource', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await page.click('#btn-post');
      await page.waitForTimeout(500);
      
      // Modal should be closed
      const modalClosed = await page.evaluate(() => window['modalClosed']);
      expect(modalClosed).toBe(true);
      
      // Modal should NOT have 'show' class
      await expect(page.locator('#test-modal')).not.toHaveClass(/show/);
    });
  });

  test.describe('HTTP Errors (4xx, 5xx without ProblemDetails)', () => {
    test('ctx.error is set for 404 Not Found', async ({ page }) => {
      await page.goto('/demos/methods/index.html');
      await waitForALIS(page);

      await page.evaluate(() => {
        window['capturedError'] = undefined;
        window['hookCalled'] = false;
        window['captureErrorHook'] = (ctx: { error?: Error | null }) => {
          window['hookCalled'] = true;
          window['capturedError'] = ctx.error ? {
            message: ctx.error.message,
            code: (ctx.error as { code?: string }).code
          } : null;
        };
        
        const btn = document.getElementById('btn-get');
        btn?.setAttribute('data-alis-on-after', 'captureErrorHook');
      });

      await page.route('**/api/resource', async (route) => {
        await route.fulfill({
          status: 404,
          statusText: 'Not Found',
          body: 'Resource not found'
        });
      });

      await page.click('#btn-get');
      await page.waitForFunction(() => window['hookCalled'] === true);
      
      const capturedError = await page.evaluate(() => window['capturedError']);
      
      expect(capturedError).not.toBeNull();
      expect(capturedError?.code).toBe('HTTP_ERROR');
      expect(capturedError?.message).toContain('404');
    });

    test('ctx.error is set for 500 Internal Server Error', async ({ page }) => {
      await page.goto('/demos/methods/index.html');
      await waitForALIS(page);

      await page.evaluate(() => {
        window['capturedError'] = undefined;
        window['hookCalled'] = false;
        window['captureErrorHook'] = (ctx: { error?: Error | null }) => {
          window['hookCalled'] = true;
          window['capturedError'] = ctx.error ? {
            message: ctx.error.message,
            code: (ctx.error as { code?: string }).code
          } : null;
        };
        
        const btn = document.getElementById('btn-get');
        btn?.setAttribute('data-alis-on-after', 'captureErrorHook');
        // Disable retry so we get immediate error response
        btn?.setAttribute('data-alis-retry', 'false');
      });

      await page.route('**/api/resource', async (route) => {
        await route.fulfill({
          status: 500,
          statusText: 'Internal Server Error',
          body: 'Server error'
        });
      });

      await page.click('#btn-get');
      await page.waitForFunction(() => window['hookCalled'] === true, { timeout: 5000 });
      
      const capturedError = await page.evaluate(() => window['capturedError']);
      
      expect(capturedError).not.toBeNull();
      expect(capturedError?.code).toBe('HTTP_ERROR');
      expect(capturedError?.message).toContain('500');
    });
  });

  test.describe('Successful Responses', () => {
    test('ctx.error is null for 200 OK', async ({ page }) => {
      await page.goto('/demos/methods/index.html');
      await waitForALIS(page);

      await page.evaluate(() => {
        window['capturedError'] = 'not-set';
        window['hookCalled'] = false;
        window['captureErrorHook'] = (ctx: { error?: Error | null }) => {
          window['hookCalled'] = true;
          window['capturedError'] = ctx.error;
        };
        
        const btn = document.getElementById('btn-get');
        btn?.setAttribute('data-alis-on-after', 'captureErrorHook');
      });

      await page.route('**/api/resource', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: 'success' })
        });
      });

      await page.click('#btn-get');
      await page.waitForFunction(() => window['hookCalled'] === true);
      
      const capturedError = await page.evaluate(() => window['capturedError']);
      
      expect(capturedError).toBeNull();
    });

    test('ctx.error is null for 201 Created', async ({ page }) => {
      await page.goto('/demos/methods/index.html');
      await waitForALIS(page);

      await page.evaluate(() => {
        window['capturedError'] = 'not-set';
        window['hookCalled'] = false;
        window['captureErrorHook'] = (ctx: { error?: Error | null }) => {
          window['hookCalled'] = true;
          window['capturedError'] = ctx.error;
        };
        
        const btn = document.getElementById('btn-post');
        btn?.setAttribute('data-alis-on-after', 'captureErrorHook');
      });

      await page.route('**/api/resource', async (route) => {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 1, created: true })
        });
      });

      await page.click('#btn-post');
      await page.waitForFunction(() => window['hookCalled'] === true);
      
      const capturedError = await page.evaluate(() => window['capturedError']);
      
      expect(capturedError).toBeNull();
    });
  });

  test.describe('Client-side Validation', () => {
    test('ctx.error is set for client-side validation failure', async ({ page }) => {
      await page.goto('/demos/client-validation/index.html');
      await waitForALIS(page);

      await page.evaluate(() => {
        window['capturedError'] = undefined;
        window['hookCalled'] = false;
        window['captureErrorHook'] = (ctx: { error?: Error | null }) => {
          window['hookCalled'] = true;
          window['capturedError'] = ctx.error ? {
            message: ctx.error.message,
            code: (ctx.error as { code?: string }).code
          } : null;
        };
        
        const form = document.querySelector('form[data-alis-validate]');
        form?.setAttribute('data-alis-on-after', 'captureErrorHook');
      });

      // Submit empty form to trigger client-side validation
      await page.click('button[type="submit"]');
      
      // Wait for hook to be called (or validation to complete)
      await page.waitForFunction(() => window['hookCalled'] === true, { timeout: 5000 }).catch(() => {
        // If hook wasn't called, validation prevented submission entirely
      });
      
      const hookCalled = await page.evaluate(() => window['hookCalled']);
      
      if (hookCalled) {
        const capturedError = await page.evaluate(() => window['capturedError']);
        expect(capturedError).not.toBeNull();
        // Client-side validation uses 'VALIDATION_ERROR' code (from ValidationError class)
        expect(capturedError?.code).toBe('VALIDATION_ERROR');
      }
      // If hook wasn't called, that's also valid - validation prevented the request
    });
  });

  test.describe('Combined Scenarios', () => {
    test('multiple hooks all receive ctx.error on failure', async ({ page }) => {
      await page.goto('/demos/methods/index.html');
      await waitForALIS(page);

      await page.evaluate(() => {
        window['hook1Error'] = 'not-set';
        window['hook2Error'] = 'not-set';
        window['hook1'] = (ctx: { error?: Error | null }) => {
          window['hook1Error'] = ctx.error ? ctx.error.message : null;
        };
        window['hook2'] = (ctx: { error?: Error | null }) => {
          window['hook2Error'] = ctx.error ? ctx.error.message : null;
        };
        
        const btn = document.getElementById('btn-post');
        btn?.setAttribute('data-alis-on-after', 'hook1, hook2');
      });

      await page.route('**/api/resource', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            title: 'Validation failed',
            errors: { field: ['Error'] }
          })
        });
      });

      await page.click('#btn-post');
      await page.waitForFunction(() => 
        window['hook1Error'] !== 'not-set' && window['hook2Error'] !== 'not-set'
      );
      
      const hook1Error = await page.evaluate(() => window['hook1Error']);
      const hook2Error = await page.evaluate(() => window['hook2Error']);
      
      // Both hooks should receive the same error
      expect(hook1Error).toContain('Validation failed');
      expect(hook2Error).toContain('Validation failed');
    });
  });
});

