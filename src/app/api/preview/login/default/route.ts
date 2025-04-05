import { NextResponse } from 'next/server';

export async function GET() {
  // Return default login preview content
  return NextResponse.json({
    id: 'default',
    type: 'login',
    WelcomeText: 'Welcome Back',
    Subtitle: 'Sign in to your account to continue',
    // Add any other default content you want to preview
  });
} 