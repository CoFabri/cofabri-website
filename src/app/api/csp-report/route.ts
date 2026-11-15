import { NextResponse } from 'next/server';
import { allowCspReport, readBodyCapped, summarizeCspReports } from '@/lib/csp-report';
import { clientIp } from '@/lib/preview-login-limiter';

// Receives Content-Security-Policy(-Report-Only) violation reports (see
// next.config.js) and logs a short, bounded summary so the policy can be
// checked against real traffic before it is enforced. Nothing is stored.
// The endpoint is public, so the body is read with a hard byte cap (never
// buffered whole), only report content types are accepted, and each client
// IP gets a small per-instance budget.

const MAX_BODY_BYTES = 16 * 1024;
const REPORT_TYPES = ['application/csp-report', 'application/reports+json', 'application/json'];

export async function POST(request: Request) {
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!REPORT_TYPES.includes(type)) return new NextResponse(null, { status: 415 });

  if (!allowCspReport(clientIp(request), Date.now())) return new NextResponse(null, { status: 429 });

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });

  const text = await readBodyCapped(request, MAX_BODY_BYTES);
  if (text === null) return new NextResponse(null, { status: 413 });

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  for (const report of summarizeCspReports(payload)) {
    console.warn('[csp-report]', JSON.stringify(report));
  }
  return new NextResponse(null, { status: 204 });
}
