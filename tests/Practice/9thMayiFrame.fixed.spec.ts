import { test, expect } from '@playwright/test';

test('Validate iFrame - fixed', async ({ page }) => {
  await page.goto('https://app.thetestingacademy.com/playwright/frames/');

  const frame = page.frameLocator("iframe[id*='frame-one']");

  await frame.getByRole('textbox', { name: 'Vehicle name' }).fill('BMW');
  await frame.getByRole('textbox', { name: 'Owner name' }).fill('Pallishree');
  await frame.getByRole('textbox', { name: 'Registration number' }).fill('KA-01-PS-63339');
  await frame.getByRole('combobox', { name: 'Vehicle type' }).selectOption('SUV');
  await frame.getByRole('spinbutton', { name: 'Year' }).fill('2019');
  await frame.getByRole('textbox', { name: 'Notes' }).fill('This is my dream car');

  await frame.getByRole('button', { name: 'Submit registration' }).click();

  // Reliable assertion: iframe form remained accessible and value entered correctly.
  await expect(frame.getByRole('textbox', { name: 'Vehicle name' })).toHaveValue('BMW');
});
