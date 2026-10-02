import { test, expect, type Page } from '@playwright/test';

async function mockApps(page: Page) {
  await page.route('**/api/apps', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'medoura', name: 'Medoura', status: 'Active', category: 'healthcare' },
        { id: 'gathr', name: 'Gathr', status: 'Active', category: 'social' },
      ]),
    }),
  );
}

// Parses a multipart/form-data body into name -> values, so assertions prove
// the field name and its value together (not just that a string appears).
function parseMultipart(body: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const re = /Content-Disposition: form-data; name="([^"]+)"[^\r\n]*\r\n(?:[^\r\n]+\r\n)*?\r\n([\s\S]*?)\r\n--/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) (out[m[1]] ??= []).push(m[2]);
  return out;
}

async function capturePost(page: Page) {
  const captured = { body: '' };
  await page.route('**/api/support', async (route) => {
    captured.body = route.request().postData() ?? '';
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  return captured;
}

async function waitForTurnstile(page: Page) {
  await page.waitForFunction(
    () => Boolean(document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value),
    { timeout: 30_000 },
  );
}

test('app link prefills identity, collapses it, and sends the entry point', async ({ page }) => {
  await mockApps(page);
  const captured = await capturePost(page);

  await page.goto('/support?app=Medoura&firstName=Jane&lastName=Doe&email=jane%40example.com&from=help-menu&tenant=Acme');
  await expect(page.getByText('Submitting as')).toBeVisible();
  await expect(page.getByLabel('First Name *')).toHaveCount(0);

  await page.getByLabel('Description *').fill('Automated check of the prefilled flow.');
  await waitForTurnstile(page);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();

  await expect(page.getByText('Support Ticket Submitted!')).toBeVisible();
  const fields = parseMultipart(captured.body);
  expect(fields.entryPoint).toEqual(['help-menu']);
  expect(fields.tenantName).toEqual(['Acme']);
  expect(fields.audience).toEqual(['staff']);
  expect(fields.email).toEqual(['jane@example.com']);
  expect(fields.firstName).toEqual(['Jane']);
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
  const captured = await capturePost(page);

  await page.goto('/support');
  // Positive check (file input is visually hidden, so attached rather than visible).
  await expect(page.getByLabel('Screenshots')).toBeAttached();
  await page.getByLabel('First Name *').fill('Test');
  await page.getByLabel('Last Name *').fill('User');
  await page.getByLabel('Email *').fill('test@example.com');
  await page.getByLabel('Description *').fill('No phone number on purpose.');
  await waitForTurnstile(page);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();

  await expect(page.getByText('Support Ticket Submitted!')).toBeVisible();
  const fields = parseMultipart(captured.body);
  expect(fields.entryPoint).toEqual(['website']);
  expect(fields.phone).toEqual(['']);
  expect(fields.audience).toEqual(['staff']);
});

test('patient mode submit posts audience patient, clinic name, typed identity and no screenshots', async ({ page }) => {
  await mockApps(page);
  const captured = await capturePost(page);

  await page.goto('/support?app=Medoura&audience=patient&tenant=Acme%20Clinic&firstName=Jane&lastName=Doe&email=jane%40example.com');
  await page.getByLabel('First Name *').fill('Pat');
  await page.getByLabel('Last Name *').fill('Ient');
  await page.getByLabel('Email *').fill('pat@example.org');
  await expect(page.getByText('Screenshots help.')).toHaveCount(0);
  await expect(page.locator('a[href="mailto:support@cofabri.com"]')).toBeVisible();
  await page.getByLabel('Describe the App Problem *').fill('Patient mode submit check.');
  await waitForTurnstile(page);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();

  await expect(page.getByText('Support Ticket Submitted!')).toBeVisible();
  const fields = parseMultipart(captured.body);
  expect(fields.audience).toEqual(['patient']);
  expect(fields.tenantName).toEqual(['Acme Clinic']);
  expect(fields.firstName).toEqual(['Pat']);
  expect(fields.email).toEqual(['pat@example.org']);
  expect(fields.screenshots).toBeUndefined();
});

test('choosing Phone as the contact method without a number shows an error', async ({ page }) => {
  await mockApps(page);
  await page.goto('/support');
  await page.getByLabel('First Name *').fill('Test');
  await page.getByLabel('Last Name *').fill('User');
  await page.getByLabel('Email *').fill('test@example.com');
  await page.getByLabel('Description *').fill('Phone preference check.');

  await page.getByRole('button', { name: 'More Options' }).click();
  await page.getByRole('radio', { name: 'Phone' }).check({ force: true });
  await expect(page.getByRole('radio', { name: 'Phone' })).toBeChecked();

  // Collapse again so validation itself has to re-open the section.
  await page.getByRole('button', { name: 'Fewer Options' }).click();
  const toggle = page.getByRole('button', { name: 'More Options' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('radio', { name: 'Phone' })).toHaveCount(0);

  await waitForTurnstile(page);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();

  await expect(page.getByText('Add a phone number, or choose a different contact method')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fewer Options' })).toHaveAttribute('aria-expanded', 'true');
});

const PHI_LINE = "Please don't include health information. We can help without it.";
const PATIENT_BANNER = 'Questions about your care, orders or prescriptions?';

test('non-healthcare app in patient mode shows no health wording', async ({ page }) => {
  await mockApps(page);
  await page.goto('/support?app=Gathr&audience=patient&tenant=X');
  await expect(page.getByLabel('Describe the App Problem *')).toBeVisible();
  await expect(page.getByText('Gathr').first()).toBeVisible();
  await expect(page.getByText(PHI_LINE)).toHaveCount(0);
  await expect(page.getByText(PATIENT_BANNER)).toHaveCount(0);
});

test('healthcare app in patient mode shows the banner and the health line', async ({ page }) => {
  await mockApps(page);
  await page.goto('/support?app=Medoura&audience=patient&tenant=Test%20Clinic');
  await expect(page.getByText(PATIENT_BANNER)).toBeVisible();
  await expect(page.getByText('Test Clinic')).toBeVisible();
  await expect(page.getByText(PHI_LINE)).toBeVisible();
});

test('no app selected shows the health line once apps have loaded', async ({ page }) => {
  await mockApps(page);
  await page.goto('/support');
  await expect(page.getByText(PHI_LINE)).toBeVisible();
});

test('side panel email line has no health wording', async ({ page }) => {
  await mockApps(page);
  await page.goto('/support');
  const line = page.locator('p', { has: page.locator('a[href="mailto:support@cofabri.com"]') }).first();
  await expect(line).toContainText('Prefer email?');
  await expect(line).not.toContainText(/health/i);
});
