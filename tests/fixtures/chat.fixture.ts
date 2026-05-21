import { test as base } from '@playwright/test';
import { ChatPage } from '../../src/pages/chat.page';
import { resolveLang } from '../../src/utils/locales';

type ChatFixtures = {
  chat: ChatPage;
};

export const test = base.extend<ChatFixtures>({
  chat: async ({ page }, use) => {
    const lang = resolveLang();
    const chat = new ChatPage(page, lang);
    await chat.goto(lang);
    await use(chat);
  },
});

export { expect } from '@playwright/test';
