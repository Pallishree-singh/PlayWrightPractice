import {test,expect} from'@playwright/test';

test('check the visibility task', async({page})=>
{
    await page.goto('https://app.thetestingacademy.com/playwright/webtable');
     let search=page.locator('#employee-search');
     await search.fill("Kabir");

     let selectButton=page.locator('#select-cloud-qa');
     await selectButton.click();

     let clearbuton=page.locator('#clear-selection');
     await clearbuton.click();

     let checkName=page.locator('td:has-text("Kabir Khan")');
     await expect(checkName).toBeVisible();

     let checkbox=page.locator('//td[text()="Kabir.Khan"]/preceding-sibling::td//input[@type="checkbox"]');
     await expect(checkbox).toBeVisible();
     await checkbox.check();

     let text=page.locator('#selected-output');
     await expect(text).toHaveText("Selected usernames will appear here.");

})