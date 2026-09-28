import { test, expect } from '@playwright/test';

// Runs against a second server (port 3100) whose cofabri-api URL points at a
// closed port, so every page request sees a genuine outage. See
// playwright.config.ts.
test.use({ baseURL: 'http://localhost:3100' });

test.describe('real outage', () => {
  test('any page returns a 503 backstop with the outage headers', async ({ page }) => {
    const problems: string[] = [];
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      // Chromium logs the 503 document load itself as a console error; that is
      // the expected response here, so filter only that exact message.
      if (message.text() === 'Failed to load resource: the server responded with a status of 503 (Service Unavailable)') return;
      if (message.type() === 'error') problems.push(`console: ${message.text()}`);
    });

    const response = await page.goto('/apps');

    expect(response!.status()).toBe(503);
    expect(response!.headers()['retry-after']).toBe('30');
    expect(response!.headers()['x-robots-tag']).toBe('noindex');
    expect(response!.headers()['cache-control']).toBe('no-store');

    await expect(page.getByRole('heading', { name: /not quite connecting/i })).toBeVisible();
    await expect(page.getByText('Temporarily unavailable')).toBeVisible();
    await expect(page.getByText('Your data is safe.')).toBeVisible();
    // Bare shell: none of the site chrome that talks to the API.
    await expect(page.locator('nav')).toHaveCount(0);
    await expect(page.getByText('Preview', { exact: true })).toHaveCount(0);
    await page.waitForLoadState('load');
    expect(problems).toEqual([]);
  });

  test('makes no requests to any other host', async ({ page }) => {
    const foreign: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (!url.startsWith('http://localhost:3100') && !url.startsWith('data:')) foreign.push(url);
    });
    await page.goto('/');
    await page.waitForLoadState('load');
    expect(foreign).toEqual([]);
  });

  test('the retry button reloads with ?retry= and shows the still-down message', async ({ page }) => {
    await page.goto('/apps');
    await page.getByRole('link', { name: 'Try again' }).click();
    await page.waitForURL(/retry=/);
    await expect(page.getByText(/Still not connecting as of/)).toBeVisible();
  });

  test('a forged backstop header from a client does not affect a normal path', async ({ request }) => {
    // /api/* is never intercepted, so this must not be the backstop HTML even
    // with the API down and a forged header.
    const response = await request.get('/api/status', { headers: { 'x-cofabri-backstop': 'outage' } });
    expect(await response.text()).not.toContain('not quite connecting');
  });

  test('direct /backstop visits redirect home', async ({ page }) => {
    // Home is itself the backstop during this outage, so assert on the URL.
    await page.goto('/backstop');
    expect(new URL(page.url()).pathname).toBe('/');
  });

  for (const scheme of ['light', 'dark'] as const) {
    for (const [name, size] of [
      ['desktop', { width: 1440, height: 900 }],
      ['mobile', { width: 390, height: 844 }],
    ] as const) {
      test(`screenshot ${scheme} ${name}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
        await page.setViewportSize(size);
        await page.goto('/');
        await expect(page.getByRole('heading', { name: /not quite connecting/i })).toBeVisible();
        // No horizontal scroll at any width.
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        await page.screenshot({ path: `test-results/backstop/${scheme}-${name}.png`, fullPage: true });
      });
    }
  }
});

test.describe('preview', () => {
  test('forces the backstop with a 200 and a Preview tag', async ({ page }) => {
    const response = await page.goto('/?backstop=preview');
    expect(response!.status()).toBe(200);
    expect(response!.headers()['retry-after']).toBeUndefined();
    await expect(page.getByText('Preview', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /not quite connecting/i })).toBeVisible();
  });

  test('state=retry shows the still-not-connecting line', async ({ page }) => {
    await page.goto('/?backstop=preview&state=retry');
    await expect(page.getByText(/Still not connecting as of/)).toBeVisible();
  });

  test('state=loading freezes the button in its loading state', async ({ page }) => {
    await page.goto('/?backstop=preview&state=loading');
    await expect(page.getByText('Checking…')).toBeVisible();
  });

  test('note=1 shows the populated live-status slot', async ({ page }) => {
    await page.goto('/?backstop=preview&note=1');
    await expect(page.getByText('Latest update')).toBeVisible();
    await expect(page.getByText(/hosting provider/)).toBeVisible();
  });
});
