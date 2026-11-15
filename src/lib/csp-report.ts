// Bounded summary of CSP violation reports (see /api/csp-report).

const MAX_REPORTS = 10;
const MAX_FIELD = 300;

type Fields = Record<string, unknown>;

function field(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  return String(value).slice(0, MAX_FIELD);
}

// Drop query strings and fragments: they can carry visitor data.
function urlField(value: unknown): string | undefined {
  const text = field(value);
  if (!text) return text;
  return text.split(/[?#]/)[0];
}

export function summarizeCspReports(payload: unknown): Fields[] {
  // report-uri sends { "csp-report": {...} }; the Reporting API sends
  // [{ type: "csp-violation", body: {...} }, ...].
  const raw: unknown[] = Array.isArray(payload)
    ? payload.map((entry) => (entry as Fields | null)?.body)
    : [(payload as Fields | null)?.['csp-report']];

  return raw
    .filter((body): body is Fields => typeof body === 'object' && body !== null)
    .slice(0, MAX_REPORTS)
    .map((body) => ({
      directive: field(body['effective-directive'] ?? body.effectiveDirective ?? body['violated-directive']),
      blocked: urlField(body['blocked-uri'] ?? body.blockedURL),
      page: urlField(body['document-uri'] ?? body.documentURL),
      source: urlField(body['source-file'] ?? body.sourceFile),
      disposition: field(body.disposition),
    }));
}


/**
 * Reads the request body chunk by chunk and gives up (returning null) as
 * soon as more than maxBytes have arrived, so a chunked or mislabelled
 * request is never buffered whole.
 */
export async function readBodyCapped(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

// Per-instance, per-IP budget: browsers batch reports, so a real visitor
// sends a handful a minute at most.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_IP = 30;
const RATE_MAX_TRACKED_IPS = 5_000;
const rateWindows = new Map<string, { count: number; resetAt: number }>();

export function allowCspReport(ip: string, now: number): boolean {
  const entry = rateWindows.get(ip);
  if (!entry || entry.resetAt <= now) {
    if (rateWindows.size >= RATE_MAX_TRACKED_IPS) {
      for (const [key, value] of rateWindows) if (value.resetAt <= now) rateWindows.delete(key);
      // Still full of live entries: refuse rather than grow without bound.
      if (rateWindows.size >= RATE_MAX_TRACKED_IPS) return false;
    }
    rateWindows.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_MAX_PER_IP) return false;
  entry.count += 1;
  return true;
}

/** Test hook. */
export function resetCspReportLimiter(): void {
  rateWindows.clear();
}
