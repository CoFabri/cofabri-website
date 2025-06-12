import { NextResponse } from 'next/server';
import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN }).base(process.env.AIRTABLE_BASE_ID!);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { firstName, lastName, email, appId, interestLevel, quote, statement } = data;

    // Create record in Waitlist table
    const waitlistRecord = await base('Waitlist').create([
      {
        fields: {
          'First Name': firstName,
          'Last Name': lastName,
          Email: email,
          App: appId ? [appId] : [],
          'Interest Level': Number(interestLevel) || 0,
          Quote: quote || 0,
          Status: 'New'
        },
      },
    ]);

    // If there's a statement, create a record in Beta Statements table
    if (statement) {
      await base('Beta Statements').create([
        {
          fields: {
            Statement: statement,
            'App Link': appId ? [appId] : [],
            'Waitlist Record': [waitlistRecord[0].id],
          },
        },
      ]);
    }

    return NextResponse.json({ success: true, waitlistRecord });
  } catch (error) {
    console.error('Error creating Airtable record:', error);
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 }
    );
  }
} 