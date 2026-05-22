import { test, expect } from '../fixtures/chat.fixture';
import { UaskResponseValidator } from '../../src/validators/ai-response.validator';
import { isUaskOpenAiReviewEnabled, UaskOpenAiReview } from '../../src/validators/uask-openai-review';
import { loadTestData, queriesForLang } from '../../src/utils/test-data';
import { resolveLang, useMock } from '../../src/utils/locales';

test.describe('U-Ask response validation', () => {
  test.slow();
  const validator = new UaskResponseValidator();
  const lang = resolveLang();
  const queries = queriesForLang(lang).slice(0, useMock() ? undefined : 3);

  for (const scenario of queries) {
    test(`[${scenario.id}] returns a clear, helpful answer for public-service queries`, async ({ chat }) => {
      await chat.sendMessage(scenario.prompt);
      const response = await chat.waitForBotResponse();
      expect(response.length).toBeGreaterThan(0);

      const result = validator.validate(response, scenario.expect, scenario.prompt);
      expect(result.errors, result.errors.join('; ')).toHaveLength(0);

      expect(validator.noRawHtml(response)).toBe(true);
      expect(validator.completeThought(response)).toBe(true);
      expect(validator.uaeContextScore(response)).toBeGreaterThan(0);

      if (isUaskOpenAiReviewEnabled()) {
        const reviewer = new UaskOpenAiReview();
        const verdict = await reviewer.evaluate(scenario.prompt, response, scenario.expect);
        expect(verdict.score).toBeGreaterThanOrEqual(3);
        expect(verdict.hallucination).toBe(false);
        expect(verdict.onTopic).toBe(true);
      }
    });
  }

  test('Responses do not include generic AI-disclaimer phrases', async ({ chat }) => {
    const data = loadTestData();
    const q = data.publicServiceQueries.find((x) => x.lang === lang) ?? data.publicServiceQueries[0];
    await chat.sendMessage(q.prompt);
    const response = await chat.waitForBotResponse();
    const lower = response.toLowerCase();
    expect(lower).not.toContain('as an ai language model');
    expect(lower).not.toMatch(/i don't have access to real-time/i);
  });
});
