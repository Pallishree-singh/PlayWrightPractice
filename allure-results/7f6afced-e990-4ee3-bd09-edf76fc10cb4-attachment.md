# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2etest\e2e-CheckOut.spec.ts >> @P0 @Regression E2E @Checkout Checkout Feature >> should complete checkout successfully
- Location: src\tests\e2etest\e2e-CheckOut.spec.ts:30:9

# Error details

```
TimeoutError: locator.fill: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('[data-test="username"]')

```

# Page snapshot

```yaml
- generic [ref=e2]: Not Found
```

# Test source

```ts
  1   | // Whatever the common utilities are there, it will be present in the util element locator. 
  2   | 
  3   | /**
  4   |  * This is UtilElementLocators - Contains all the util we can reuse directly
  5   |  * 
  6   |  **/
  7   | 
  8   | import { expect, Locator, Page } from '@playwright/test';
  9   | import { createLogger, type Logger } from '@utils/Logger';
  10  | 
  11  | export const DEFAULT_ACTION_TIMEOUT_MS = 15_000;
  12  | 
  13  | /**
  14  |  * Flex - a selector can be a CSS string or an already-built Locator.
  15  |  *
  16  |  * The TTACart suite uses `data-test` attributes everywhere, so most call sites
  17  |  * pass either:
  18  |  *   - `'[data-test="username"]'`  (a CSS string), or
  19  |  *   - `page.getByTestId('username')` (a Locator object).
  20  |  */
  21  | 
  22  | export type Flex = string | Locator;
  23  | 
  24  | export class UtilElementLocator {
  25  |     private readonly page: Page;
  26  |     private readonly log: Logger;
  27  | 
  28  |     constructor(page: Page, scope: string = 'UtilElementLocator') {
  29  |         this.page = page;
  30  |         this.log = createLogger(scope);
  31  |     }
  32  | 
  33  | 
  34  |     private toLocator(target: Flex): Locator {
  35  |         return typeof target === 'string' ? this.page.locator(target) : target;
  36  |     }
  37  | 
  38  |     /** Human-readable label for a target, used only in log lines. */
  39  |     private describe(target: Flex): string {
  40  |         return typeof target === 'string' ? target : target.toString();
  41  |     }
  42  | 
  43  |     // ---------- mouse actions ----------
  44  | 
  45  |     async click(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
  46  |         const loc = this.toLocator(target); // Checking if it is a normal locator or a Playwright locator.
  47  |         this.log.debug(`click ${this.describe(target)}`);
  48  |         await loc.click({ timeout });
  49  |     }
  50  |     async doubleClick(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
  51  |         const loc = this.toLocator(target);
  52  |         await loc.dblclick({ timeout });
  53  |     }
  54  |     async rightClick(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
  55  |         const loc = this.toLocator(target);
  56  |         await loc.click({ button: 'right', timeout });
  57  |     }
  58  |     async hover(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
  59  |         const loc = this.toLocator(target);
  60  |         await loc.hover({ timeout });
  61  |     }
  62  | 
  63  |     // ---------- input actions ----------
  64  | 
  65  |     async fill(target: Flex, value: string, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
  66  |         const loc = this.toLocator(target);
  67  |         this.log.debug(`fill ${this.describe(target)}`);
> 68  |         await loc.fill(value, { timeout });
      |                   ^ TimeoutError: locator.fill: Timeout 15000ms exceeded.
  69  |     }
  70  |     async type(target: Flex, value: string, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
  71  |         // Note: Playwright deprecated .type() in favour of .pressSequentially().
  72  |         // We keep the public method name so the API still reads naturally for
  73  |         // students used to the older verb.
  74  |         const loc = this.toLocator(target);
  75  |         await loc.pressSequentially(value, { timeout });
  76  |     }
  77  |     async clear(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
  78  |         const loc = this.toLocator(target);
  79  |         await loc.clear({ timeout });
  80  |     }
  81  |     async pressSequentially(
  82  |         target: Flex,
  83  |         value: string,
  84  |         timeout: number = DEFAULT_ACTION_TIMEOUT_MS,
  85  |     ): Promise<void> {
  86  |         const loc = this.toLocator(target);
  87  |         await loc.pressSequentially(value, { timeout });
  88  |     }
  89  | 
  90  |     // ---------- text & content getters ----------
  91  | 
  92  |     async getText(target: Flex): Promise<string> {
  93  |         const loc = this.toLocator(target);
  94  |         const txt = (await loc.textContent()) ?? '';
  95  |         return txt.trim();
  96  |     }
  97  | 
  98  |     async getInnerText(target: Flex): Promise<string> {
  99  |         const loc = this.toLocator(target);
  100 |         return (await loc.innerText()).trim();
  101 |     }
  102 |     async getAllTexts(target: Flex): Promise<string[]> {
  103 |         const loc = this.toLocator(target);
  104 |         const texts = await loc.allTextContents();
  105 |         return texts.map((t) => t.trim());
  106 |     }
  107 | 
  108 |     async getAttr(target: Flex, name: string): Promise<string | null> {
  109 |         const loc = this.toLocator(target);
  110 |         return loc.getAttribute(name);
  111 |     }
  112 | 
  113 |     async getValue(target: Flex): Promise<string> {
  114 |         const loc = this.toLocator(target);
  115 |         return loc.inputValue();
  116 |     }
  117 | 
  118 |     // ---------- count ----------
  119 | 
  120 |     async count(target: Flex): Promise<number> {
  121 |         const loc = this.toLocator(target);
  122 |         return loc.count();
  123 |     }
  124 | 
  125 |     // ---------- state checks ----------
  126 | 
  127 |     async isVisible(target: Flex): Promise<boolean> {
  128 |         const loc = this.toLocator(target);
  129 |         return loc.isVisible();
  130 |     }
  131 | 
  132 |     async isEnabled(target: Flex): Promise<boolean> {
  133 |         const loc = this.toLocator(target);
  134 |         return loc.isEnabled();
  135 |     }
  136 | 
  137 |     async isChecked(target: Flex): Promise<boolean> {
  138 |         const loc = this.toLocator(target);
  139 |         return loc.isChecked();
  140 |     }
  141 | 
  142 |     // ---------- waits ----------
  143 | 
  144 |     async waitForVisible(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
  145 |         const loc = this.toLocator(target);
  146 |         await expect(loc).toBeVisible({ timeout });
  147 |     }
  148 | 
  149 |     async waitForHidden(target: Flex, timeout: number = DEFAULT_ACTION_TIMEOUT_MS): Promise<void> {
  150 |         const loc = this.toLocator(target);
  151 |         await expect(loc).toBeHidden({ timeout });
  152 |     }
  153 | 
  154 |     async waitForPageLoad(): Promise<void> {
  155 |         this.log.debug('waitForPageLoad');
  156 |         await this.page.waitForLoadState('domcontentloaded');
  157 |         await this.page.waitForLoadState('networkidle').catch(() => {
  158 |             // TTACart is static + localStorage so networkidle is fast,
  159 |             // but we swallow the rare timeout so the test isn't punished
  160 |             // by background analytics calls on the demo origin.
  161 |         });
  162 |     }
  163 | 
  164 |     // ---------- selects ----------
  165 | 
  166 |     async selectByText(target: Flex, text: string): Promise<void> {
  167 |         const loc = this.toLocator(target);
  168 |         await loc.selectOption({ label: text });
```