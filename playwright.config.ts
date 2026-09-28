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
  webServer: [
    {
      command: 'npm run build && npm run start',
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: TURNSTILE_TEST_ENV,
    },
    {
      // Relies on the .next build produced by the first server's command
      // (Playwright starts servers in array order).
      // Same build, but cofabri-api points at a closed port so every request
      // sees a genuine outage. Used only by tests/e2e/backstop.spec.ts. The
      // readiness URL is the preview form, which returns 200 (a real outage
      // returns 503, which Playwright would not treat as ready).
      command: 'npx next start -p 3100',
      url: 'http://localhost:3100/?backstop=preview',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { ...TURNSTILE_TEST_ENV, COFABRI_API_BASE_URL: 'http://127.0.0.1:9' },
    },
    // The next two prove a healthy API leaves the site alone (used only by
    // tests/e2e/backstop-healthy.spec.ts): a stub cofabri-api answering 200,
    // and the same build pointed at it.
    {
      command: 'node tests/e2e/support/stub-api.mjs',
      url: 'http://127.0.0.1:3200/',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'npx next start -p 3101',
      url: 'http://localhost:3101/?backstop=preview',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { ...TURNSTILE_TEST_ENV, COFABRI_API_BASE_URL: 'http://127.0.0.1:3200' },
    },
  ],
});
