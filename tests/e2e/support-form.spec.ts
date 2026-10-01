import { test, expect, type Page } from '@playwright/test';

async function mockApps(page: Page) {
  await page.route('**/api/apps', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'medoura', name: 'Medoura', status: 'Active' }]),
    }),
  );
}

async function waitForTurnstile(page: Page) {
  await page.waitForFunction(
    () => Boolean(document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value),
    { timeout: 30_000 },
  );
}

test('app link prefills identity, collapses it, and sends the entry point', async ({ page }) => {
  await mockApps(page);
  let posted = '';
  await page.route('**/api/support', async (route) => {
    posted = route.request().postData() ?? '';
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/support?app=Medoura&firstName=Jane&lastName=Doe&email=jane%40example.com&from=help-menu&tenant=Acme');
  await expect(page.getByText('Submitting as')).toBeVisible();
  await expect(page.getByLabel('First Name *')).toHaveCount(0);

  await page.getByLabel('Description *').fill('Automated check of the prefilled flow.');
  await waitForTurnstile(page);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();

  await expect(page.getByText('Support Ticket Submitted!')).toBeVisible();
  expect(posted).toContain('help-menu');
  expect(posted).toContain('Acme');
  expect(posted).toContain('jane@example.com');
});

test('patient mode shows the clinic banner, no screenshots, and ignores identity params', async ({ page }) => {
  await mockApps(page);
  await page.goto('/support?app=Medoura&audience=patient&tenant=Acme%20Clinic&firstName=Jane&email=jane%40example.com');

  await expect(page.getByText('Questions about your care, orders or prescriptions?')).toBeVisible();
  await expect(page.getByText('Acme Clinic')).toBeVisible();
  await expect(page.getByLabel('Screenshots')).toHaveCount(0);
  await expect(page.getByLabel('First Name *')).toHaveValue('');
  await expect(page.getByLabel('Email *')).toHaveValue('');
});

test('direct visitor can submit without a phone number', async ({ page }) => {
  await mockApps(page);
  let posted = '';
  await page.route('**/api/support', async (route) => {
    posted = route.request().postData() ?? '';
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/support');
  await page.getByLabel('First Name *').fill('Test');
  await page.getByLabel('Last Name *').fill('User');
  await page.getByLabel('Email *').fill('test@example.com');
  await page.getByLabel('Description *').fill('No phone number on purpose.');
  await waitForTurnstile(page);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();

  await expect(page.getByText('Support Ticket Submitted!')).toBeVisible();
  expect(posted).toContain('website');
});

test('choosing Phone as the contact method without a number shows an error', async ({ page }) => {
  await mockApps(page);
  await page.goto('/support');
  await page.getByLabel('First Name *').fill('Test');
  await page.getByLabel('Last Name *').fill('User');
  await page.getByLabel('Email *').fill('test@example.com');
  await page.getByLabel('Description *').fill('Phone preference check.');

  await page.getByRole('button', { name: 'More Options' }).click();
  await page.getByText('Phone', { exact: true }).first().click();
  await waitForTurnstile(page);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();

  await expect(page.getByText('Add a phone number, or choose a different contact method')).toBeVisible();
});
