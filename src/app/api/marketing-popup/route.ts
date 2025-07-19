import { NextResponse } from 'next/server';
import { getMarketingPopupConfig } from '@/lib/airtable';
import { headers } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Only pass signal if it's a valid AbortSignal instance
    const options = request.signal instanceof AbortSignal ? { signal: request.signal } : {};
    const config = await getMarketingPopupConfig(options);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching marketing popup config:', error);
    return NextResponse.json(null);
  }
} 