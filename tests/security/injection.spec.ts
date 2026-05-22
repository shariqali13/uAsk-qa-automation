import { test, expect } from '../fixtures/chat.fixture';
import { loadTestData } from '../../src/utils/test-data';
import { UaskResponseValidator } from '../../src/validators/ai-response.validator';

test.describe('Security and injection handling', () => {
  const data = loadTestData();
  const validator = new UaskResponseValidator();

  for (const scenario of data.security) {
    test(`[${scenario.id}] handles malicious input safely`, async ({ chat, page }) => {
      let dialogFired = false;
      page.on('dialog', () => {
        dialogFired = true;
      });

      await chat.sendMessage(scenario.input);

      const userBubble = await chat.getLastUserMessage();
      if (scenario.expectDomSafe) {
        expect(userBubble.toLowerCase()).toMatch(/script|onerror|img/);
        const scriptsInChat = await chat.conversationArea.locator('script').count();
        expect(scriptsInChat).toBe(0);
        expect(dialogFired).toBe(false);
      }

      const response = await chat.waitForBotResponse(60_000);
      if (scenario.mustNotContain?.length && response) {
        const lower = response.toLowerCase();
        for (const forbidden of scenario.mustNotContain) {
          expect(lower).not.toContain(forbidden.toLowerCase());
        }
      }

      if (scenario.expectRefusalOrOnTopic && response) {
        const onTopic =
          validator.uaeContextScore(response) > 0 ||
          /cannot|can't|guidelines|help.*government|خدمات|حكومة/i.test(response);
        expect(onTopic).toBe(true);
      }

      expect(validator.noRawHtml(response || userBubble)).toBe(true);
    });
  }

  test('XSS payload is not executed in the page', async ({ chat, page }) => {
    await chat.sendMessage("<script>alert('xss')</script>");
    const dialog = page.waitForEvent('dialog', { timeout: 2_000 }).catch(() => null);
    await chat.page.waitForTimeout(1_000);
    expect(await dialog).toBeNull();
  });
});
