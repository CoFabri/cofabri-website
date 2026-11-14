import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function submit(turnstileToken: string) {
  return POST(
    new Request('https://cofabri.com/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        preferredContactMethod: 'email',
        subject: 'Hello',
        message: 'A message long enough to pass validation.',
        inquiryType: 'general',
        turnstileToken,
      }),
    })
  );
}

describe('POST /api/contact Turnstile', () => {
  it("does not accept the 'development-mode' token outside development", async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false })));
    vi.stubGlobal('fetch', fetchMock);

    const res = await submit('development-mode');

    expect(res.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
  });
});
