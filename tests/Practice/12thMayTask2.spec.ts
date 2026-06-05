import{test,expect,FrameLocator,Locator} from '@playwright/test';

test('India map exercise',async({page})=>
{

    await page.goto('https://simplemaps.com/svg/country/in');

    const stateClassnname=await page.locator('//div[@id="admin1"]//*[name()="text" and contains(@class,"sm_label")]').allTextContents();
   
    console.log(stateClassnname);

    for(const state of stateClassnname)
    {
        if(state.trim()==='Odisha')
        {
            await page.locator('//*[name()="path" and contains(@class,"INOR")]').click();
            console.log("Clicked on Odisha");

        }
    }

})