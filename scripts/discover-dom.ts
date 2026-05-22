/**
 * One-off DOM discovery for ask.u.ae — run: npx ts-node scripts/discover-dom.ts
 */
import { chromium } from '@playwright/test';

async function discover(url: string, label: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log(`\n=== ${label}: ${url} ===`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const htmlDir = await page.locator('html').getAttribute('dir');
    const bodyDir = await page.locator('body').getAttribute('dir');
    console.log('html dir:', htmlDir, 'body dir:', bodyDir);

    const iframes = await page.locator('iframe').count();
    console.log('iframe count:', iframes);

    const inputs = await page.locator('textarea, input[type="text"], [contenteditable="true"]').all();
    for (let i = 0; i < inputs.length; i++) {
      const el = inputs[i];
      const tag = await el.evaluate((n) => n.tagName);
      const ph = await el.getAttribute('placeholder');
      const aria = await el.getAttribute('aria-label');
      const visible = await el.isVisible().catch(() => false);
      console.log(`  input[${i}] ${tag} placeholder="${ph}" aria="${aria}" visible=${visible}`);
    }

    const buttons = await page.getByRole('button').all();
    console.log('buttons (first 15):');
    for (let i = 0; i < Math.min(buttons.length, 15); i++) {
      const b = buttons[i];
      const name = await b.getAttribute('aria-label').catch(() => null);
      const text = (await b.innerText().catch(() => '')).slice(0, 60);
      const visible = await b.isVisible().catch(() => false);
      if (visible) console.log(`  [${i}] "${text}" aria="${name}"`);
    }

    const chatLike = await page.locator('[class*="chat" i], [id*="chat" i], [class*="uask" i], [id*="uask" i]').count();
    console.log('chat/uask class elements:', chatLike);

    await page.screenshot({ path: `test-results/discover-${label}.png`, fullPage: true }).catch(() => {});
  } catch (e) {
    console.error('Error:', e);
  }
  await browser.close();
}

async function main() {
  const base = process.env.BASE_URL ?? 'https://ask.u.ae';
  const enPath = process.env.EN_PATH ?? '/en/ta';
  const arPath = process.env.AR_PATH ?? '/ar/ta';
  await discover(`${base}${enPath}`, 'en');
  await discover(`${base}${arPath}`, 'ar');
}

main();
