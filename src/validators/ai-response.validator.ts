import { QueryExpect } from '../utils/test-data';

export interface ValidationResult {
  passed: boolean;
  errors: string[];
}

const UAE_KEYWORDS = [
  'uae',
  'emirates',
  'emirate',
  'government',
  'ministry',
  'federal',
  'icp',
  'portal',
  'خدمات',
  'حكومة',
  'إمارات',
  'الهيئة',
];

const FABRICATED_URL = /https?:\/\/(?!.*\.(gov\.ae|u\.ae|ask\.u\.ae))/i;
const PHONE_PATTERN = /\+?\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4,}/;

export class AiResponseValidator {
  validate(response: string, expect: QueryExpect, userPrompt?: string): ValidationResult {
    const errors: string[] = [];
    const text = response.trim();

    if (!text) {
      errors.push('Response is empty');
      return { passed: false, errors };
    }

    if (expect.minLength && text.length < expect.minLength) {
      errors.push(`Response length ${text.length} is below minLength ${expect.minLength}`);
    }

    if (expect.maxLength && text.length > expect.maxLength) {
      errors.push(`Response length ${text.length} exceeds maxLength ${expect.maxLength}`);
    }

    if (expect.mustMentionAny?.length) {
      const lower = text.toLowerCase();
      const found = expect.mustMentionAny.some((k) => lower.includes(k.toLowerCase()));
      if (!found) {
        errors.push(`Response must mention one of: ${expect.mustMentionAny.join(', ')}`);
      }
    }

    if (expect.mustNotMentionAny?.length) {
      const lower = text.toLowerCase();
      for (const bad of expect.mustNotMentionAny) {
        if (lower.includes(bad.toLowerCase())) {
          errors.push(`Response must not mention: ${bad}`);
        }
      }
    }

    if (!this.noRawHtml(text)) {
      errors.push('Response contains unsafe or broken HTML');
    }

    if (!this.completeThought(text)) {
      errors.push('Response appears incomplete (missing terminal punctuation)');
    }

    if (!this.noFabricatedContact(text)) {
      errors.push('Response may contain unverified contact details');
    }

    if (expect.topics?.length) {
      const lower = text.toLowerCase();
      const topicHit = expect.topics.some((t) => lower.includes(t.toLowerCase()));
      if (!topicHit && userPrompt) {
        const promptLower = userPrompt.toLowerCase();
        const promptTopic = expect.topics.some((t) => promptLower.includes(t.toLowerCase()));
        if (promptTopic) {
          errors.push(`Response missing expected topics: ${expect.topics.join(', ')}`);
        }
      }
    }

    return { passed: errors.length === 0, errors };
  }

  validateConsistency(enResponse: string, arResponse: string, sharedTopics: string[]): ValidationResult {
    const errors: string[] = [];
    if (!enResponse.trim() || !arResponse.trim()) {
      errors.push('One or both bilingual responses are empty');
      return { passed: false, errors };
    }

    const enLower = enResponse.toLowerCase();
    const arLower = arResponse.toLowerCase();
    const enHits = sharedTopics.filter((t) => enLower.includes(t.toLowerCase())).length;
    const arHits = sharedTopics.filter((t) => arLower.includes(t.toLowerCase())).length;

    if (enHits === 0) {
      errors.push(`English response missing shared topics: ${sharedTopics.join(', ')}`);
    }
    if (arHits === 0) {
      errors.push(`Arabic response missing shared topics (Latin transliterations may apply): ${sharedTopics.join(', ')}`);
    }

    const enUae = UAE_KEYWORDS.some((k) => enLower.includes(k));
    const arUae =
      UAE_KEYWORDS.some((k) => arLower.includes(k)) ||
      /إمارات|الإمارات|حكومة|هيئة|وزارة|خدمات/i.test(arResponse);
    if (!enUae) errors.push('English response lacks UAE government context');
    if (!arUae) errors.push('Arabic response lacks UAE government context');

    return { passed: errors.length === 0, errors };
  }

  noRawHtml(text: string): boolean {
    if (/<script\b/i.test(text)) return false;
    if (/<iframe\b/i.test(text)) return false;
    if (/<\/?[a-z][^>]*>/i.test(text) && !text.includes('&lt;')) return false;
    return true;
  }

  completeThought(text: string): boolean {
    const trimmed = text.trim();
    if (trimmed.length < 40) return true;
    return /[.!?؟。]$/.test(trimmed) || trimmed.endsWith('…');
  }

  noFabricatedContact(text: string): boolean {
    if (FABRICATED_URL.test(text)) return false;
    if (PHONE_PATTERN.test(text) && !/icp|800|901|171|6005/i.test(text)) return false;
    return true;
  }

  uaeContextScore(text: string): number {
    const lower = text.toLowerCase();
    return UAE_KEYWORDS.filter((k) => lower.includes(k)).length;
  }
}
