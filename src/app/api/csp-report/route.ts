import { NextResponse } from 'next/server';
import { summarizeCspReports } from '@/lib/csp-report';

// Receives Content-Security-Policy(-Report-Only) violation reports (see
// next.config.js) and logs a short, bounded summary so the policy can be
// checked against real traffic before it is enforced. Nothing is stored.

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });

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
