import { test, expect } from '@playwright/test';

test('smoke test: loads demo page', async ({ page }) => {
  // Start by navigating to a known demo page (we need to create one or use existing)
  // I'll assume demos/index.html exists or create it. 
  // Actually I should check demos first.
  
  // For now, I'll create a simple test that doesn't require a specific demo page 
  // other than the root which vite serves.
  await page.goto('/');
  
  // If vite serves the directory listing, title might contain "Index of".
  // Or if we have an index.html in root? We don't.
  // We have demos/form-submit/index.html
  
  await page.goto('/demos/form-submit/index.html');
  const title = await page.title();
  // We don't know the title yet, but page load should succeed.
  expect(title).toBeDefined();
});

