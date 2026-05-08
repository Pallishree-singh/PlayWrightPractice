import {test,expect} from '@playwright/test';
//import { allure } from 'allure-playwright';
import * as allure from "allure-js-commons";

test('validate tta bank details', async({page}) =>
{
    await allure.epic("TTA Bank");
    await allure.description("This test case is to validate the tta bank details");
   


   let signup=page.getByRole('button', { name: 'Sign Up' });
   await signup.click();

   let username=page.locator('input[type="text"]');
   let emailid=page.locator('input[type="email"]');
   let pass=page.locator('input[type="password"]');
   let createAC=page.locator('button[type="submit"]');

   await username.fill("Pallishree");
   await emailid.fill("pallishree@gmail.com");
   await pass.fill("password@123");
   await createAC.click();

   let amount=page.locator('input[type="number"]');
   await amount.fill("1");
   let continuebutton=page.getByRole('button', { name: 'Continue' });
    await continuebutton.click();

    let confirmbutton=page.getByRole('button', { name: 'Confirm' });
    await confirmbutton.click();

    let dashboard=page.getByRole('button', { name: 'Dashboard' });
    await dashboard.click();

    let totalbal=page.locator('h3:has-text("49,998.00")');
    await expect(totalbal).toBeVisible();



   



})