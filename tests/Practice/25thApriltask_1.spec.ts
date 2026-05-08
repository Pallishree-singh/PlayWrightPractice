import {test,expect} from '@playwright/test';

test('Validate Invalid Login', async({page})=>
{
await page.goto('https://app.vwo.com/#/login');
let username=page.getByRole('textbox', { name: 'Email address' });
let password=page.getByRole('textbox', { name: 'Password' });
let loginbutton=page.getByRole("button",{name:"Sign in"});
let errormsg=page.locator("#js-notification-box-msg");

await username.fill("John Doe");
await password.fill("password123");
await loginbutton.click();

await expect(errormsg).toHaveText("Your email, password, IP address or location did not match");
})