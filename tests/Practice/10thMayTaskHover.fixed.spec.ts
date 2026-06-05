import { test, expect } from '@playwright/test';

test('Hover exercise - fixed with stable locators', async ({ page }) => {
  await page.goto('https://app.thetestingacademy.com/playwright/widgets/hover-menu');

  const addOnsMenu = page.getByTestId('nav-add-ons');
  await addOnsMenu.hover();

  const wifiOption = page.getByTestId('test-id-Wifi');
  await expect(wifiOption).toBeVisible();
  await wifiOption.click();

  const output = page.locator('#output');
  await expect(output).toContainText('test-id-Wifi');
});
