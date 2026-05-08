import { test, expect } from '@playwright/test';

test('Validate title after successful login', async ({ page }) => {
  await page.goto('https://web-blr.dev.e2open.com/qaauto/mdi/html/desktop/login.jsp');

  const username = page.locator('#user_id');
  const password = page.locator('#password');
  const loginButton = page.locator('#loginButton');

  await username.fill('UITESTREG5_ADMIN');
  await password.fill('password');

  await Promise.all([
    page.waitForLoadState('domcontentloaded'),
    loginButton.click(),
  ]);

  await expect(page).toHaveTitle('Trade Automation - My Dashboard');
});
