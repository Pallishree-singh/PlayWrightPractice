import {test,expect} from '@playwright/test';

test('validate locator', async({page})=>
{
 
     await page.goto('https://web-blr.dev.e2open.com/qaauto/mdi/html/desktop/login.jsp');
     let uname=page.locator("#user_id");
     let pwd=page.locator("#password");
     let loginbutton=page.locator("#loginButton");
     let errormsg=page.locator("#errorArea");

     await uname.fill("UITESTREG");
     await pwd.fill("password");
     await loginbutton.click();

     await expect(errormsg).toHaveText("Invalid user-id or password. Please contact your administrator");
     //await page.waitForTimeout(3000);
     let Backbutton=page.getByText("Back");
     await Backbutton.click();

     await uname.fill("UITESTREG5_ADMIN");
     await pwd.fill("password");
     await loginbutton.click();

     let leabel=page.locator("#desktop-product__title");
     await expect(leabel).toHaveText("Trade Automation");

     let user=page.getByRole('link', { name: /UITESTREG5_ADMIN/ });
     await user.click();  
     
     let selectRole=page.locator("#desktop-user__role-Implementation Administrator");
     await selectRole.click();







  


})