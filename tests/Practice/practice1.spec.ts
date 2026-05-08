import { test, expect} from '@playwright/test';

test('Verify the title', async({page})=>
{
  await page.goto('https://web-blr.dev.e2open.com/qaauto/mdi/html/desktop/login.jsp');
  expect(page).toHaveTitle('Trade Automation - Login');
  
});