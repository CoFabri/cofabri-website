import { test, expect } from '@playwright/test';

test('contact form submits without a client error', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  await page.goto('/contact');
  // Wait for the form itself rather than networkidle: the Turnstile widget
  // polls Cloudflare continuously once mounted, so networkidle never fires.
  const form = page.locator('form');
  await form.waitFor({ state: 'visible' });

  await form.getByLabel('First Name *').fill('Test');
  await form.getByLabel('Last Name *').fill('User');
  await form.getByLabel('Email Address').fill('test@example.com');

  await page.getByRole('button', { name: 'Select an option' }).click();
  await page.getByRole('button', { name: 'General question / support' }).click();

  await form.getByLabel('Subject *').fill('CI smoke test');
  await form.getByLabel('Message *').fill('This is an automated end-to-end smoke test submission.');

  // The Turnstile test keypair (see playwright.config.ts) auto-verifies with
  // no interaction, but still round-trips through Cloudflare's real script —
  // wait for the token it produces before submitting.
  await page.waitForFunction(() => {
    const input = document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]');
    return Boolean(input?.value);
  }, { timeout: 30_000 });

  await page.getByRole('button', { name: 'Send Message' }).click();

  // Whether the backend call itself succeeds depends on cofabri-api
  // credentials this CI run may not have — either outcome is a handled
  // application state, not a client error. Just wait for the form to leave
  // its submitting state.
  await expect(page.getByText(/Message Sent Successfully!|Submission Failed/)).toBeVisible({ timeout: 30_000 });

  expect(pageErrors, `Unexpected client-side errors: ${pageErrors.map((e) => e.message).join('; ')}`).toHaveLength(0);
});
