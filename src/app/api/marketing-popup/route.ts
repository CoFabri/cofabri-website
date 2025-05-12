import { NextResponse } from 'next/server';
import { getMarketingPopupConfig } from '@/lib/airtable';

export async function GET(request: Request) {
  try {
    const config = await getMarketingPopupConfig({ signal: request.signal });
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching marketing popup config:', error);
    return NextResponse.json(null);
  }
} 