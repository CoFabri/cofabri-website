import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if critical environment variables are set
    const envCheck = {
      hasAirtableToken: !!process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
      hasAirtableBaseId: !!process.env.AIRTABLE_BASE_ID,
      airtableTokenLength: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN?.length || 0,
      airtableBaseIdLength: process.env.AIRTABLE_BASE_ID?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      // Don't expose the actual values for security
    };

    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: 'Environment variables check completed'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 