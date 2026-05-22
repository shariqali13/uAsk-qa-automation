# U-Ask Conversational QA Automation

End-to-end automated tests for the UAE Government **U-Ask** chatbot: UI behavior, response validation, multilingual RTL/LTR support, security checks, and accessibility.

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
cd /Users/mohdshariq/Documents/uAsk
npm run setup
cp .env.example .env
```

## Target environments

| Mode | URL | When to use |
|------|-----|-------------|
| **Mock** (default) | `http://127.0.0.1:4173` | Reliable CI and response validation (no reCAPTCHA) |
| **Live beta** | `https://beta-ask.u.ae/en/ta` | Real widget DOM and UI smoke tests |
| **Production** | `https://ask.u.ae` | Set `BASE_URL` and paths in `.env` if your deployment differs |

Live AI responses are often blocked in automation by reCAPTCHA. Use `USE_MOCK=true` for full AI, consistency, and fallback coverage.

## Configure test language

Set `TEST_LANG` in `.env` or on the command line:

```bash
# English (LTR) — default
TEST_LANG=en npm test

# Arabic (RTL)
TEST_LANG=ar npm test
```

Arabic/English path overrides:

```bash
EN_PATH=/en/ta
AR_PATH=/ar/ta
```

## Run tests

```bash
# Full suite (mock server starts automatically)
npm test

# By suite
npm run test:ui
npm run test:ai
npm run test:security

# Live site only (UI/multilingual; AI may skip without backend)
npm run test:live

# Explicit mock
npm run test:mock
```

### Optional OpenAI validation

```bash
USE_OPENAI_REVIEW=true OPENAI_API_KEY=sk-... npm run test:ai
```

### View HTML report

```bash
npm run report
# or
npx playwright show-report
```

### Summary markdown from last run

```bash
npm run report:summary
# writes test-results/SUMMARY.md
```

## Failed test artifacts

On failure, Playwright saves:

- **Screenshots** — `test-results/`
- **Traces** — `test-results/` (open with `npx playwright show-trace <trace.zip>`)

## Project layout

```
test-data/test-data.json   # EN/AR prompts and expectations
src/pages/chat.page.ts     # Page Object Model
src/validators/            # Rule-based + OpenAI review
tests/ui/                  # Widget, multilingual, a11y
tests/ai/                  # Response quality, consistency, loading
tests/security/            # XSS and prompt injection
mock-uask/                 # Local chat simulator
TEST_SCENARIOS.md          # Scenario matrix (deliverable)
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `USE_MOCK` | `true` | Start local mock chat server |
| `BASE_URL` | `https://beta-ask.u.ae` | Live chatbot host |
| `TEST_LANG` | `en` | `en` or `ar` for data-driven AI tests |
| `RESPONSE_TIMEOUT_MS` | `90000` | Max wait for bot reply |
| `USE_OPENAI_REVIEW` | `false` | Enable U-Ask OpenAI rubric scoring |
| `USE_LLM_JUDGE` | `false` | Legacy alias for `USE_OPENAI_REVIEW` |
| `OPENAI_API_KEY` | — | Required when `USE_OPENAI_REVIEW=true` or `USE_LLM_JUDGE=true` |

## Notes

- **Desktop + mobile**: Projects `desktop-chrome` and `mobile-safari` run the same specs; mobile requires WebKit (`npx playwright install webkit`).
- **Network**: Live tests may require UAE-accessible network; timeouts are extended for slow AI latency.
- See [TEST_SCENARIOS.md](./TEST_SCENARIOS.md) for the full case-study scenario checklist.
- **Technical summary:** Generate a structured overview with `node scripts/generate-framework-pdf.mjs`.
