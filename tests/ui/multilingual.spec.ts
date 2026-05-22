import { test, expect } from '@playwright/test';
import { ChatPage } from '../../src/pages/chat.page';

test.describe('Multilingual LTR / RTL', () => {
  test('English page displays left-to-right layout', async ({ page }) => {
    const chat = new ChatPage(page, 'en');
    await chat.goto('en');
    expect(await chat.getDocumentDirection()).toBe('ltr');
    await expect(chat.messageInput).toHaveAttribute('dir', 'ltr');
  });

  test('Arabic page displays right-to-left layout', async ({ page }) => {
    const chat = new ChatPage(page, 'ar');
    await chat.goto('ar');
    expect(await chat.getDocumentDirection()).toBe('rtl');
    await expect(chat.messageInput).toHaveAttribute('dir', 'rtl');
  });

  test('Arabic input shows Arabic placeholder text', async ({ page }) => {
    const chat = new ChatPage(page, 'ar');
    await chat.goto('ar');
    const placeholder = await chat.messageInput.getAttribute('placeholder');
    expect(placeholder).toMatch(/اطرح|سؤال/);
  });
});
