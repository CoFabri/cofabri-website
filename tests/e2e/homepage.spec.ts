import { test, expect } from '@playwright/test';

test('homepage loads with the header and footer logo rendered', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/CoFabri/);

  await expect(page.locator('header img[alt="CoFabri"]').first()).toBeVisible();
  await expect(page.locator('footer img[alt="CoFabri"]').first()).toBeVisible();
});

test('primary nav links resolve', async ({ page }) => {
  await page.goto('/');

  const navLinks = [
    { name: 'Apps', path: '/apps' },
    { name: 'Roadmap', path: '/roadmaps' },
    { name: 'Knowledge Base', path: '/knowledge-base' },
    { name: 'Support', path: '/support' },
  ];

  for (const link of navLinks) {
    const response = await page.goto(link.path);
    expect(response?.ok(), `${link.name} (${link.path}) should resolve with a 2xx/3xx response`).toBe(true);
    await expect(page.locator('header img[alt="CoFabri"]').first()).toBeVisible();
  }
});
