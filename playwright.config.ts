import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

// Cloudflare's publicly documented "always passes" test keypair
// (https://developers.cloudflare.com/turnstile/troubleshooting/testing/) —
// not a secret. It renders a real Turnstile widget from Cloudflare's own
// script that auto-verifies without any interaction, so the e2e suite can
// exercise the real contact-form flow (including the server-side siteverify
// call) without needing a live site key.
const TURNSTILE_TEST_ENV = {
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
  TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Real WebKit — the closest automated stand-in for the actual iOS
      // Safari the CofabriLogo font-rendering bug reproduced on. Scoped to
      // the logo regression spec only; everything else stays Chromium-only
      // to keep CI fast.
      name: 'webkit-logo',
      testMatch: /logo-regression\.spec\.ts/,
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: TURNSTILE_TEST_ENV,
  },
});
