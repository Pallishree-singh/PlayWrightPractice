import{test,expect} from '@playwright/test';

test('validate error message on invalid credential', async({page})=>
{
await page.goto("https://vwo.com/free-trial/?utm_medium=website&utm_source=login-page&utm_campaign=mof_eg_loginpage");

let gmail=page.locator("#page-v1-step1-email");
await gmail.fill("abc@gmail.com");

let errormessage=page.getByText("gmail.com doesn't look like a business domain. Please use your business email.");
await expect(errormessage).toBeVisible();

await page.waitForTimeout(3000);

}
)