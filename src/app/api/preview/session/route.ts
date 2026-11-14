import { NextResponse } from 'next/server';
import {
  passwordMatches,
  PREVIEW_COOKIE,
  previewCookieOptions,
  previewCookieValue,
  previewGateState,
  readPreviewGateEnv,
} from '@/lib/preview-auth';
import { clientIp, refundAttempt, tryConsumeAttempt } from '@/lib/preview-login-limiter';

// Preview login: checks the password and sets the HttpOnly preview cookie,
// so the password never goes into a URL.
export async function POST(request: Request) {
  const ip = clientIp(request);
  // Counted before any await so parallel requests cannot all slip through.
  if (!tryConsumeAttempt(ip, Date.now())) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';
  const env = readPreviewGateEnv();
  const state = previewGateState(env);

  if (state !== 'password') refundAttempt(ip);
  if (state === 'open') return NextResponse.json({ ok: true });
  if (state === 'closed') {
    return NextResponse.json({ error: 'Preview is not available.' }, { status: 403 });
  }
  if (!passwordMatches(password, env.previewPassword as string)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  refundAttempt(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PREVIEW_COOKIE, await previewCookieValue(env.previewPassword as string), previewCookieOptions);
  return res;
}
