import { getSystemStatus } from '@/lib/airtable';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const status = await getSystemStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching system status:', error);
    return NextResponse.json({ error: 'Failed to fetch system status' }, { status: 500 });
  }
} 