# U-Ask Framework Overview

This document summarizes the test automation framework for the U-Ask chatbot, focusing on reliability, language coverage, and domain-specific AI validation.

## Project purpose

The repository is built for automated quality assurance of the U-Ask chatbot experience, including:
- UI validation for both desktop and mobile viewport flows.
- AI response quality checks against UAE government service expectations.
- Multilingual coverage for English and Arabic content.
- Security validation for prompt injection and XSS handling.
- Accessibility checks using integrated axe-core rules.

## Architecture

The framework uses Playwright with a page object model:
- `src/pages/chat.page.ts` encapsulates navigation and chatbot interactions.
- `tests/fixtures/chat.fixture.ts` initializes the chat context for each spec.
- `tests/ui/`, `tests/ai/`, and `tests/security/` group coverage by domain.
- `mock-uask/index.html` provides a local mock chatbot that mimics U-Ask behavior and avoids live reCAPTCHA barriers.

## Test data strategy

Test data is stored centrally in `test-data/test-data.json` so scenarios are:
- easy to extend,
- reusable across English and Arabic,
- explicitly linked to expectations such as keywords, lengths, and safety rules.

The dataset includes:
- public-service prompts,
- bilingual consistency pairs,
- injection attack cases,
- fallback trigger examples.

## AI response validation

Response quality is validated with a mix of heuristics and optional OpenAI evaluation:
- `src/validators/ai-response.validator.ts` enforces expected topics, length, punctuation, and safe response structure.
- `src/validators/uask-openai-review.ts` can optionally call OpenAI as a secondary judge, with strict parsing and failure handling.

## Mock vs live execution

The framework supports two execution modes:
- `USE_MOCK=true` uses the local `mock-uask` simulator for stable CI and AI behavior tests.
- `USE_MOCK=false` targets the live `BASE_URL` for smoke testing.

Mock mode is recommended for reproducible automated validation and for tests that depend on predictable AI replies.

## Reporting

Test results are produced in Playwright HTML format and JSON.
- `npm run report` opens the HTML report.
- `npm run report:summary` writes a markdown summary to `test-results/SUMMARY.md`.

## Extensibility

To add new coverage:
1. Add a new scenario entry to `test-data/test-data.json`.
2. Extend the validator with a new expectation type if needed.
3. Add a new spec under the existing suite groups.

To generate a PDF overview:
1. Create or update `docs/UASK_FRAMEWORK_OVERVIEW.md`.
2. Run `node scripts/generate-framework-pdf.mjs`.
