import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('console', message => {
    // eslint-disable-next-line no-console
    console.log('[browser]', message.type(), message.text());
  });
});

test('confirm dialog must be accepted before request continues', async ({ page }) => {
  await page.route('**/api/items/1', route =>
    route.fulfill({
      status: 200,
      body: '<p>Deleted</p>',
      headers: { 'Content-Type': 'text/html' }
    })
  );

  await page.goto('/tests/integration/pages/confirm.html');
  await page.waitForFunction(() => {
    const w = window as typeof window & { __ALIS_INIT?: boolean };
    return w.__ALIS_INIT === true;
  });

  const dialogPromise = new Promise(resolve => {
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Delete this item?');
      dialog.accept().then(resolve);
    });
  });

  await page.click('button[data-alis]');
  await expect(page).toHaveURL(/confirm\.html$/);
  await dialogPromise;

  await expect(page.locator('#confirm-result')).toContainText('Deleted');
});

