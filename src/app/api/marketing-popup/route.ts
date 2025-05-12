import { NextResponse } from 'next/server';
import { getMarketingPopupConfig } from '@/lib/airtable';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  // During static page generation, return null
  if (process.env.NODE_ENV === 'production' && headers().get('x-nextjs-data') === '1') {
    return NextResponse.json(null);
  }

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