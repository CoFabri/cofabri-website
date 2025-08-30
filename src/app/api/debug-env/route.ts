import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? 'SET' : 'NOT SET',
    turnstileSiteKeyLength: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.length || 0,
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ? 'SET' : 'NOT SET',
    allNextPublicVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')),
    timestamp: new Date().toISOString()
  });
}
