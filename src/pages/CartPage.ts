import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * TTACart – Your Cart page.
 *
 *   const cart = new CartPage(page);
 *   await cart.open();
 *   await cart.assertLoaded();
 *   await cart.checkout();
 */
export class CartPage extends BasePage {

    static readonly PATH = '/playwright/ttacart/cart.html';

    private readonly title: Locator;
    private readonly cartItems: Locator;
    private readonly itemNames: Locator;
    private readonly itemPrices: Locator;
    private readonly itemQuantities: Locator;
    private readonly continueShoppingBtn: Locator;
    private readonly checkoutBtn: Locator;
    private readonly cartBadge: Locator;

    constructor(page: Page) {
        super(page, 'CartPage');
        this.title             = page.locator('[data-test="title"]');
        this.cartItems         = page.locator('[data-test="inventory-item"]');
        this.itemNames         = page.locator('[data-test="inventory-item-name"]');
        this.itemPrices        = page.locator('[data-test="inventory-item-price"]');
        this.itemQuantities    = page.locator('[data-test="item-quantity"]');
        this.continueShoppingBtn = page.locator('[data-test="continue-shopping"]');
        this.checkoutBtn       = page.locator('[data-test="checkout"]');
        this.cartBadge         = page.locator('[data-test="shopping-cart-badge"]');
    }

    async open(): Promise<void> {
        await this.goto(CartPage.PATH);
        await this.assertLoaded();
    }

    async assertLoaded(): Promise<void> {
        await expect(this.page).toHaveURL(/cart/);
        await expect(this.title).toHaveText('Your Cart');
    }

    async continueShopping(): Promise<void> {
        await this.el.click(this.continueShoppingBtn);
        await this.page.waitForLoadState('domcontentloaded');
    }

    async checkout(): Promise<void> {
        await this.el.click(this.checkoutBtn);
        await this.page.waitForLoadState('domcontentloaded');
    }

    async removeItem(id: string): Promise<void> {
        await this.el.click(this.page.locator(`[data-test="remove-${id}"]`));
    }

    async itemCount(): Promise<number> {
        return this.cartItems.count();
    }

    async cartBadgeCount(): Promise<string> {
        return this.el.getText(this.cartBadge);
    }

    async itemNames_(): Promise<string[]> {
        return this.el.getAllTexts(this.itemNames);
    }

    async itemPrices_(): Promise<string[]> {
        return this.el.getAllTexts(this.itemPrices);
    }

    async itemQuantities_(): Promise<string[]> {
        return this.el.getAllTexts(this.itemQuantities);
    }
}
