import { NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

// Character limits (must match client-side limits)
const FIRST_NAME_MAX_LENGTH = 50;
const LAST_NAME_MAX_LENGTH = 50;
const EMAIL_MAX_LENGTH = 100;
const SUBJECT_MAX_LENGTH = 100;
const MESSAGE_MAX_LENGTH = 2000;

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
    const { firstName, lastName, email, subject, message, languagePreference, relatedApp, turnstileToken } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
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

    // Check if Airtable credentials are available
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.error('Airtable credentials not configured');
      return NextResponse.json(
        { error: 'Contact form service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Create record in Airtable Contact Submissions table
    const airtableData = {
      fields: {
        'First Name': firstName,
        'Last Name': lastName,
        'Email': email,
        'Subject': subject,
        'Message': message,
        'Language Preference': languagePreference || 'English',
        'Status': 'New',
        // Related App(s) is a linked record field, so we send an array of record IDs
        ...(relatedApp && { 'Related App(s)': [relatedApp] })
      }
    };

    const response = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/Contact%20Submissions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(airtableData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Airtable API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        submittedData: {
          firstName,
          lastName,
          email,
          subject,
          languagePreference,
          relatedApp
        }
      });
      
      // Log the submission for manual processing if Airtable fails
      console.log('Contact form submission (Airtable failed):', {
        firstName,
        lastName,
        email,
        subject,
        message: message.substring(0, 100) + '...', // Truncate for logging
        languagePreference,
        relatedApp,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { error: 'Failed to save contact submission. Please try again later.' },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('Contact form submission saved to Airtable:', {
      recordId: result.id,
      firstName,
      lastName,
      email,
      subject,
      languagePreference,
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
    
    // Log the submission for manual processing if there's an error
    try {
      const body = await request.json();
      console.log('Contact form submission (error occurred):', {
        ...body,
        message: body.message ? body.message.substring(0, 100) + '...' : '', // Truncate for logging
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Could not log form data:', logError);
    }
    
    return NextResponse.json(
      { error: 'Failed to process form submission. Please try again later.' },
      { status: 500 }
    );
  }
} 