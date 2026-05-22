import { test, expect } from '../fixtures/chat.fixture';
import { ChatPage } from '../../src/pages/chat.page';
import { resolveLang } from '../../src/utils/locales';

test.describe('Chat widget UI', () => {
  test('Chat widget appears with input and send controls', async ({ chat, page }) => {
    await expect(chat.messageInput).toBeVisible();
    await expect(chat.sendButton).toBeVisible();
    await expect(page.locator('.welcome-message, .message-title').first()).toBeVisible();
  });

  test('User can send a message and see it appear', async ({ chat }) => {
    const prompt = 'How do I apply for a UAE residence visa?';
    await chat.sendMessage(prompt);
    await expect(chat.messageInput).toHaveValue('');
    const userText = await chat.getLastUserMessage();
    expect(userText.toLowerCase()).toContain('visa');
  });

  test('Message input clears after sending', async ({ chat }) => {
    await chat.sendMessage('Tell me about Emirates ID renewal');
    expect(await chat.isInputEmpty()).toBe(true);
  });

  test('Conversation area displays sent messages', async ({ chat }) => {
    await chat.sendMessage('What are traffic fine payment options?');
    const area = chat.conversationArea;
    await expect(area).toContainText(/traffic|fine|مخالف/i);
  });

  test('Latest message automatically scrolls into view', async ({ chat, page }) => {
    await chat.sendMessage('How do I get a business license in the UAE?');
    const target = page.locator('[data-role="user-message"], .card-listing.d-block, .history-text').last();
    await expect(target).toBeVisible();
    await target.scrollIntoViewIfNeeded();
    await expect(target).toBeInViewport();
  });

  test('Send button enables when message is entered', async ({ chat }) => {
    await chat.messageInput.fill('Hello');
    await expect(chat.sendButton).toBeEnabled();
  });
});

test.describe('Chat widget — language from TEST_LANG', () => {
  test('Loads page in configured language and direction', async ({ page }) => {
    const lang = resolveLang();
    const chat = new ChatPage(page, lang);
    await chat.goto(lang);
    const dir = await chat.getDocumentDirection();
    if (lang === 'ar') {
      expect(dir).toBe('rtl');
    } else {
      expect(dir).toBe('ltr');
    }
  });
});
