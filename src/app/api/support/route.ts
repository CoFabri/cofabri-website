import { NextResponse } from 'next/server';
import { supportSchema } from '@/lib/validation/schemas';
import { isValidPhone, normalizePhone, DEFAULT_COUNTRY, type CountryCode } from '@/lib/validation/phone';

// cofabri-api only supports 'english' / 'spanish' for language_preference (enum column).
const SUPPORTED_LANGUAGE_PREFERENCES = new Set(['english', 'spanish']);
function toApiLanguagePreference(languagePreference?: string): string | undefined {
  const normalized = languagePreference?.trim().toLowerCase();
  return normalized && SUPPORTED_LANGUAGE_PREFERENCES.has(normalized) ? normalized : undefined;
}

// Maps the form's subject category to cofabri-api's subject_type enum
// ('support_help' | 'feature_request'), while 'subject' itself stays a free-text label.
function toApiSubjectType(subject: string): string | undefined {
  if (subject === 'support') return 'support_help';
  if (subject === 'feature') return 'feature_request';
  return undefined;
}

function toApiSubjectLabel(subject: string): string {
  if (subject === 'support') return 'Support/Help';
  if (subject === 'feature') return 'Feature Request';
  return subject;
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
    const formData = await request.formData();

    // Extract form data
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const languagePreference = formData.get('languagePreference');
    const companyOrganization = formData.get('companyOrganization');
    const preferredContactMethod = formData.get('preferredContactMethod');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const applications = formData.get('applications');
    const subject = formData.get('subject');
    const description = formData.get('description');
    const turnstileToken = formData.get('turnstileToken');

    // Parse applications array (cofabri-api's support endpoint only accepts a single
    // app_id, so we forward the first selected application, if any)
    const applicationsArray = typeof applications === 'string' && applications ? JSON.parse(applications) : [];

    // Validate + normalize (trim, title-case names, lowercase email) in one
    // place — this is the security boundary; the client's own validation is
    // just UX and must never be trusted on its own.
    const parsed = supportSchema.safeParse({
      firstName: typeof firstName === 'string' ? firstName : '',
      lastName: typeof lastName === 'string' ? lastName : '',
      email: typeof email === 'string' ? email : '',
      languagePreference: typeof languagePreference === 'string' ? languagePreference : undefined,
      companyOrganization: typeof companyOrganization === 'string' ? companyOrganization : undefined,
      preferredContactMethod: typeof preferredContactMethod === 'string' ? preferredContactMethod : '',
      subject: typeof subject === 'string' ? subject : '',
      description: typeof description === 'string' ? description : '',
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid form submission' },
        { status: 400 }
      );
    }
    const {
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      email: normalizedEmail,
      companyOrganization: normalizedCompanyOrganization,
      preferredContactMethod: normalizedPreferredContactMethod,
      subject: normalizedSubject,
      description: normalizedDescription,
      languagePreference: normalizedLanguagePreference,
    } = parsed.data;

    // Note: phone is intentionally not required here — cofabri-api's
    // /web/forms/support endpoint has no column to persist it (a separate,
    // cross-repo schema gap), so it would be misleading to block submission
    // on a value that's silently discarded. The form still collects it (it
    // may be useful in logs), and if present it must be a real, valid number.
    const rawPhone = typeof phone === 'string' ? phone.trim() : '';
    let normalizedPhone: string | undefined;
    if (rawPhone) {
      // The client always sends E.164 (leading "+"), which libphonenumber-js
      // can validate without needing a default country.
      const phoneCountry: CountryCode = DEFAULT_COUNTRY;
      if (!isValidPhone(rawPhone, phoneCountry)) {
        return NextResponse.json(
          { error: 'Please enter a valid phone number' },
          { status: 400 }
        );
      }
      normalizedPhone = normalizePhone(rawPhone, phoneCountry) ?? undefined;
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
          response: turnstileToken as string,
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
        { error: 'Support form service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Note: screenshots are accepted by this form but cofabri-api's /web/forms/support
    // endpoint has no field to persist attachment URLs, so they are not uploaded or sent.
    const screenshots = formData.getAll('screenshots') as File[];
    if (screenshots.length > 0) {
      console.log('Screenshots received but not persisted (unsupported by cofabri-api):', screenshots.map(file => file.name));
    }

    // Submit to cofabri-api, which persists the support ticket in Supabase
    let apiRes: Response;
    try {
      apiRes = await fetch(`${process.env.COFABRI_API_BASE_URL}/web/forms/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.COFABRI_API_KEY}`,
        },
        body: JSON.stringify({
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          email: normalizedEmail,
          subject: toApiSubjectLabel(normalizedSubject),
          description: normalizedDescription,
          app_id: applicationsArray[0],
          subject_type: toApiSubjectType(normalizedSubject),
          preferred_contact_method: normalizedPreferredContactMethod || undefined,
          company_organization: normalizedCompanyOrganization || undefined,
          language_preference: toApiLanguagePreference(normalizedLanguagePreference),
        }),
      });
    } catch (fetchError) {
      console.error('cofabri-api support submission unreachable:', fetchError);
      return NextResponse.json(
        { error: 'Failed to save support ticket. Please try again later.' },
        { status: 502 }
      );
    }

    if (!apiRes.ok) {
      const errorBody = await apiRes.json().catch(() => null);
      // Log only validation messages, never the raw errorBody — express-validator's
      // error entries include the submitted `value` verbatim, which can be PII (email, etc).
      const errorSummary = errorBody?.errors ? errorBody.errors.map((e: { msg?: string }) => e.msg) : errorBody?.message || null;
      console.error('cofabri-api support submission failed:', apiRes.status, errorSummary, {
        subject: normalizedSubject,
        applications: applicationsArray,
        screenshots: screenshots.map(f => f.name),
        hasPhone: Boolean(normalizedPhone),
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        { error: 'Failed to save support ticket. Please try again later.' },
        { status: 502 }
      );
    }

    const result = await apiRes.json();
    console.log('Support form submission saved via cofabri-api:', {
      recordId: result.id,
      subject: normalizedSubject,
      applications: applicationsArray,
      screenshots: screenshots.map(f => f.name),
      hasPhone: Boolean(normalizedPhone),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        message: 'Support ticket submitted successfully',
        recordId: result.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing support form:', error);

    return NextResponse.json(
      { error: 'Failed to process support ticket. Please try again later.' },
      { status: 500 }
    );
  }
}
