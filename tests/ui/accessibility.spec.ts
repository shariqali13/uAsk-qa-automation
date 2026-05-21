import { test, expect } from '../fixtures/chat.fixture';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('chat panel has no critical axe violations', async ({ page, chat }) => {
    await chat.openWidget();
    const results = await new AxeBuilder({ page })
      .include('.chatContainer, .full-body, #conversation')
      .analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical).toEqual([]);
  });

  test('message input has accessible name', async ({ chat }) => {
    const label = await chat.messageInput.getAttribute('aria-label');
    const placeholder = await chat.messageInput.getAttribute('placeholder');
    expect(label || placeholder).toBeTruthy();
  });

  test('send control is keyboard reachable', async ({ chat, page }) => {
    await chat.messageInput.fill('Accessibility test message');
    await chat.messageInput.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    expect(focused).toBeTruthy();
  });
});
