import { defineConfig, devices } from '@playwright/test';
import { API_PORT, API_URL, WEB_PORT, WEB_URL } from './e2e/support/env';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: WEB_URL,
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // API con una base SQLite propia de e2e (server/prisma/e2e.db, ignorada por git).
      command: 'node ../e2e/support/fresh-db.cjs && npx prisma migrate deploy && npx ts-node --transpile-only src/index.ts',
      cwd: './server',
      url: `${API_URL}/health`,
      env: { DATABASE_URL: 'file:./e2e.db', JWT_SECRET: 'e2e-secret', PORT: String(API_PORT) },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      cwd: './client',
      url: WEB_URL,
      env: { VITE_API_PROXY: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
