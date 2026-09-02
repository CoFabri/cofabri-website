import { NextResponse } from 'next/server';

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

// Character limits (must match client-side limits)
const FIRST_NAME_MAX_LENGTH = 50;
const LAST_NAME_MAX_LENGTH = 50;
const EMAIL_MAX_LENGTH = 100;
const COMPANY_ORGANIZATION_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 2000;

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
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const languagePreference = formData.get('languagePreference') as string;
    const companyOrganization = formData.get('companyOrganization') as string;
    const preferredContactMethod = formData.get('preferredContactMethod') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const applications = formData.get('applications') as string;
    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;
    const turnstileToken = formData.get('turnstileToken') as string;
    
    // Parse applications array (cofabri-api's support endpoint only accepts a single
    // app_id, so we forward the first selected application, if any)
    const applicationsArray = applications ? JSON.parse(applications) : [];

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !preferredContactMethod || !subject || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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

    if (companyOrganization && companyOrganization.trim().length > COMPANY_ORGANIZATION_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Company/Organization must be ${COMPANY_ORGANIZATION_MAX_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    if (description.trim().length > DESCRIPTION_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    if (description.trim().length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters long' },
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
    const apiRes = await fetch(`${process.env.COFABRI_API_BASE_URL}/web/forms/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.COFABRI_API_KEY}`,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        subject: toApiSubjectLabel(subject),
        description,
        app_id: applicationsArray[0],
        subject_type: toApiSubjectType(subject),
        preferred_contact_method: preferredContactMethod || undefined,
        company_organization: companyOrganization || undefined,
        language_preference: toApiLanguagePreference(languagePreference),
      }),
    });

    if (!apiRes.ok) {
      const errorBody = await apiRes.json().catch(() => null);
      console.error('cofabri-api support submission failed:', apiRes.status, errorBody);

      // Log the submission for manual processing if the API call fails
      console.log('Support form submission (cofabri-api failed):', {
        firstName,
        lastName,
        email,
        phone,
        subject,
        description: description.substring(0, 100) + '...', // Truncate for logging
        languagePreference,
        applications: applicationsArray,
        screenshots: screenshots.map(f => f.name),
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
      firstName,
      lastName,
      email,
      phone,
      subject,
      languagePreference,
      applications: applicationsArray,
      screenshots: screenshots.map(f => f.name),
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
    
    // Log the submission for manual processing if there's an error
    try {
      const formData = await request.formData();
      console.log('Support form submission (error occurred):', {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        description: formData.get('description') ? (formData.get('description') as string).substring(0, 100) + '...' : '',
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Could not log form data:', logError);
    }
    
    return NextResponse.json(
      { error: 'Failed to process support ticket. Please try again later.' },
      { status: 500 }
    );
  }
}
