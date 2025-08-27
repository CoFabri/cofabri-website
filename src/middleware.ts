import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Handle redirects for 404 errors found in Google Search Console
  if (pathname === '/privacy') {
    return NextResponse.redirect(new URL('/legal', request.url));
  }

  // Redirect missing knowledge base articles to the main knowledge base page
  if (pathname.startsWith('/knowledge-base/')) {
    const slug = pathname.replace('/knowledge-base/', '');
    
    // List of known missing articles that should redirect to main KB page
    const missingArticles = [
      'faq',
      'getting-started', 
      'api-docs',
      'troubleshooting'
    ];

    // If it's a known missing article, redirect to main KB page
    if (missingArticles.includes(slug)) {
      return NextResponse.redirect(new URL('/knowledge-base', request.url));
    }
  }

  // Handle duplicate content issues with legal documents
  if (pathname === '/legal' && searchParams.has('document')) {
    const documentName = searchParams.get('document');
    
    if (documentName) {
      // Normalize URL encoding to prevent duplicates
      const normalizedDocumentName = documentName
        .replace(/\s+/g, '+')
        .replace(/%20/g, '+')
        .replace(/%2B/g, '+');
      
      // If the document name is different from normalized version, redirect
      if (documentName !== normalizedDocumentName) {
        const newUrl = new URL(request.url);
        newUrl.searchParams.set('document', normalizedDocumentName);
        return NextResponse.redirect(newUrl);
      }
    }
  }

  // Block access to preview routes without proper authentication
  if (pathname.startsWith('/preview/') && !pathname.startsWith('/preview/login')) {
    // Check if this is a preview route with Airtable record ID
    if (pathname.includes('/rec')) {
      // Return 404 for preview routes with record IDs to prevent indexing
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  // Create response
  let response = NextResponse.next();

  // Only apply to preview routes (excluding login page)
  if (request.nextUrl.pathname.startsWith('/preview/') && !request.nextUrl.pathname.startsWith('/preview/login')) {
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