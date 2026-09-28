import { test, expect } from '@playwright/test';

// Runs against a third server (port 3101) whose cofabri-api URL points at a
// stub that answers 200. See playwright.config.ts.
test.use({ baseURL: 'http://localhost:3101' });

test.describe('healthy API', () => {
  test('a healthy API leaves the site alone', async ({ page }) => {
    const response = await page.goto('/about');
    expect(response!.status()).not.toBe(503);
    expect(response!.headers()['retry-after']).toBeUndefined();
    await expect(page.getByText(/not quite connecting/i)).toHaveCount(0);
  });

  test('a forged backstop header from a client does not put a healthy page in backstop mode', async ({ request }) => {
    const response = await request.get('/about', {
      headers: {
        'x-cofabri-backstop': 'outage',
        'x-cofabri-backstop-state': 'retry',
        'x-cofabri-backstop-note': '1',
      },
    });
    expect(response.status()).not.toBe(503);
    expect(await response.text()).not.toContain('not quite connecting');
  });
});
