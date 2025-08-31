import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email } = await request.json();

    const AIRTABLE_API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = 'tbl36OYIDaueIYD4I';

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      throw new Error('Airtable configuration missing');
    }

    // First, check if the email already exists
    const checkResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula={Email}="${encodeURIComponent(email)}"`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!checkResponse.ok) {
      throw new Error('Failed to check existing subscribers');
    }

    const checkData = await checkResponse.json();
    if (checkData.records && checkData.records.length > 0) {
      return NextResponse.json(
        { error: 'This email is already subscribed' },
        { status: 400 }
      );
    }
    
    // If email doesn't exist, create new record
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                'Email': email,
                'First Name': firstName,
                'Last Name': lastName,
                'Source': 'Website',
                'Email Verification': 'Unverified'
              }
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Airtable API Error:', error);
      
      if (response.status === 404) {
        throw new Error('Airtable table not found. Please check the table ID.');
      } else if (response.status === 403) {
        throw new Error('Airtable API key does not have permission to access this base.');
      } else {
        throw new Error(error.error?.message || 'Failed to create record in Airtable');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process signup' },
      { status: 500 }
    );
  }
} 