import{test,expect,FrameLocator,Locator}  from '@playwright/test';

test('ShadowDOM exercise',async({page})=>
{
    await page.goto('https://selectorshub.com/xpath-practice-page/');

    await page.locator('#kils').fill('Pallishree Singh');
    await page.locator('#pizza').fill('Margherita');
    await page.getByPlaceholder('enter password').fill('Practice@123');
    await page.getByText('Click to practice iframe inside shadow dom scenario').click();

    await page.waitForTimeout(1000);
})

