import {type Locator,type Page} from '@playwright/test';

export class LoginPage
{
    readonly page: Page;
    readonly textboxUsername: Locator;
    readonly textboxPassword: Locator;
    readonly buttonLogin: Locator;

    constructor(page: Page)
    {
        this.page=page;
        this.textboxUsername=page.locator('#user-name');
        this.textboxPassword=page.locator('#password');
        this.buttonLogin=page.locator('#login-button');
    }

    async goto()
    {
        await this.page.goto('https://app.thetestingacademy.com/playwright/ttacart/');
    }

    async login(username:string,password:string)
    {
        await this.textboxUsername.fill(username);
        await this.textboxPassword.fill(password);
        await this.buttonLogin.click();
    }
}

