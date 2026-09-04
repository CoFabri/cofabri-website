import { NextResponse } from 'next/server';
import { partnerSchema, checkContactMethodRequirement } from '@/lib/validation/schemas';
import { isValidPhone, normalizePhone, DEFAULT_COUNTRY, type CountryCode } from '@/lib/validation/phone';

const getTurnstileSecretKey = () => {
  if (process.env.NODE_ENV === 'development') {
    return '1x0000000000000000000000000000000AA';
  }
  return process.env.TURNSTILE_SECRET_KEY;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, turnstileToken } = body;

    // Validate + normalize (trim, title-case names, lowercase email) in one
    // place — this is the security boundary; the client's own validation is
    // just UX and must never be trusted on its own.
    const parsed = partnerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid form submission' },
        { status: 400 }
      );
    }
    const { firstName, lastName, email, companyName, industry, message, preferredContactMethod, relatedApp } = parsed.data;

    // Phone is optional on this form, but if provided it must be a real,
    // valid number. The client always sends E.164 (leading "+"), which
    // libphonenumber-js can validate without needing a default country.
    const rawPhone = typeof phone === 'string' ? phone.trim() : '';
    let normalizedPhone: string | undefined;
    if (rawPhone) {
      const phoneCountry: CountryCode = DEFAULT_COUNTRY;
      if (!isValidPhone(rawPhone, phoneCountry)) {
        return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 });
      }
      normalizedPhone = normalizePhone(rawPhone, phoneCountry) ?? undefined;
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
          first_name: firstName,
          last_name: lastName,
          email: email || undefined,
          phone: normalizedPhone,
          preferred_contact_method: preferredContactMethod || undefined,
          company_name: companyName || undefined,
          industry,
          message,
          app_id: relatedApp || undefined,
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
      industry,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Partnership inquiry submitted successfully', recordId: result.id }, { status: 200 });
  } catch (error) {
    console.error('Error processing partnership inquiry:', error);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again later.' }, { status: 500 });
  }
}
