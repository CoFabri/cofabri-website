import { NextResponse } from 'next/server';

interface ApiError {
  message?: string;
  stack?: string;
  details?: string;
}

export async function POST(request: Request) {
  try {
    console.log('Received signup request');
    const data = await request.json();
    console.log('Parsed request data:', { ...data, email: '[REDACTED]' });

    const { firstName, lastName, email, appId, interestLevel } = data;

    if (!process.env.COFABRI_API_BASE_URL || !process.env.COFABRI_API_KEY) {
      throw new Error('cofabri-api configuration missing');
    }

    console.log('Attempting to create waitlist record');
    // Submit to cofabri-api, which persists the waitlist signup in Supabase.
    // Note: 'quote' and 'statement' are collected by this form but cofabri-api's
    // /web/forms/waitlist endpoint does not currently accept or persist them.
    const apiRes = await fetch(`${process.env.COFABRI_API_BASE_URL}/web/forms/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.COFABRI_API_KEY}`,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        app_id: appId || undefined,
        interest_level: Number(interestLevel) || undefined,
      }),
    });

    if (!apiRes.ok) {
      const errorBody = await apiRes.json().catch(() => null);
      console.error('cofabri-api waitlist submission failed:', apiRes.status, errorBody);
      return NextResponse.json(
        { error: 'Failed to create record' },
        { status: 502 }
      );
    }

    const waitlistRecord = await apiRes.json();
    console.log('Successfully created waitlist record:', waitlistRecord.id);

    return NextResponse.json({ success: true, waitlistRecord });
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error('Detailed error in signup route:', {
      message: err.message,
      stack: err.stack,
      details: err.details || 'No additional details available'
    });

    return NextResponse.json(
      { error: 'Failed to create record', details: err.message },
      { status: 500 }
    );
  }
}
