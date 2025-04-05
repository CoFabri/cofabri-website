import { NextResponse } from 'next/server';
import { getMarketingPopupConfig } from '@/lib/airtable';

export async function GET() {
  try {
    const config = await getMarketingPopupConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching marketing popup config:', error);
    return NextResponse.json(null);
  }
} 