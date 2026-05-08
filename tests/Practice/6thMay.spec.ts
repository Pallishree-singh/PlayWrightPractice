import {test,expect} from '@playwright/test';

test('fill the form', async({page})=>
{
  await page.goto('https://app.thetestingacademy.com/playwright/tables/practice-form');
  let fname=page.locator('#first-name');
  await fname.fill("Pallishree");

  let lname=page.locator('#last-name');
  await lname.fill("singh");

  let Gender=page.getByRole('radio', { name:'female'});
  await Gender.check();

  let exp=page.locator('#years-experience');
  await exp.selectOption('7');
 
  let date=page.locator('#profile-date');
  await date.fill('06/06/2026');

  let profession=page.getByRole('radio',{name:'Automation Tester'});
  await profession.check();

  let tool=page.getByRole('checkbox',{name:'Selenium Webdriver'});
  await tool.check();

  let selcommand=page.locator('#selenium-tabs · selenium-tab-panel');
  await selcommand.click();

  let savebutton=page.locator('#profile-submit · profile-button');
  await savebutton.click();

});