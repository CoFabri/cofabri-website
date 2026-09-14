// src/app/developers/callback/route.ts
//
// Receives the redirect from cofabri-api's hosted sign-in
// (getDeveloperPortalSigninUrl()) once cofabri-website is provisioned with
// apps.login_redirect_url pointing here. Stores the access token in an
// httpOnly cookie scoped to /developers and sends the visitor on to the
// portal itself -- this route never renders anything of its own.

import { NextRequest, NextResponse } from 'next/server';
import { DEVELOPER_PORTAL_SESSION_COOKIE, DEVELOPER_PORTAL_COOKIE_OPTIONS } from '@/lib/developer-portal/session';

export async function GET(request: NextRequest) {
  const accessToken = request.nextUrl.searchParams.get('access_token');
  const response = NextResponse.redirect(new URL('/developers', request.url));

  if (accessToken) {
    response.cookies.set(DEVELOPER_PORTAL_SESSION_COOKIE, accessToken, DEVELOPER_PORTAL_COOKIE_OPTIONS);
  }

  return response;
}
