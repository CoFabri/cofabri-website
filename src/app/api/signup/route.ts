import { NextResponse } from 'next/server';
import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN }).base(process.env.AIRTABLE_BASE_ID!);

interface AirtableError {
  error?: {
    type?: string;
    message?: string;
    status?: number;
  };
  name?: string;
  message?: string;
  stack?: string;
  details?: string;
}

export async function POST(request: Request) {
  try {
    console.log('Received signup request');
    const data = await request.json();
    console.log('Parsed request data:', { ...data, email: '[REDACTED]' });
    
    const { firstName, lastName, email, appId, interestLevel, quote, statement } = data;

    console.log('Attempting to create waitlist record');
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
    console.log('Successfully created waitlist record:', waitlistRecord[0].id);

    // If there's a statement, create a record in Beta Statements table
    if (statement) {
      console.log('Creating beta statement record');
      await base('Beta Statements').create([
        {
          fields: {
            Statement: statement,
            'App Link': appId ? [appId] : [],
            'Waitlist Record': [waitlistRecord[0].id],
          },
        },
      ]);
      console.log('Successfully created beta statement record');
    }

    return NextResponse.json({ success: true, waitlistRecord });
  } catch (error: unknown) {
    const err = error as AirtableError;
    console.error('Detailed error in signup route:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      details: err.details || 'No additional details available'
    });
    
    // Log specific Airtable errors if they exist
    if (err.error) {
      console.error('Airtable specific error:', {
        type: err.error.type,
        message: err.error.message,
        status: err.error.status
      });
    }

    return NextResponse.json(
      { error: 'Failed to create record', details: err.message },
      { status: 500 }
    );
  }
} 