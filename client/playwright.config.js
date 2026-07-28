import { defineConfig, devices } from '@playwright/test';

// Port 5174 keeps the test server clear of the default 5173 dev server, so
// `npm run dev` can stay running while the suite executes.
const PORT = 5174;
// `globalThis.process` to match the specs — eslint here is configured for
// browser globals only.
const env = globalThis.process?.env ?? {};
const baseURL = env.AMREVIZ_TEST_URL || `http://127.0.0.1:${PORT}/`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(env.CI),
  retries: env.CI ? 2 : 0,
  reporter: env.CI ? 'line' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Only manage a server when pointing at the default local target; an
  // explicit AMREVIZ_TEST_URL means someone else is serving the app.
  webServer: env.AMREVIZ_TEST_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${PORT} --strictPort --host 127.0.0.1`,
        url: `http://127.0.0.1:${PORT}/`,
        reuseExistingServer: !env.CI,
        stdout: 'ignore',
        timeout: 60_000,
      },
});
