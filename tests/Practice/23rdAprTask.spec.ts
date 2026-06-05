import { test, expect} from '@playwright/test';

test('take an Appointment', async({page})=>
{
    await page.goto('https://katalon-demo-cura.herokuapp.com/');
    //expect(page).toHaveTitle('CURA Healthcare Service');
    let appointment= page.locator("#btn-make-appointment");
    await appointment.click();
    

    let uname=page.locator("#txt-username");
    let pass=page.locator("#txt-password");
    let loginbutton=page.locator("#btn-login");

    await uname.fill("John Doe");
    await pass.fill("ThisIsNotAPassword");
    await loginbutton.click();
    await expect(page).toHaveURL('https://katalon-demo-cura.herokuapp.com/#appointment');
    })