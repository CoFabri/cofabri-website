import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const AIRTABLE_API_KEY = process.env.AIRTABLE_SUPPORT_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_SUPPORT_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_SUPPORT_TABLE_NAME || 'Ticket Submissions';
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

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
    
    // Parse applications array
    const applicationsArray: string[] = applications ? JSON.parse(applications) : [];
    
    // Convert app IDs to app names for the support base
    let applicationNames: string[] = [];
    if (applicationsArray.length > 0) {
      try {
        // Fetch app names from the main apps API
        const appsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/apps`);
        if (appsResponse.ok) {
          const apps = await appsResponse.json();
          applicationNames = applicationsArray
            .map((appId: string) => {
              const app = apps.find((a: any) => a.id === appId);
              return app ? app.name : appId; // Fallback to ID if app not found
            })
            .filter(name => name);
        }
      } catch (error) {
        console.error('Failed to fetch app names:', error);
        // Fallback to using the IDs as strings
        applicationNames = applicationsArray;
      }
    }

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
      console.error('Airtable support credentials not configured - API Key or Base ID missing');
      return NextResponse.json(
        { error: 'Support form service temporarily unavailable' },
        { status: 503 }
      );
    }

    console.log('Using Airtable configuration:', {
      baseId: AIRTABLE_BASE_ID,
      tableName: AIRTABLE_TABLE_NAME,
      hasApiKey: !!AIRTABLE_API_KEY
    });

    // Handle file uploads if any
    const screenshots = formData.getAll('screenshots') as File[];
    let screenshotAttachments: Array<{url: string, filename: string}> = [];

    if (screenshots.length > 0) {
      console.log('Screenshots received:', screenshots.map(file => file.name));
      
      // Upload files to Vercel Blob
      for (const file of screenshots) {
        try {
          // Check file size (limit to 10MB per file)
          if (file.size > 10 * 1024 * 1024) {
            console.warn(`File ${file.name} is too large (${file.size} bytes), skipping`);
            continue;
          }
          
          // Validate file type
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
          if (!allowedTypes.includes(file.type)) {
            console.warn(`File ${file.name} has unsupported type: ${file.type}, skipping`);
            continue;
          }
          
          // Upload to Vercel Blob
          const blob = await put(file.name, file, {
            access: 'public',
            addRandomSuffix: true
          });
          
          screenshotAttachments.push({
            url: blob.url,
            filename: file.name
          });
          
          console.log(`Successfully uploaded ${file.name} to Vercel Blob: ${blob.url}`);
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
        }
      }
    }

    // Create record in Airtable Support Tickets table
    const airtableData = {
      fields: {
        'First Name': firstName,
        'Last Name': lastName,
        'Language Preference': languagePreference || 'English',
        'Company/Organization': companyOrganization || '',
        'Preferred Contact Method': preferredContactMethod === 'email' ? 'Email' : 
                                   preferredContactMethod === 'phone' ? 'Phone' : 
                                   preferredContactMethod === 'any' ? 'Any' : preferredContactMethod,
        'Email': email,
        'Phone': phone,
        'Application(s)': applicationNames.length > 0 ? applicationNames.join(', ') : '',
        'Subject': subject === 'support' ? 'Support/Help' : 
                  subject === 'feature' ? 'Feature Request' : subject,
        'Description': description,
        'Screenshots': screenshotAttachments
      }
    };

    const response = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
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
          phone,
          subject,
          languagePreference,
          applications: applicationsArray,
          applicationNames
        }
      });
      
      // Log the submission for manual processing if Airtable fails
      console.log('Support form submission (Airtable failed):', {
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
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('Support form submission saved to Airtable:', {
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
