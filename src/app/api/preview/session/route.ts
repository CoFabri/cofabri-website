import { NextResponse } from 'next/server';
import {
  passwordMatches,
  PREVIEW_COOKIE,
  previewCookieOptions,
  previewCookieValue,
  previewGateState,
  readPreviewGateEnv,
} from '@/lib/preview-auth';

// Preview login: checks the password and sets the HttpOnly preview cookie,
// so the password never goes into a URL.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';
  const env = readPreviewGateEnv();
  const state = previewGateState(env);

  if (state === 'open') return NextResponse.json({ ok: true });
  if (state === 'closed') {
    return NextResponse.json({ error: 'Preview is not available.' }, { status: 403 });
  }
  if (!passwordMatches(password, env.previewPassword as string)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PREVIEW_COOKIE, await previewCookieValue(env.previewPassword as string), previewCookieOptions);
  return res;
}
