# U-Ask Test Scenario Matrix

Summary of automated scenarios for the AI/ML QA case study. Execution status is recorded in Playwright HTML report (`playwright-report/`) and optional `test-results/SUMMARY.md` after `npm run report:summary`.

## 1. Chatbot UI behavior

| ID | Scenario | Spec | Pass criteria |
|----|----------|------|---------------|
| UI-01 | Chat widget loads (desktop) | `tests/ui/chat-widget.spec.ts` | Input, send, welcome visible |
| UI-02 | Chat widget loads (mobile) | same (mobile-safari project) | Controls visible on mobile viewport |
| UI-03 | User can send messages | `chat-widget.spec.ts` | User text appears in conversation |
| UI-04 | AI/user messages rendered | `chat-widget.spec.ts` | Conversation area contains sent text |
| UI-05 | Input cleared after send | `chat-widget.spec.ts` | `#conversation` value empty |
| UI-06 | Scroll / viewport | `chat-widget.spec.ts` | Latest message in viewport |
| UI-07 | Send enabled with text | `chat-widget.spec.ts` | Send button enabled when input filled |
| UI-08 | English LTR | `tests/ui/multilingual.spec.ts` | `html[dir=ltr]`, input `dir=ltr` |
| UI-09 | Arabic RTL | `multilingual.spec.ts` | `html[dir=rtl]`, input `dir=rtl` |
| UI-10 | Arabic placeholder | `multilingual.spec.ts` | Arabic placeholder on AR route |
| UI-11 | Accessibility | `tests/ui/accessibility.spec.ts` | No critical axe violations; labeled input |

## 2. GPT-powered response validation

| ID | Scenario | Spec | Pass criteria |
|----|----------|------|---------------|
| AI-01 | Helpful public-service answers | `tests/ai/response-quality.spec.ts` | Rule validator + min length + UAE keywords |
| AI-02 | Anti-hallucination hints | `response-quality.spec.ts` | `mustNotMentionAny`, no fake contacts/URLs |
| AI-03 | EN/AR consistency | `tests/ai/consistency.spec.ts` | Shared topics in both languages (mock) |
| AI-04 | Clean formatting | `response-quality.spec.ts` | No raw HTML; terminal punctuation |
| AI-05 | Loading state | `tests/ai/loading-fallback.spec.ts` | Loading indicator during reply (mock) |
| AI-06 | Fallback message | `loading-fallback.spec.ts` | Sorry / try again patterns for gibberish |
| AI-07 | Optional LLM judge | `response-quality.spec.ts` | Score ≥ 3, no hallucination when enabled |

Data: `test-data/test-data.json` — `publicServiceQueries`, `consistencyPairs`.

## 3. Security and injection

| ID | Scenario | Spec | Pass criteria |
|----|----------|------|---------------|
| SEC-01 | XSS script tag | `tests/security/injection.spec.ts` | No script execution; payload shown as text |
| SEC-02 | XSS img onerror | `injection.spec.ts` | DOM safe; no dialog |
| SEC-03 | Prompt injection (joke) | `injection.spec.ts` | On-topic/refusal; no joke content |
| SEC-04 | Prompt injection (system) | `injection.spec.ts` | No system prompt leak |
| SEC-05 | Alert dialog guard | `injection.spec.ts` | No `alert` dialog from XSS |

Data: `test-data/test-data.json` — `security`, `fallbackTriggers`.

## Test data coverage

- **English queries**: visa, Emirates ID, traffic fines, business license, Golden Visa, health insurance, passport, VAT
- **Arabic queries**: visa, Emirates ID, traffic fines, business license
- **Consistency pairs**: visa, Emirates ID, traffic (bilingual)
- **Security**: XSS (2), prompt injection (2)

## Reports

| Deliverable | Location |
|-------------|----------|
| Automated scripts | `tests/` |
| Test data | `test-data/test-data.json` |
| Run instructions | `README.md` |
| Scenario matrix | This file |
| HTML execution report | `playwright-report/` |
| Run summary | `test-results/SUMMARY.md` (after `npm run report:summary`) |
