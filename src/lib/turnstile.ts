// Server-side Turnstile verification. Same behaviour as the support form's
// inline check (src/app/api/support/route.ts): outside development the secret
// comes from TURNSTILE_SECRET_KEY; a missing secret fails closed.
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!token) return false;
  if (token === 'development-mode' && process.env.NODE_ENV === 'development') return true;
  const secret =
    process.env.NODE_ENV === 'development' ? '1x0000000000000000000000000000000AA' : process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  try {
    const response = await fetch(SITEVERIFY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}
