import {test,expect} from '@playwright/test';
import {LoginPage} from './TTACartLoginPage';
import {TTACartInventoryPage} from './TTACartInventoryPage';

test('TTACart automation', async ({page})=>

{
    const loginPage=new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user','tta_secret');

    const inventoryPage=new TTACartInventoryPage(page);
    await inventoryPage.addToInventory();
    await expect(page).toHaveURL('https://app.thetestingacademy.com/playwright/ttacart/cart');
});