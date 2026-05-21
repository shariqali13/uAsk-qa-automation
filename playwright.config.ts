import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const useMock = process.env.USE_MOCK === 'true' || process.env.USE_MOCK === '1';
const baseURL = useMock
  ? (process.env.MOCK_BASE_URL ?? 'http://127.0.0.1:4173')
  : (process.env.BASE_URL ?? 'https://beta-ask.u.ae');
const responseTimeout = Number(process.env.RESPONSE_TIMEOUT_MS ?? 90_000);

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: responseTimeout + 30_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  webServer: useMock
    ? {
        command: 'npx --yes serve mock-uask -l 4173',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      }
    : undefined,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    locale: process.env.TEST_LANG === 'ar' ? 'ar-AE' : 'en-US',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 14'],
      },
    },
  ],
});
