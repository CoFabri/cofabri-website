import { NextResponse } from 'next/server';

interface ApiError {
  message?: string;
  stack?: string;
  details?: string;
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

    const { firstName, lastName, email, appId, interestLevel, quote, statement } = data;

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
        interest_level: Number(interestLevel) || undefined,
        quote: quote !== undefined && quote !== null && quote !== '' ? Number(quote) : undefined,
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
      console.error('cofabri-api waitlist submission failed:', apiRes.status, errorBody);

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

    const waitlistRecord = await apiRes.json();

    return NextResponse.json({ success: true, waitlistRecord });
  } catch (error: unknown) {
    const err = error as ApiError;
    if (failedBeforeSending(error)) {
      console.warn('cofabri-api unreachable for waitlist signup:', err.message);
      return NextResponse.json({ error: 'Failed to create record' }, { status: 502 });
    }
    console.error('Detailed error in signup route:', {
      message: err.message,
      stack: err.stack,
      details: err.details || 'No additional details available'
    });

    return NextResponse.json(
      { error: 'Failed to create record', details: err.message },
      { status: 500 }
    );
  }
}
