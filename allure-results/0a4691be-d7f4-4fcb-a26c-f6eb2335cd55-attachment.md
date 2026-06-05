# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Practice\6thMay.spec.ts >> fill the form
- Location: tests\Practice\6thMay.spec.ts:3:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#first-name')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - button "Dismiss banner" [ref=e4] [cursor=pointer]:
      - img [ref=e5]
    - generic [ref=e8]:
      - generic [ref=e9]: LIVE
      - generic [ref=e11]: 🎭 Playwright + AI Blueprint
      - generic [ref=e12]: New Batch Launching
      - generic [ref=e13]: "|"
      - generic [ref=e14]: New Batch • 29 Apr 2026, 7 AM IST
      - generic [ref=e15]: "|"
      - generic [ref=e16]:
        - generic [ref=e17]: ₹35,000
        - generic [ref=e18]: ₹9,999
        - generic [ref=e19]: 33% OFF
      - generic [ref=e20]:
        - img [ref=e21]
        - text: "Code:"
        - generic [ref=e23]: PLAYWRIGHT
      - generic [ref=e24]:
        - button "Join" [ref=e25] [cursor=pointer]:
          - img [ref=e26]
          - text: Join
        - link "Chat on WhatsApp" [ref=e31] [cursor=pointer]:
          - /url: https://sdet.live/WhatsApp
          - img [ref=e32]
        - generic [ref=e34]:
          - button "View announcement 1" [ref=e35] [cursor=pointer]
          - button "View announcement 2" [ref=e36] [cursor=pointer]
  - generic [ref=e38]:
    - heading "404" [level=1] [ref=e39]
    - paragraph [ref=e40]: Oops! Page not found
    - link "Return to Home" [ref=e41] [cursor=pointer]:
      - /url: /
  - button "Chat with support on WhatsApp" [ref=e42] [cursor=pointer]:
    - img
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test';
  2  | 
  3  | test('fill the form', async({page})=>
  4  | {
  5  |   await page.goto('https://app.thetestingacademy.com/playwright/tables/practice-form');
  6  |   let fname=page.locator('#first-name');
> 7  |   await fname.fill("Pallishree");
     |               ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  8  | 
  9  |   let lname=page.locator('#last-name');
  10 |   await lname.fill("singh");
  11 | 
  12 |   let Gender=page.getByRole('radio', { name:'female'});
  13 |   await Gender.check();
  14 | 
  15 |   let exp=page.locator('#years-experience');
  16 |   await exp.selectOption('7');
  17 |  
  18 |   let date=page.locator('#profile-date');
  19 |   await date.fill('06/06/2026');
  20 | 
  21 |   let profession=page.getByRole('radio',{name:'Automation Tester'});
  22 |   await profession.check();
  23 | 
  24 |   let tool=page.getByRole('checkbox',{name:'Selenium Webdriver'});
  25 |   await tool.check();
  26 | 
  27 |   let selcommand=page.locator('#selenium-tabs · selenium-tab-panel');
  28 |   await selcommand.click();
  29 | 
  30 |   let savebutton=page.locator('#profile-submit · profile-button');
  31 |   await savebutton.click();
  32 | 
  33 | });
```