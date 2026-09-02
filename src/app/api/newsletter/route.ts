import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email } = await request.json();

    if (!process.env.COFABRI_API_BASE_URL || !process.env.COFABRI_API_KEY) {
      throw new Error('cofabri-api configuration missing');
    }

    // Submit to cofabri-api, which handles the duplicate-email check and the
    // signup write in Supabase (returns 200 if already subscribed, 201 if new).
    const apiRes = await fetch(`${process.env.COFABRI_API_BASE_URL}/web/forms/newsletter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.COFABRI_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    if (!apiRes.ok) {
      const errorBody = await apiRes.json().catch(() => null);
      console.error('cofabri-api newsletter submission failed:', apiRes.status, errorBody);
      throw new Error('Failed to process signup');
    }

    const result = await apiRes.json();

    if (result.already_subscribed) {
      return NextResponse.json(
        { error: 'This email is already subscribed' },
        { status: 400 }
      );
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
