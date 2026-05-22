import { test, expect } from '../fixtures/chat.fixture';
import { loadTestData } from '../../src/utils/test-data';
import { useMock } from '../../src/utils/locales';

test.describe('Loading and fallback states', () => {
  test.slow();

  test('Shows loading indicator while awaiting AI response', async ({ chat }) => {
    test.skip(!useMock(), 'Loading timing assertions use mock simulator');

    const responsePromise = chat.sendMessage('How do I apply for a UAE residence visa?');
    const sawLoading = await Promise.race([
      chat.page.waitForSelector('.loading-indicator.visible, [data-role="loading"].visible', {
        timeout: 3_000,
      }).then(() => true),
      responsePromise.then(() => false),
    ]);
    await responsePromise;
    expect(sawLoading).toBe(true);
  });

  test('Displays fallback message for unsupported/gibberish input', async ({ chat }) => {
    test.skip(!useMock(), 'Fallback trigger validated on mock (live API may differ)');

    const trigger = loadTestData().fallbackTriggers[0];
    await chat.sendMessage(trigger.input);
    await chat.page.waitForTimeout(1_500);

    const fallback = await chat.getFallbackMessage();
    const body = await chat.page.locator('body').innerText();
    const matched = trigger.fallbackPatterns?.some((p) => {
      const re = new RegExp(p, 'i');
      return re.test(fallback) || re.test(body);
    });
    expect(matched).toBe(true);
  });

  test('Valid queries return normal bot responses, not fallback', async ({ chat }) => {
    await chat.sendMessage('How do I renew my Emirates ID?');
    const response = await chat.waitForBotResponse();
    expect(response.length).toBeGreaterThan(30);
    expect(response.toLowerCase()).not.toMatch(/^sorry, please try again$/i);
  });
});
