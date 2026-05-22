import { test, expect } from '@playwright/test';
import { ChatPage } from '../../src/pages/chat.page';
import { UaskResponseValidator } from '../../src/validators/ai-response.validator';
import { loadTestData } from '../../src/utils/test-data';
import { useMock } from '../../src/utils/locales';

test.describe('Bilingual consistency', () => {
  test.slow();
  const validator = new UaskResponseValidator();
  const pairs = loadTestData().consistencyPairs;

  for (const pair of pairs) {
    test(`[${pair.id}] English and Arabic responses convey the same intent`, async ({ page }) => {
      test.skip(!useMock(), 'Consistency tests require USE_MOCK=true (live AI blocked by reCAPTCHA)');

      const chatEn = new ChatPage(page, 'en');
      await chatEn.goto('en');
      await chatEn.sendMessage(pair.en);
      const enResponse = await chatEn.waitForBotResponse();
      expect(enResponse.length).toBeGreaterThan(40);

      const chatAr = new ChatPage(page, 'ar');
      await chatAr.goto('ar');
      await chatAr.sendMessage(pair.ar);
      const arResponse = await chatAr.waitForBotResponse();
      expect(arResponse.length).toBeGreaterThan(20);

      const result = validator.validateConsistency(enResponse, arResponse, pair.sharedTopics);
      expect(result.errors, result.errors.join('; ')).toHaveLength(0);
    });
  }
});
