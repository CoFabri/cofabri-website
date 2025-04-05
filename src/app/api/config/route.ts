import { NextResponse } from 'next/server';

export async function GET() {
  // Check if TEST_MODE is enabled in environment variables
  const testMode = process.env.TEST_MODE === 'true';
  
  return NextResponse.json({ testMode });
} 