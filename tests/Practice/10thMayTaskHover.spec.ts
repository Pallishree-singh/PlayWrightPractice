import {test,expect,FrameLocator,Locator} from '@playwright/test';

test('Hover exercise', async({page})=>
{
 await page.goto('https://app.thetestingacademy.com/playwright/widgets/hover-menu');

const Addon = page.getByTestId('nav-add-ons');
 Addon.hover(); 

 let wifiOption=page.getByTestId('test-id-Wifi'); 
 //await wifiOption.waitFor({ state: 'visible' });
 await wifiOption.click();
  console.log(" clicked on the wifi option");
});