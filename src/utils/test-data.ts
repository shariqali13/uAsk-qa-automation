import fs from 'fs';
import path from 'path';

export interface QueryExpect {
  minLength?: number;
  maxLength?: number;
  mustMentionAny?: string[];
  mustNotMentionAny?: string[];
  topics?: string[];
}

export interface PublicServiceQuery {
  id: string;
  lang: 'en' | 'ar';
  prompt: string;
  expect: QueryExpect;
}

export interface ConsistencyPair {
  id: string;
  en: string;
  ar: string;
  sharedTopics: string[];
}

export interface SecurityCase {
  id: string;
  input: string;
  expectDomSafe?: boolean;
  expectRefusalOrOnTopic?: boolean;
  mustNotContain?: string[];
}

export interface FallbackTrigger {
  id: string;
  input: string;
  mayShowFallback?: boolean;
  fallbackPatterns?: string[];
}

export interface TestData {
  publicServiceQueries: PublicServiceQuery[];
  consistencyPairs: ConsistencyPair[];
  security: SecurityCase[];
  fallbackTriggers: FallbackTrigger[];
}

let cached: TestData | null = null;

export function loadTestData(): TestData {
  if (cached) return cached;
  const filePath = path.join(__dirname, '../../test-data/test-data.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  cached = JSON.parse(raw) as TestData;
  return cached;
}

export function queriesForLang(lang: 'en' | 'ar'): PublicServiceQuery[] {
  return loadTestData().publicServiceQueries.filter((q) => q.lang === lang);
}
