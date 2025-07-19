import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Create response
  let response = NextResponse.next();

  // Add no-cache headers for all routes
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // Only apply to preview routes
  if (request.nextUrl.pathname.startsWith('/preview/')) {
    const previewPassword = request.nextUrl.searchParams.get('password');
    const expectedPassword = process.env.PREVIEW_PASSWORD;

    // If no password is set in env, allow access
    if (!expectedPassword) {
      return response;
    }

    // If password doesn't match, redirect to preview login
    if (previewPassword !== expectedPassword) {
      const loginUrl = new URL('/preview/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 