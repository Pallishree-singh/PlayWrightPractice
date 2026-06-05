import{test,expect,FrameLocator,Locator} from '@playwright/test';

test('flipcartexercise',async({page})=>
{

    await page.goto('https://www.flipkart.com/search');

    //let closebutton=page.locator("//span[@class='b3wTlE' and text()='✕']");
   //await closebutton.click(); 

   let searchbox=page.getByTitle('Search for Products, Brands and More');
   await searchbox.fill('macmini');

   const svgElements:Locator=page.locator('svg');
   await svgElements.first().click();

   let price=page.getByText('Price -- Low to High');
   await price.click();

   await page.waitForTimeout(5000);
   const cheapestprod :string | null=await page.locator('//div[contains(@data-id,"CPU")]/div/a[contains(@title,"Apple Mac Mini (MXNF2HN/A)")]').textContent();
   console.log(cheapestprod);
   const cheapestprodPrice: string |null = await page.getByText('₹72,990').textContent();
    console.log(cheapestprodPrice);

    console.log("Product Name:" +cheapestprod)
    console.log("Product Price:" +cheapestprodPrice );

})
