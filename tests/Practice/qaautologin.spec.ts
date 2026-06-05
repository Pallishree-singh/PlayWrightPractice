import {test,expect} from '@playwright/test';

test('Validate Login', async({page})=>
{
    await page.goto('https://web-blr.dev.e2open.com/qaauto/mdi/html/desktop/login.jsp');
    let username=page.locator("#user_id");
    let password=page.locator("#password");
    let loginbutton=page.locator("#loginButton");

    await username.fill("UITESTREG5_ADMIN");
    await password.fill("password");
    //await loginbutton.click();

   

    });