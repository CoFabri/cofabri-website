import { NextResponse, type NextRequest } from 'next/server';
import { getApiHealth } from '@/lib/api-health';
import {
  BACKSTOP_HEADER,
  BACKSTOP_NOTE_HEADER,
  BACKSTOP_PATH,
  BACKSTOP_STATE_HEADER,
  isBackstopPreviewRequested,
  isPreviewAllowed,
  previewOptions,
  type BackstopInitialState,
  type BackstopMode,
} from '@/lib/backstop';

// Files served as-is that other sites and crawlers fetch directly; a 503 HTML
// page here would break embeds (status widgets) and SEO files.
const STATIC_ASSET = /\.(?:png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|otf|js|css|json|txt|xml|map|webmanifest|html)$/i;

// A stricter safety net than the matcher in middleware.ts (which excludes only
// api/, api exactly, _next/static, _next/image and favicon.ico): this also
// covers every other /_next/* path, such as /_next/data/... and
// /_next/webpack-hmr, so the handler is safe on its own.
const INTERNAL_PATH = /^\/(?:api|_next)(?:\/|$)/;

const BACKSTOP_HEADERS = [BACKSTOP_HEADER, BACKSTOP_STATE_HEADER, BACKSTOP_NOTE_HEADER];

// The layout trusts these request headers to switch into backstop mode, so a
// client-supplied copy must never reach it. Call this on every passthrough.
export function stripBackstopHeaders(headers: Headers): Headers {
  const cleaned = new Headers(headers);
  for (const name of BACKSTOP_HEADERS) cleaned.delete(name);
  return cleaned;
}

function rewriteToBackstop(
  request: NextRequest,
  mode: BackstopMode,
  status: number,
  options: { state: BackstopInitialState; note: boolean } = { state: 'idle', note: false },
): NextResponse {
  const headers = stripBackstopHeaders(request.headers);
  headers.set(BACKSTOP_HEADER, mode);
  headers.set(BACKSTOP_STATE_HEADER, options.state);
  headers.set(BACKSTOP_NOTE_HEADER, options.note ? '1' : '0');

  const response = NextResponse.rewrite(new URL(BACKSTOP_PATH, request.url), { status, request: { headers } });
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex');
  if (mode === 'outage') response.headers.set('Retry-After', '30');
  return response;
}

// Returns a response when this request should be handled by the backstop
// (outage, preview, or a direct /backstop visit), or null to carry on with the
// normal middleware. Fails open: any error here returns null.
export async function handleBackstop(request: NextRequest): Promise<NextResponse | null> {
  try {
    const { pathname, searchParams } = request.nextUrl;
    if (INTERNAL_PATH.test(pathname) || STATIC_ASSET.test(pathname)) return null;

    if (
      isBackstopPreviewRequested(searchParams) &&
      isPreviewAllowed(searchParams, {
        vercelEnv: process.env.VERCEL_ENV,
        previewPassword: process.env.PREVIEW_PASSWORD,
      })
    ) {
      return rewriteToBackstop(request, 'preview', 200, previewOptions(searchParams));
    }

    if (pathname.toLowerCase() === BACKSTOP_PATH) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // During an outage the backstop takes precedence over the site's other
    // middleware behavior (/privacy and KB redirects, legal normalization, the
    // /preview/* gate) by design: it replaces every page.
    if ((await getApiHealth()) === 'down') {
      return rewriteToBackstop(request, 'outage', 503);
    }

    return null;
  } catch (error) {
    console.error('Backstop handling failed; continuing normally:', error);
    return null;
  }
}
