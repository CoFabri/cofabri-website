// src/lib/developer-portal/session.ts
//
// Session handling scoped to /developers only -- cofabri-website has no
// site-wide auth/session of its own today. This cookie is set exclusively
// by /developers/callback and read only here.

import { cookies } from 'next/headers';

export const DEVELOPER_PORTAL_APP_ID = 'cofabri-website';
export const DEVELOPER_PORTAL_SESSION_COOKIE = 'dev_portal_at';

// Matches a typical Supabase access-token lifetime. There's no refresh
// flow here -- once this expires, /developers just falls back to the
// signed-out state and the person signs in again.
const SESSION_MAX_AGE_SECONDS = 60 * 60;

export const DEVELOPER_PORTAL_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/developers',
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export async function getDeveloperPortalAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(DEVELOPER_PORTAL_SESSION_COOKIE)?.value ?? null;
}
