import {type Locator,type Page} from '@playwright/test';

export class TTACartInventoryPage
{
    readonly page: Page;
    readonly selectItem:Locator;
    readonly addtoCart:Locator;
    readonly cart:Locator;

    constructor(page: Page)
    {
        this.page=page;
        this.selectItem=page.getByText('Test.allTheThings() T-Shirt (Red)');
        this.addtoCart=page.getByRole('button',{name:'Add to cart'});
        this.cart=page.locator('#shopping_cart_container');
    }

   

    async addToInventory()
    {
        await this.selectItem.click();
        await this.addtoCart.click();
        await this.cart.click();
    }
}