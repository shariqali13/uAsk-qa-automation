export type Lang = 'en' | 'ar';

export function getLangPath(lang: Lang): string {
  const enPath = process.env.EN_PATH ?? '/en/ta';
  const arPath = process.env.AR_PATH ?? '/ar/ta';
  return lang === 'ar' ? arPath : enPath;
}

export function getAcceptButtonName(lang: Lang): RegExp {
  return lang === 'ar' ? /قبول ومتابعة|accept/i : /accept and continue/i;
}

export function getInputLabel(lang: Lang): RegExp {
  return lang === 'ar' ? /اطرح سؤالك/i : /ask me a question/i;
}

export function resolveLang(): Lang {
  return process.env.TEST_LANG === 'ar' ? 'ar' : 'en';
}

export function useMock(): boolean {
  return process.env.USE_MOCK === 'true' || process.env.USE_MOCK === '1';
}

export function getBaseUrl(): string {
  if (useMock()) {
    return process.env.MOCK_BASE_URL ?? 'http://127.0.0.1:4173';
  }
  return process.env.BASE_URL ?? 'https://beta-ask.u.ae';
}
