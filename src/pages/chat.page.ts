import { expect, Locator, Page } from '@playwright/test';
import {
  getAcceptButtonName,
  getBaseUrl,
  getInputLabel,
  getLangPath,
  Lang,
  useMock,
} from '../utils/locales';

export class ChatPage {
  readonly page: Page;
  readonly lang: Lang;
  readonly chatPanel: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly conversationArea: Locator;

  constructor(page: Page, lang: Lang = 'en') {
    this.page = page;
    this.lang = lang;
    this.chatPanel = page.locator('.chatContainer, .full-body, .main-content').first();
    this.messageInput = page.locator('#conversation');
    this.sendButton = page.locator('.send-question');
    this.conversationArea = page.locator('.full-body, .content-body, .chatContainer').first();
  }

  async goto(lang: Lang = this.lang): Promise<void> {
    const base = getBaseUrl().replace(/\/$/, '');
    const path = getLangPath(lang);
    const url = useMock() ? `${base}/?lang=${lang}` : `${base}${path}`;
    const response = await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    if (!useMock() && response && response.status() >= 400) {
      throw new Error(`Failed to load U-Ask (${response.status()}): ${url}`);
    }
    await this.dismissTermsIfPresent();
    await this.waitForChatReady();
  }

  async dismissTermsIfPresent(): Promise<void> {
    const accept = this.page.getByRole('button', { name: getAcceptButtonName(this.lang) });
    if (await accept.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await accept.click();
      await this.page.waitForTimeout(500);
    }
  }

  async waitForChatReady(): Promise<void> {
    await expect(this.messageInput).toBeVisible({ timeout: 30_000 });
    if (useMock()) {
      await expect(this.page.locator('.welcome-message, .message-title').first()).toBeVisible();
    } else {
      await expect(
        this.page.locator('.welcome-message, .message-title').first(),
      ).toBeVisible({ timeout: 15_000 });
    }
  }

  async openWidget(): Promise<void> {
    await this.waitForChatReady();
  }

  async sendMessage(text: string): Promise<void> {
    await this.messageInput.fill(text);
    const sendEnabled = await this.sendButton.isEnabled().catch(() => false);
    if (sendEnabled) {
      await this.sendButton.click();
    } else {
      await this.messageInput.press('Enter');
    }
    if (useMock()) {
      await this.page.waitForTimeout(300);
    }
  }

  getUserMessages(): Locator {
    return this.page.locator(
      '.card-listing:not(.d-none), .user-message, .history-text, [data-role="user-message"]',
    );
  }

  getBotMessages(): Locator {
    return this.page.locator(
      '.bot-message, .answer-message, [data-role="bot-message"], .message-content.bot',
    );
  }

  async getLastUserMessage(): Promise<string> {
    if (useMock()) {
      const userMsgs = this.page.locator('[data-role="user-message"]');
      return (await userMsgs.nth((await userMsgs.count()) - 1).innerText()).trim();
    }
    const text = await this.page
      .locator('.card-listing.d-block .container, .history-text, [data-role="user-message"]')
      .last()
      .innerText()
      .catch(async () => {
        const body = await this.conversationArea.innerText();
        const lines = body
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 5);
        return lines[lines.length - 1] ?? '';
      });
    return text.trim();
  }

  async getLastBotMessage(): Promise<string> {
    const bot = this.getBotMessages();
    await bot.last().waitFor({ state: 'visible', timeout: this.responseTimeout() }).catch(() => {});
    if ((await bot.count()) === 0) {
      return '';
    }
    return (await bot.last().innerText()).trim();
  }

  async waitForBotResponse(timeoutMs?: number): Promise<string> {
    const timeout = timeoutMs ?? this.responseTimeout();
    const bot = this.getBotMessages();
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if ((await bot.count()) > 0) {
        const text = await bot.last().innerText();
        if (text.trim().length > 20) return text.trim();
      }
      if (useMock()) {
        await this.page.waitForTimeout(200);
        continue;
      }
      const sendDisabled = !(await this.sendButton.isEnabled().catch(() => true));
      const areaText = await this.conversationArea.innerText().catch(() => '');
      const hasLongReply = areaText.split('\n').some((l) => l.trim().length > 100);
      if (!sendDisabled && hasLongReply) {
        const lines = areaText
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 80);
        if (lines.length > 0) return lines[lines.length - 1];
      }
      await this.page.waitForTimeout(1_000);
    }

    const fallback = await this.getFallbackMessage();
    if (fallback) return fallback;

    return (await this.getLastBotMessage()) || '';
  }

  async getFallbackMessage(): Promise<string> {
    const fallback = this.page.locator(
      '.error-message, .fallback-message, [data-role="fallback"]',
    );
    if (await fallback.count()) {
      return (await fallback.last().innerText()).trim();
    }
    const body = await this.page.locator('body').innerText();
    const match = body.match(/sorry[^.!\n]{0,120}[.!]?|please try again|عذر[^.!\n]{0,80}|حاول مرة أخرى/i);
    return match?.[0]?.trim() ?? '';
  }

  async isInputEmpty(): Promise<boolean> {
    return (await this.messageInput.inputValue()).length === 0;
  }

  async getDocumentDirection(): Promise<string> {
    const htmlDir = await this.page.locator('html').getAttribute('dir');
    const inputDir = await this.messageInput.getAttribute('dir');
    return htmlDir ?? inputDir ?? 'ltr';
  }

  async isLoadingVisible(): Promise<boolean> {
    const loading = this.page.locator(
      '.loading-indicator, .spinner, [class*="loading"], [data-role="loading"]',
    );
    if (await loading.isVisible().catch(() => false)) return true;
    return !(await this.sendButton.isEnabled().catch(() => true));
  }

  responseTimeout(): number {
    return Number(process.env.RESPONSE_TIMEOUT_MS ?? 90_000);
  }

}

export function needsMockForAiTests(): boolean {
  return useMock();
}
