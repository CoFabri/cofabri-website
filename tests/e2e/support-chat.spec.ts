import { test, expect, type Page } from '@playwright/test';

async function mockApps(page: Page) {
  await page.route('**/api/apps', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'medoura', name: 'Medoura', status: 'Active', category: 'Healthcare' }]),
    }),
  );
}

function ndjson(...events: unknown[]) {
  return events.map((e) => JSON.stringify(e)).join('\n') + '\n';
}

// Scoped to the chat's own widget: /support?chat=1 also renders the form's Turnstile widget, and
// either can solve first. The chat's widget is the first token input inside the chat section.
async function waitForTurnstile(page: Page) {
  await expect(page.getByLabel('Support chat').locator('input[name="cf-turnstile-response"]').first()).not.toHaveValue('', {
    timeout: 30_000,
  });
}

test('chat is hidden by default and the form is untouched', async ({ page }) => {
  await mockApps(page);
  await page.goto('/support');
  await expect(page.getByRole('heading', { name: 'Submit a Support Ticket' })).toBeVisible();
  await expect(page.getByLabel('Support chat')).toHaveCount(0);
});

test('an answer streams in with a citation link', async ({ page }) => {
  await mockApps(page);
  type ChatPost = { messages: { role: string; content: string }[]; turnstileToken?: string };
  let posted = null as ChatPost | null;
  await page.route('**/api/chat', async (route) => {
    posted = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/x-ndjson',
      body: ndjson(
        { type: 'text', delta: 'Click Forgot Password.' },
        { type: 'citations', items: [{ slug: 'reset-password', title: 'Reset Your Password' }] },
        { type: 'done' },
      ),
    });
  });

  await page.goto('/support?chat=1');
  const chat = page.getByLabel('Support chat');
  await expect(chat).toBeVisible();
  await waitForTurnstile(page);
  await chat.getByLabel('Your message').fill('How do I reset my password?');
  await chat.getByRole('button', { name: 'Send', exact: true }).click();

  await expect(chat.getByText('Click Forgot Password.')).toBeVisible();
  await expect(chat.getByRole('link', { name: 'Reset Your Password' })).toHaveAttribute('href', '/knowledge-base/reset-password');
  expect(posted?.messages).toEqual([{ role: 'user', content: 'How do I reset my password?' }]);
  expect(posted?.turnstileToken).toBeTruthy();
});

test('a drafted ticket is editable and is sent through the existing intake with the chat entry point', async ({ page }) => {
  await mockApps(page);
  await page.route('**/api/chat', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/x-ndjson',
      body: ndjson(
        { type: 'text', delta: "I don't have that. I've prepared a message." },
        { type: 'ticket', summary: 'Cannot upload my file', appId: 'medoura' },
        { type: 'done' },
      ),
    }),
  );
  let supportBody = '';
  await page.route('**/api/support', async (route) => {
    supportBody = route.request().postData() ?? '';
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/support?chat=1');
  const chat = page.getByLabel('Support chat');
  await waitForTurnstile(page);
  await chat.getByLabel('Your message').fill('upload fails');
  await chat.getByRole('button', { name: 'Send', exact: true }).click();

  const card = chat.getByLabel('Message to support');
  await expect(card).toBeVisible();
  await expect(card.getByLabel('Summary')).toHaveValue('Cannot upload my file');
  await card.getByLabel('Summary').fill('Cannot upload my file in Medoura');
  await card.getByLabel('First name').fill('Dina');
  await card.getByLabel('Last name').fill('Chat');
  await card.getByLabel('Email').fill('dina@example.com');
  await expect(card.getByRole('button', { name: 'Send', exact: true })).toBeEnabled({ timeout: 30_000 });
  await card.getByRole('button', { name: 'Send', exact: true }).click();

  await expect(chat.getByText('Message sent.')).toBeVisible();
  expect(supportBody).toContain('name="entryPoint"');
  expect(supportBody).toMatch(/name="entryPoint"\r\n\r\nchat/);
  expect(supportBody).toMatch(/name="description"\r\n\r\nCannot upload my file in Medoura/);
  expect(supportBody).toMatch(/name="applications"\r\n\r\n\["medoura"\]/);
});

test('when chat is unavailable the panel says so and the form still works', async ({ page }) => {
  await mockApps(page);
  await page.route('**/api/chat', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"unavailable"}' }));
  await page.goto('/support?chat=1');
  const chat = page.getByLabel('Support chat');
  await waitForTurnstile(page);
  await chat.getByLabel('Your message').fill('hello');
  await chat.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(chat.getByText("Chat isn't available right now. Use the form below.")).toHaveCount(2);
  await expect(chat.getByRole('log').getByText("Chat isn't available right now. Use the form below.")).toBeVisible();
  const firstName = page.getByLabel('First Name *');
  await expect(firstName).toBeVisible();
  await firstName.fill('Dina');
  await expect(firstName).toHaveValue('Dina');
});

test('an expired chat cookie asks for the security check again and keeps the typed message', async ({ page }) => {
  await mockApps(page);
  await page.route('**/api/chat', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"verification_required"}' }));
  await page.goto('/support?chat=1');
  const chat = page.getByLabel('Support chat');
  await waitForTurnstile(page);
  await chat.getByLabel('Your message').fill('keep this text');
  await chat.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(chat.getByText('Please complete the security check again, then send your message.')).toBeVisible();
  await expect(chat.getByLabel('Your message')).toHaveValue('keep this text');
});

test('a stream that fails midway keeps the partial answer and points at the form', async ({ page }) => {
  await mockApps(page);
  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 200, contentType: 'application/x-ndjson', body: ndjson({ type: 'text', delta: 'Click Forgot' }, { type: 'error' }) }),
  );
  await page.goto('/support?chat=1');
  const chat = page.getByLabel('Support chat');
  await waitForTurnstile(page);
  await chat.getByLabel('Your message').fill('reset password');
  await chat.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(chat.getByText(/Click Forgot/)).toBeVisible();
  await expect(chat.getByText('You can use the form below.')).toBeVisible();
  // The chat is not disabled: the input is still there and Send works for a new message.
  await expect(chat.getByLabel('Your message')).toBeVisible();
  await chat.getByLabel('Your message').fill('another question');
  await expect(chat.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
});

test('a failed ticket send shows the error, then a retry succeeds', async ({ page }) => {
  await mockApps(page);
  await page.route('**/api/chat', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/x-ndjson',
      body: ndjson({ type: 'text', delta: 'I prepared a message.' }, { type: 'ticket', summary: 'Cannot upload', appId: null }, { type: 'done' }),
    }),
  );
  let supportCalls = 0;
  await page.route('**/api/support', async (route) => {
    supportCalls += 1;
    if (supportCalls === 1) {
      await route.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"Failed"}' });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    }
  });

  await page.goto('/support?chat=1');
  const chat = page.getByLabel('Support chat');
  await waitForTurnstile(page);
  await chat.getByLabel('Your message').fill('upload fails');
  await chat.getByRole('button', { name: 'Send', exact: true }).click();

  const card = chat.getByLabel('Message to support');
  await expect(card).toBeVisible();
  await card.getByLabel('First name').fill('Dina');
  await card.getByLabel('Last name').fill('Chat');
  await card.getByLabel('Email').fill('dina@example.com');
  const send = card.getByRole('button', { name: 'Send', exact: true });
  await expect(send).toBeEnabled({ timeout: 30_000 });
  await send.click();

  await expect(card.getByText('Failed', { exact: true })).toBeVisible();
  // The widget remounts and issues a fresh token, which re-enables Send.
  await expect(send).toBeEnabled({ timeout: 30_000 });
  await send.click();

  await expect(chat.getByText('Message sent.')).toBeVisible();
  expect(supportCalls).toBe(2);
});

test('a first-send verification failure restores the message and a retry after re-verifying works', async ({ page }) => {
  await mockApps(page);
  let chatCalls = 0;
  await page.route('**/api/chat', async (route) => {
    chatCalls += 1;
    if (chatCalls === 1) {
      await route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"verification_failed"}' });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/x-ndjson',
        body: ndjson({ type: 'text', delta: 'Here is the answer.' }, { type: 'done' }),
      });
    }
  });

  await page.goto('/support?chat=1');
  const chat = page.getByLabel('Support chat');
  await waitForTurnstile(page);
  await chat.getByLabel('Your message').fill('please help');
  await chat.getByRole('button', { name: 'Send', exact: true }).click();

  await expect(chat.getByText('Please complete the security check again, then send your message.')).toBeVisible();
  await expect(chat.getByLabel('Your message')).toHaveValue('please help');

  // The widget remounted; once it verifies again the same message can be sent.
  // The old widget was unmounted in the same render that showed the notice, so any chat token
  // input now belongs to the remounted widget.
  await waitForTurnstile(page);
  await chat.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(chat.getByText('Here is the answer.')).toBeVisible();
  expect(chatCalls).toBe(2);
});

test('typing after the security check passed does not reset the solved widget', async ({ page }) => {
  await mockApps(page);
  await page.goto('/support?chat=1');
  const chat = page.getByLabel('Support chat');
  await waitForTurnstile(page);
  // Cloudflare's test widget re-solves instantly after a reset, so a token check alone can miss
  // one. Count resets directly: the widget effect calls turnstile.reset when its deps change.
  await page.evaluate(() => {
    const w = window as unknown as { __resets: number; turnstile: { reset: (id: string) => void } };
    w.__resets = 0;
    const original = w.turnstile.reset.bind(w.turnstile);
    w.turnstile.reset = (id: string) => {
      w.__resets += 1;
      return original(id);
    };
  });
  await chat.getByLabel('Your message').pressSequentially('twenty characters!!!', { delay: 20 });
  await expect(chat.getByLabel('Your message')).toHaveValue('twenty characters!!!');
  await expect(chat.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('');
  expect(await page.evaluate(() => (window as unknown as { __resets: number }).__resets)).toBe(0);
  await expect(chat.getByRole('button', { name: 'Send', exact: true })).toBeEnabled();
});

const SEND = { name: 'Send', exact: true } as const;

test('a flagged exchange stays visible but is not sent as history on later messages', async ({ page }) => {
  await mockApps(page);
  const posts: { messages: { role: string; content: string }[] }[] = [];
  await page.route('**/api/chat', async (route) => {
    posts.push(route.request().postDataJSON());
    const body =
      posts.length === 1
        ? ndjson({ type: 'text', delta: 'Please call your clinician.' }, { type: 'done', flagged: true })
        : ndjson({ type: 'text', delta: 'Click Forgot Password.' }, { type: 'done' });
    await route.fulfill({ status: 200, contentType: 'application/x-ndjson', body });
  });
  await page.goto('/support?chat=1');
  const chat = page.getByLabel('Support chat');
  await waitForTurnstile(page);
  await chat.getByLabel('Your message').fill('my chest hurts');
  await chat.getByRole('button', SEND).click();
  await expect(chat.getByText('Please call your clinician.')).toBeVisible();

  await chat.getByLabel('Your message').fill('How do I reset my password?');
  await chat.getByRole('button', SEND).click();
  await expect(chat.getByText('Click Forgot Password.')).toBeVisible();

  expect(posts).toHaveLength(2);
  expect(posts[1].messages).toEqual([{ role: 'user', content: 'How do I reset my password?' }]);
  // The flagged exchange is still in the visible log.
  await expect(chat.getByRole('log').getByText('my chest hurts')).toBeVisible();
  await expect(chat.getByRole('log').getByText('Please call your clinician.')).toBeVisible();
});

test('a 400 shows the too-long notice and Start Over resets the chat without disabling it', async ({ page }) => {
  await mockApps(page);
  let calls = 0;
  await page.route('**/api/chat', async (route) => {
    calls += 1;
    if (calls === 1) {
      await route.fulfill({
        status: 200,
        contentType: 'application/x-ndjson',
        body: ndjson({ type: 'text', delta: 'First answer.' }, { type: 'done' }),
      });
    } else if (calls === 2) {
      await route.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"invalid_request"}' });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/x-ndjson',
        body: ndjson({ type: 'text', delta: 'Fresh answer.' }, { type: 'done' }),
      });
    }
  });
  await page.goto('/support?chat=1');
  const chat = page.getByLabel('Support chat');
  await waitForTurnstile(page);
  await chat.getByLabel('Your message').fill('one');
  await chat.getByRole('button', SEND).click();
  await expect(chat.getByText('First answer.')).toBeVisible();
  await chat.getByLabel('Your message').fill('two');
  await chat.getByRole('button', SEND).click();

  await expect(chat.getByText('This conversation got too long. Start a new one.')).toBeVisible();
  await expect(chat.getByText("Chat isn't available right now.")).toHaveCount(0);
  await chat.getByRole('button', { name: 'Start Over' }).click();
  await expect(chat.getByText('This conversation got too long. Start a new one.')).toHaveCount(0);
  await expect(chat.getByRole('log').getByText('First answer.')).toHaveCount(0);
  await expect(chat.getByLabel('Your message')).toHaveValue('');

  await chat.getByLabel('Your message').fill('three');
  await chat.getByRole('button', SEND).click();
  await expect(chat.getByText('Fresh answer.')).toBeVisible();
});

test('a ticket with no text gets a neutral line instead of the failure message', async ({ page }) => {
  await mockApps(page);
  await page.route('**/api/chat', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/x-ndjson',
      body: ndjson({ type: 'ticket', summary: 'Cannot upload', appId: null }, { type: 'done' }),
    }),
  );
  await page.goto('/support?chat=1');
  const chat = page.getByLabel('Support chat');
  await waitForTurnstile(page);
  await chat.getByLabel('Your message').fill('upload fails');
  await chat.getByRole('button', SEND).click();
  await expect(chat.getByText("I've prepared a message for the support team below.")).toBeVisible();
  await expect(chat.getByText('Something went wrong.')).toHaveCount(0);
  await expect(chat.getByLabel('Message to support')).toBeVisible();
});

test('the ticket card and its typed details survive a new chat message', async ({ page }) => {
  await mockApps(page);
  let calls = 0;
  await page.route('**/api/chat', async (route) => {
    calls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/x-ndjson',
      body:
        calls === 1
          ? ndjson({ type: 'text', delta: 'Prepared.' }, { type: 'ticket', summary: 'Cannot upload', appId: null }, { type: 'done' })
          : ndjson({ type: 'text', delta: 'Second answer.' }, { type: 'done' }),
    });
  });
  await page.goto('/support?chat=1');
  const chat = page.getByLabel('Support chat');
  await waitForTurnstile(page);
  await chat.getByLabel('Your message').fill('upload fails');
  await chat.getByRole('button', SEND).click();
  const card = chat.getByLabel('Message to support');
  await card.getByLabel('First name').fill('Dina');
  await card.getByLabel('Email').fill('dina@example.com');

  await chat.getByLabel('Your message').fill('one more thing');
  await chat.getByRole('button', SEND).first().click();
  await expect(chat.getByText('Second answer.')).toBeVisible();
  await expect(card).toBeVisible();
  await expect(card.getByLabel('First name')).toHaveValue('Dina');
  await expect(card.getByLabel('Email')).toHaveValue('dina@example.com');
});

test('phone width: no horizontal overflow with an answer and the ticket card visible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await mockApps(page);
  await page.route('**/api/chat', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/x-ndjson',
      body: ndjson(
        { type: 'text', delta: 'https://example.com/' + 'averyveryverylongunbrokenurlsegment'.repeat(4) },
        { type: 'citations', items: [{ slug: 'reset-password', title: 'Reset Your Password' }] },
        { type: 'ticket', summary: 'Cannot upload', appId: null },
        { type: 'done' },
      ),
    }),
  );
  await page.goto('/support?chat=1');
  const chat = page.getByLabel('Support chat');
  await waitForTurnstile(page);
  await chat.getByLabel('Your message').fill('upload fails');
  await chat.getByRole('button', SEND).click();
  await expect(chat.getByLabel('Message to support')).toBeVisible();
  await expect(chat.getByRole('link', { name: 'Reset Your Password' })).toBeVisible();
  const [scrollWidth, innerWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
});
