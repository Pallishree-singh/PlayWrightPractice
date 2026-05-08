import { test, expect } from '@playwright/test';

test('Validate Invalid Login', async ({ page }) => {
  await page.goto('https://app.vwo.com/#/login');

  const username = page.getByRole('textbox', { name: 'Email address' });
  const password = page.getByRole('textbox', { name: 'Password' });
  const loginButton = page.getByRole('button', { name: 'Sign in', exact: true });
  const errorMsg = page.locator('#js-notification-box-msg');

  await username.fill('invalid@example.com');
  await password.fill('password123');
  await loginButton.click();

  await expect(errorMsg).toHaveText('Your email, password, IP address or location did not match');
});