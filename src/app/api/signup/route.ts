import { NextResponse } from 'next/server';
import { waitlistSignupSchema } from '@/lib/validation/schemas';
import { verifyTurnstile } from '@/lib/turnstile';

interface ApiError {
  message?: string;
}

// A connection that failed before TLS finished (or never resolved) means the
// request was never sent, so one retry cannot double-submit a signup.
function failedBeforeSending(error: unknown): boolean {
  const cause = (error as { cause?: { code?: string; message?: string } } | null)?.cause;
  if (!(error instanceof TypeError) || !cause) return false;
  return (
    ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'].includes(cause.code ?? '') ||
    /before secure TLS connection was established/.test(cause.message ?? '')
  );
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate + normalize here -- this is the security boundary; the
    // client's own checks are UX only.
    const parsed = waitlistSignupSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid form submission' },
        { status: 400 }
      );
    }
    const { firstName, lastName, email, appId, interestLevel, quote, statement } = parsed.data;

    const turnstileToken = typeof data?.turnstileToken === 'string' ? data.turnstileToken : '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!(await verifyTurnstile(turnstileToken, ip))) {
      return NextResponse.json({ error: 'Security verification failed. Please try again.' }, { status: 400 });
    }

    if (!process.env.COFABRI_API_BASE_URL || !process.env.COFABRI_API_KEY) {
      throw new Error('cofabri-api configuration missing');
    }

    // Submit to cofabri-api, which persists the waitlist signup in Supabase
    // and enforces beta capacity server-side.
    const send = () => fetch(`${process.env.COFABRI_API_BASE_URL}/web/forms/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.COFABRI_API_KEY}`,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        app_id: appId || undefined,
        interest_level: interestLevel,
        quote,
        statement: statement || undefined,
      }),
    });
    let apiRes: Response;
    try {
      apiRes = await send();
    } catch (error) {
      if (!failedBeforeSending(error)) throw error;
      console.warn('cofabri-api waitlist connection failed before sending, retrying once');
      apiRes = await send();
    }

    if (!apiRes.ok) {
      const errorBody = await apiRes.json().catch(() => null);
      // Log only the status and message: the body of a validation failure
      // echoes the submitted name/email back.
      console.error('cofabri-api waitlist submission failed:', apiRes.status, errorBody?.message);

      // A 400 here means cofabri-api's capacity guard rejected the signup
      // (e.g. someone submitted just as the last spot was taken) — surface
      // its message to the user instead of a generic failure.
      if (apiRes.status === 400) {
        return NextResponse.json(
          { error: errorBody?.message || 'Beta signups are no longer available for this app.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create record' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as ApiError;
    if (failedBeforeSending(error)) {
      console.warn('cofabri-api unreachable for waitlist signup:', err.message);
      return NextResponse.json({ error: 'Failed to create record' }, { status: 502 });
    }
    console.error('Error in signup route:', err?.message);

    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}
