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

