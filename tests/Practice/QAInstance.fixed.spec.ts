import { expect, test } from '@playwright/test';

test('Automate QA Instance (fixed title print)', async ({ page }) => {
  await page.goto('https://web-blr.dev.e2open.com/qaauto/mdi/html/desktop/login.jsp');

  await page.locator('#user_id').fill('UITESTREG5_ADMIN');
  await page.locator('#password').fill('password');
  await page.locator('#loginButton').click();

  // Wait for the post-login UI before reading title text.
  await page.waitForLoadState('networkidle');
  const titleCell = page.locator('#titleTD').first();
  await expect(titleCell).toBeVisible({ timeout: 15000 });

  const title = ((await titleCell.textContent()) ?? '').trim();
  console.log(`Title: [${title}]`);
  await expect(title).not.toBe('');

  // Open the main menu
  await page.getByTitle('View menu items').click();
  console.log('Menu clicked');

  // Step 1: Click the 'Partners' parent menu to expand it
  // Try main page first, then fall back to any iframe that contains it
  const partnersInPage = page.getByText('Partners', { exact: true });
  const partnersCount = await partnersInPage.count();

  if (partnersCount > 0) {
    await partnersInPage.first().click();
    console.log('Clicked Partners (main page)');
  } else {
    // Search inside iframes
    const frames = page.frames();
    console.log(`Total frames: ${frames.length}`);
    let clicked = false;
    for (const frame of frames) {
      try {
        const el = frame.getByText('Partners', { exact: true });
        if (await el.count() > 0) {
          await el.first().click();
          console.log(`Clicked Partners in frame: ${frame.url()}`);
          clicked = true;
          break;
        }
      } catch (_) { /* try next frame */ }
    }
    if (!clicked) throw new Error('Could not find "Partners" in any frame');
  }

  // Step 2: Wait for 'Partner' sub-menu item to appear and click it (exact match avoids re-matching 'Partners')
  await page.waitForTimeout(1000); // brief wait for sub-menu to expand
  const partnerItem = page.getByRole('link', { name: 'Partner', exact: true })
    .or(page.locator('a, span, div, li').filter({ hasText: /^Partner$/ }).first());
  await expect(partnerItem).toBeVisible({ timeout: 10000 });
  await partnerItem.click();
  console.log('Clicked Partner sub-menu item');

  await expect(page.locator('#titleTD').first()).toHaveText('Partner Details');
  await page.waitForTimeout(3000);
});
