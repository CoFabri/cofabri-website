import { NextResponse } from 'next/server';
import { getMarketingPopupConfig } from '@/lib/api-client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await getMarketingPopupConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching marketing popup config:', error);
    return NextResponse.json(null);
  }
} 