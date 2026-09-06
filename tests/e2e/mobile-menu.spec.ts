import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

test('mobile menu opens as a full-screen cover and closes via the close button', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Open menu' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Apps/ })).toHaveAttribute('href', '/apps');
  await expect(dialog.getByRole('link', { name: /About/ })).toHaveAttribute('href', '/about');
  await expect(dialog.getByRole('link', { name: /Roadmap/ })).toHaveAttribute('href', '/roadmaps');
  await expect(dialog.getByRole('link', { name: /Knowledge Base/ })).toHaveAttribute('href', '/knowledge-base');
  await expect(dialog.getByRole('link', { name: /Support/ })).toHaveAttribute('href', '/support');
  await expect(dialog.getByRole('link', { name: /Explore apps/ })).toHaveAttribute('href', '/apps');

  await dialog.getByRole('button', { name: 'Close menu' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('mobile menu closes on Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('clicking a nav link inside the mobile menu navigates and closes it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('dialog').getByRole('link', { name: /About/ }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('dialog')).toBeHidden();
});
