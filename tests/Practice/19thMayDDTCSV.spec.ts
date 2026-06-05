import{test,expect} from '@playwright/test';
import {readCSV} from './csvReader';
import * as path from "path";

test.describe.serial("DDT CSV Practice",()=>
{
    const loginData=readCSV(path.join(__dirname, "register.csv"));

    for (const data of loginData)
    {
        test(`Login with ${data.firstName} ${data.lastName}`,async({page})=>
        {
            await page.goto("https://app.thetestingacademy.com/playwright/tables/practice#page");
            let firstname=page.locator('#first-name');
            let lastname=page.locator('#last-name');
            let Savebutton=page.locator('#profile-submit');

            await firstname.fill(data.firstName);
            await lastname.fill(data.lastName);
            await Savebutton.click();
        });
    }
})