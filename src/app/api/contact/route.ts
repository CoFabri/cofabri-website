import { NextResponse } from 'next/server';

// cofabri-api only supports 'english' / 'spanish' for language_preference (enum column).
// The contact form offers many more languages, so anything else is left unset rather
// than sent through and rejected by the API.
const SUPPORTED_LANGUAGE_PREFERENCES = new Set(['english', 'spanish']);
function toApiLanguagePreference(languagePreference?: string): string | undefined {
  const normalized = languagePreference?.trim().toLowerCase();
  return normalized && SUPPORTED_LANGUAGE_PREFERENCES.has(normalized) ? normalized : undefined;
}

// Character limits (must match client-side limits)
const FIRST_NAME_MAX_LENGTH = 50;
const LAST_NAME_MAX_LENGTH = 50;
const EMAIL_MAX_LENGTH = 100;
const SUBJECT_MAX_LENGTH = 100;
const MESSAGE_MAX_LENGTH = 2000;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// Get Turnstile secret key based on environment
const getTurnstileSecretKey = () => {
  if (process.env.NODE_ENV === 'development') {
    // Use Cloudflare's test secret key for development
    return '1x0000000000000000000000000000000AA';
  }
  return process.env.TURNSTILE_SECRET_KEY;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, subject, message, languagePreference, relatedApp, turnstileToken, inquiryType } = body;

    // Validate required fields
    if (!isNonEmptyString(firstName) || !isNonEmptyString(lastName) || !isNonEmptyString(email) || !isNonEmptyString(subject) || !isNonEmptyString(message)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (inquiryType !== 'sales' && inquiryType !== 'general') {
      return NextResponse.json(
        { error: 'inquiryType must be sales or general' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate character limits
    if (firstName.trim().length > FIRST_NAME_MAX_LENGTH) {
      return NextResponse.json(
        { error: `First name must be ${FIRST_NAME_MAX_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    if (lastName.trim().length > LAST_NAME_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Last name must be ${LAST_NAME_MAX_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    if (email.trim().length > EMAIL_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Email must be ${EMAIL_MAX_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    if (subject.trim().length > SUBJECT_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Subject must be ${SUBJECT_MAX_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    if (message.trim().length > MESSAGE_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MESSAGE_MAX_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Verify Turnstile token
    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'Security verification required' },
        { status: 400 }
      );
    }

    // Skip Turnstile verification in development mode or if token is the development fallback
    if (turnstileToken === 'development-mode') {
      console.log('Skipping Turnstile verification in development mode');
    } else {
      const TURNSTILE_SECRET_KEY = getTurnstileSecretKey();
      if (!TURNSTILE_SECRET_KEY) {
        console.error('Turnstile secret key not configured');
        return NextResponse.json(
          { error: 'Security verification service unavailable' },
          { status: 503 }
        );
      }

      // Verify the Turnstile token with Cloudflare
      const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        }),
      });

      const turnstileResult = await turnstileResponse.json();

      if (!turnstileResult.success) {
        console.error('Turnstile verification failed:', turnstileResult);
        return NextResponse.json(
          { error: 'Security verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    // Check if cofabri-api credentials are available
    if (!process.env.COFABRI_API_BASE_URL || !process.env.COFABRI_API_KEY) {
      console.error('cofabri-api credentials not configured');
      return NextResponse.json(
        { error: 'Contact form service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Submit to cofabri-api, which persists the contact submission in Supabase
    let apiRes: Response;
    try {
      apiRes = await fetch(`${process.env.COFABRI_API_BASE_URL}/web/forms/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.COFABRI_API_KEY}`,
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          language_preference: toApiLanguagePreference(languagePreference),
          inquiry_type: inquiryType,
        }),
      });
    } catch (fetchError) {
      console.error('cofabri-api contact submission unreachable:', fetchError);
      return NextResponse.json(
        { error: 'Failed to save contact submission. Please try again later.' },
        { status: 502 }
      );
    }

    if (!apiRes.ok) {
      const errorBody = await apiRes.json().catch(() => null);
      // Log only validation messages, never the raw errorBody — express-validator's
      // error entries include the submitted `value` verbatim, which can be PII (email, etc).
      const errorSummary = errorBody?.errors ? errorBody.errors.map((e: { msg?: string }) => e.msg) : errorBody?.message || null;
      console.error('cofabri-api contact submission failed:', apiRes.status, errorSummary, {
        subject: subject.trim(),
        relatedApp,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: 'Failed to save contact submission. Please try again later.' },
        { status: 502 }
      );
    }

    const result = await apiRes.json();
    console.log('Contact form submission saved via cofabri-api:', {
      recordId: result.id,
      subject: subject.trim(),
      relatedApp,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        message: 'Contact form submitted successfully',
        recordId: result.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing contact form:', error);

    return NextResponse.json(
      { error: 'Failed to process form submission. Please try again later.' },
      { status: 500 }
    );
  }
}
