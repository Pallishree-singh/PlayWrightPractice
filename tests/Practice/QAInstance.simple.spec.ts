import { expect, test } from '@playwright/test';

test('Automate QA Instance - simple', async ({ page }) => {
  await page.goto('https://web-blr.dev.e2open.com/qaauto/mdi/html/desktop/login.jsp');

  await page.locator('#user_id').fill('UITESTREG5_ADMIN');
  await page.locator('#password').fill('password');
  await page.locator('#loginButton').click();

  await expect(page.locator('#titleTD').first()).toBeVisible({ timeout: 15000 });
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'menu Menu' }).click();
  await expect(page.getByRole('button', { name: 'close Menu' })).toBeVisible();
  await page.getByRole('button', { name: 'Partners', exact: true }).click();
  //await page.getByText('Partner', { exact: true }).first().click();

  await expect(page.locator('#titleTD').first()).toHaveText('Partner Details');
});