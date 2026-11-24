import { NextResponse } from 'next/server';
import { isValidEmail, normalizeEmail } from '@/lib/validation/email';
import { FIELD_LIMITS } from '@/lib/validation/schemas';
import { clientIp } from '@/lib/preview-login-limiter';
import { tryConsumeSignup } from '@/lib/signup-limiter';

// "Notify Me" for a service or app that has not launched. Forwards to
// cofabri-api POST /web/forms/coming-soon, which stores the email against the
// app in Core. Abuse protection is a honeypot and the same per-IP limiter the
// beta waitlist uses; the inline field has no CAPTCHA by design.

const APP_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,62}$/i;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const appId = typeof body.appId === 'string' ? body.appId.trim() : '';
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';

  // A filled honeypot is a bot. Answer as if it worked so it learns nothing.
  if (typeof body.hpToken === 'string' && body.hpToken.trim() !== '') {
    return NextResponse.json({ success: true });
  }

  if (!email || !isValidEmail(email) || email.length > FIELD_LIMITS.email) {
    return NextResponse.json({ error: 'Enter an email like name@business.com.' }, { status: 400 });
  }
  if (!APP_ID_PATTERN.test(appId)) {
    return NextResponse.json({ error: 'Unknown app' }, { status: 400 });
  }
  if (firstName.length > FIELD_LIMITS.firstName) {
    return NextResponse.json({ error: 'Invalid first name' }, { status: 400 });
  }

  const ip = clientIp(request);
  if (!tryConsumeSignup(ip, Date.now())) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  if (!process.env.COFABRI_API_BASE_URL || !process.env.COFABRI_API_KEY) {
    console.error('cofabri-api credentials not configured');
    return NextResponse.json({ error: 'Temporarily unavailable' }, { status: 503 });
  }

  try {
    const apiRes = await fetch(`${process.env.COFABRI_API_BASE_URL}/web/forms/coming-soon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.COFABRI_API_KEY}`,
      },
      body: JSON.stringify({
        email: normalizeEmail(email),
        first_name: firstName || undefined,
        app_id: appId,
      }),
    });
    if (!apiRes.ok) {
      // Status only: the response echoes the submitted email on a validation failure.
      console.error('cofabri-api coming-soon submission failed:', apiRes.status);
      return NextResponse.json({ error: 'Failed to save your request' }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('cofabri-api coming-soon submission unreachable:', (error as Error)?.message);
    return NextResponse.json({ error: 'Failed to save your request' }, { status: 502 });
  }
}
