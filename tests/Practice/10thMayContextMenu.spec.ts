import{test,expect,FrameLocator,Locator} from '@playwright/test';

test('context menu exercise',async({page})=>
{
  await page.goto('https://app.thetestingacademy.com/playwright/widgets/context-menu');

  let RightClickBon=page.getByTestId('ctx-target');
  await RightClickBon.click({button:'right'});
  const options1:String[]=await page.locator('#ctx-menu').allInnerTexts();
  console.log(options1); 

  let SecondTrget=page.getByTestId('ctx-target-2');
  await SecondTrget.click({button:'right'});
  const option2:String[]=await page.getByTestId('ctx-menu').allInnerTexts();
  console.log(option2);

  let ThirdTarget=page.getByTestId('ctx-target-3');
  await ThirdTarget.click({button:'right'});
  const option3:String[]=await page.getByTestId('ctx-menu').allInnerTexts();
  console.log(option3);



})