import { test, expect } from '@playwright/test';
import { readCSV } from './csvReader';
import * as path from 'path';

test.describe('DDT CSV Practice', () => {
  const loginData = readCSV(path.join(__dirname, 'register.csv'));

  for (const [index, data] of loginData.entries()) {
    test(`Login test - row ${index + 1} - ${data.firstName} ${data.lastName}`, async ({ page }) => {
      await page.goto('https://app.thetestingacademy.com/playwright/tables/practice#page');

      const firstName = page.locator('#first-name');
      const lastName = page.locator('#last-name');
      const saveButton = page.locator('#profile-submit');

      await firstName.fill(data.firstName);
      await lastName.fill(data.lastName);
      await saveButton.click();

      await expect(saveButton).toBeVisible();
    });
  }
});
