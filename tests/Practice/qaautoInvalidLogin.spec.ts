import {test,expect} from '@playwright/test';

test('invalid login', async({page})=>
{
await page.goto('https://web-blr.dev.e2open.com/qaauto/mdi/html/desktop/login.jsp');
    let username=page.locator("#user_id");
    let password=page.locator("#password");
    let loginbutton=page.locator("#loginButton");

    await username.fill("UITESTREG5_ADMIN");
    await password.fill("pwd");
    await loginbutton.click();

    let errormessage=page.locator('#errorArea');
    await expect(errormessage).toHaveText('Invalid user-id or password. Please contact your administrator');
});