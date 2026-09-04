'use server';

import { cookies } from 'next/headers';

export async function setAnalyticsConsent(value: 'accepted' | 'denied') {
  (await cookies()).set('analytics-consent', value, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}
