import { NextResponse } from 'next/server';
import { contactSchema, checkContactMethodRequirement } from '@/lib/validation/schemas';
import { isValidPhone, normalizePhone, DEFAULT_COUNTRY } from '@/lib/validation/phone';

// cofabri-api only supports 'english' / 'spanish' for language_preference (enum column).
// The contact form offers many more languages, so anything else is left unset rather
// than sent through and rejected by the API.
const SUPPORTED_LANGUAGE_PREFERENCES = new Set(['english', 'spanish']);
function toApiLanguagePreference(languagePreference?: string): string | undefined {
  const normalized = languagePreference?.trim().toLowerCase();
  return normalized && SUPPORTED_LANGUAGE_PREFERENCES.has(normalized) ? normalized : undefined;
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
    const { turnstileToken, phone } = body;

    // Validate + normalize (trim, title-case names, lowercase email) in one
    // place — this is the security boundary; the client's own validation is
    // just UX and must never be trusted on its own.
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid form submission' },
        { status: 400 }
      );
    }
    const {
      firstName, lastName, email, subject, message, languagePreference, relatedApp, preferredContactMethod, inquiryType,
    } = parsed.data;

    // Phone is optional, but if provided it must be a real, valid number.
    // The client always sends E.164 (leading "+"), which libphonenumber-js
    // can validate without needing a default country.
    const rawPhone = typeof phone === 'string' ? phone.trim() : '';
    let normalizedPhone: string | undefined;
    if (rawPhone) {
      if (!isValidPhone(rawPhone, DEFAULT_COUNTRY)) {
        return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 });
      }
      normalizedPhone = normalizePhone(rawPhone, DEFAULT_COUNTRY) ?? undefined;
    }

    // Email is also optional on this form — at least one of email/phone is
    // required, and whichever contact method was chosen must actually be
    // reachable. Re-checked server-side since the client's own check is UX only.
    const contactMethodErrors = checkContactMethodRequirement({
      email,
      phone: rawPhone,
      isPhoneValid: true, // already validated above
      preferredContactMethod,
    });
    const contactMethodError = contactMethodErrors.email || contactMethodErrors.phone || contactMethodErrors.preferredContactMethod;
    if (contactMethodError) {
      return NextResponse.json({ error: contactMethodError }, { status: 400 });
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
          email: email || undefined,
          phone: normalizedPhone,
          preferred_contact_method: preferredContactMethod || undefined,
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
        hasPhone: Boolean(normalizedPhone),
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
      hasPhone: Boolean(normalizedPhone),
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
