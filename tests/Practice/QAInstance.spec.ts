import {expect,test,FrameLocator,Locator} from '@playwright/test';

test('Automate QA Instance',async({page}) =>
{
    await page.goto('https://web-blr.dev.e2open.com/qaauto/mdi/html/desktop/login.jsp');

    let username=page.locator('#user_id');
    await username.fill('UITESTREG5_ADMIN');
    let password=page.locator('#password');
    await password.fill('password');
    await page.locator('#loginButton').click();

    const title= await page.locator('#desktop-product__title').first().textContent();
    console.log(`Title: [${title}]`);
    await expect(title).toEqual('Trade Automation');

    let menu=page.getByTitle('View menu items');
    await menu.click();
    console.log("Menu clicked");
    await page.waitForSelector('text=Partners', { state: 'visible' });
    await page.getByText('Partners').click();
    await page.getByText('Partner').click();

    await expect(page.locator('#titleTD').first()).toHaveText('Partner Details');
    await page.waitForTimeout(3000);
})