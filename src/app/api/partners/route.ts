import { NextResponse } from 'next/server';

const FIRST_NAME_MAX_LENGTH = 50;
const LAST_NAME_MAX_LENGTH = 50;
const EMAIL_MAX_LENGTH = 100;
const COMPANY_NAME_MAX_LENGTH = 100;
const INDUSTRY_MAX_LENGTH = 100;
const PHONE_MAX_LENGTH = 30;
const MESSAGE_MAX_LENGTH = 2000;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

const getTurnstileSecretKey = () => {
  if (process.env.NODE_ENV === 'development') {
    return '1x0000000000000000000000000000000AA';
  }
  return process.env.TURNSTILE_SECRET_KEY;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, companyName, industry, phone, message, turnstileToken } = body;

    if (!isNonEmptyString(firstName) || !isNonEmptyString(lastName) || !isNonEmptyString(email) || !isNonEmptyString(industry) || !isNonEmptyString(message)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (firstName.trim().length > FIRST_NAME_MAX_LENGTH || lastName.trim().length > LAST_NAME_MAX_LENGTH) {
      return NextResponse.json({ error: 'Name must be 50 characters or less' }, { status: 400 });
    }
    if (email.trim().length > EMAIL_MAX_LENGTH) {
      return NextResponse.json({ error: `Email must be ${EMAIL_MAX_LENGTH} characters or less` }, { status: 400 });
    }
    if (industry.trim().length > INDUSTRY_MAX_LENGTH) {
      return NextResponse.json({ error: `Industry must be ${INDUSTRY_MAX_LENGTH} characters or less` }, { status: 400 });
    }
    if (typeof companyName === 'string' && companyName.trim().length > COMPANY_NAME_MAX_LENGTH) {
      return NextResponse.json({ error: `Company name must be ${COMPANY_NAME_MAX_LENGTH} characters or less` }, { status: 400 });
    }
    if (typeof phone === 'string' && phone.trim().length > PHONE_MAX_LENGTH) {
      return NextResponse.json({ error: `Phone must be ${PHONE_MAX_LENGTH} characters or less` }, { status: 400 });
    }
    if (message.trim().length < 10 || message.trim().length > MESSAGE_MAX_LENGTH) {
      return NextResponse.json({ error: `Message must be between 10 and ${MESSAGE_MAX_LENGTH} characters` }, { status: 400 });
    }

    if (!turnstileToken) {
      return NextResponse.json({ error: 'Security verification required' }, { status: 400 });
    }

    if (turnstileToken !== 'development-mode') {
      const TURNSTILE_SECRET_KEY = getTurnstileSecretKey();
      if (!TURNSTILE_SECRET_KEY) {
        console.error('Turnstile secret key not configured');
        return NextResponse.json({ error: 'Security verification service unavailable' }, { status: 503 });
      }

      const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        }),
      });

      const turnstileResult = await turnstileResponse.json();
      if (!turnstileResult.success) {
        console.error('Turnstile verification failed:', turnstileResult);
        return NextResponse.json({ error: 'Security verification failed. Please try again.' }, { status: 400 });
      }
    }

    if (!process.env.COFABRI_API_BASE_URL || !process.env.COFABRI_API_KEY) {
      console.error('cofabri-api credentials not configured');
      return NextResponse.json({ error: 'Partnership form service temporarily unavailable' }, { status: 503 });
    }

    let apiRes: Response;
    try {
      apiRes = await fetch(`${process.env.COFABRI_API_BASE_URL}/web/forms/partnership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.COFABRI_API_KEY}`,
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          company_name: typeof companyName === 'string' && companyName.trim() ? companyName.trim() : undefined,
          industry: industry.trim(),
          phone: typeof phone === 'string' && phone.trim() ? phone.trim() : undefined,
          message: message.trim(),
        }),
      });
    } catch (fetchError) {
      console.error('cofabri-api partnership submission unreachable:', fetchError);
      return NextResponse.json({ error: 'Failed to save partnership inquiry. Please try again later.' }, { status: 502 });
    }

    if (!apiRes.ok) {
      const errorBody = await apiRes.json().catch(() => null);
      // Log only validation messages, never the raw errorBody — express-validator's
      // error entries include the submitted `value` verbatim, which can be PII (email, etc).
      const errorSummary = errorBody?.errors ? errorBody.errors.map((e: { msg?: string }) => e.msg) : errorBody?.message || null;
      console.error('cofabri-api partnership submission failed:', apiRes.status, errorSummary);
      return NextResponse.json({ error: 'Failed to save partnership inquiry. Please try again later.' }, { status: 502 });
    }

    const result = await apiRes.json();
    console.log('Partnership inquiry saved via cofabri-api:', {
      recordId: result.id,
      industry: industry.trim(),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Partnership inquiry submitted successfully', recordId: result.id }, { status: 200 });
  } catch (error) {
    console.error('Error processing partnership inquiry:', error);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again later.' }, { status: 500 });
  }
}
