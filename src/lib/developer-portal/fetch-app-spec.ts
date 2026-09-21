// src/lib/developer-portal/fetch-app-spec.ts
//
// Fetches a linked app's own /openapi.json and /llms.txt, live, from its own
// domain -- the source of truth stays in that app's repo, generated from its
// real route code (see e.g. rx-bridge's lib/openapi/build-spec.ts). This site
// never stores or hand-maintains a copy; it just renders whatever the app is
// currently publishing. A 5-minute revalidate window (matching this repo's
// other cofabri-api reads) keeps every app from being hit on every request
// without going stale for long if a spec changes.

import type { OpenApiDocument } from './openapi-types';

export interface AppSpecResult {
  ok: true;
  spec: OpenApiDocument;
  specUrl: string;
  llmsTxtUrl: string;
}

// `no-spec`: the app has no usable /openapi.json (no URL, 404, or not an OpenAPI
// document) -- i.e. it genuinely doesn't publish docs. `unreachable`: we couldn't
// tell (network error or a 5xx), so the page shouldn't claim the app has no docs.
export type AppSpecFailureReason = 'no-spec' | 'unreachable';

export interface AppSpecFailure {
  ok: false;
  reason: AppSpecFailureReason;
}

function originFor(appUrl: string): string | null {
  try {
    return new URL(appUrl).origin;
  } catch {
    return null;
  }
}

export async function fetchAppSpec(appUrl: string | undefined): Promise<AppSpecResult | AppSpecFailure> {
  if (!appUrl) return { ok: false, reason: 'no-spec' };
  const origin = originFor(appUrl);
  if (!origin) return { ok: false, reason: 'no-spec' };

  const specUrl = `${origin}/openapi.json`;
  const llmsTxtUrl = `${origin}/llms.txt`;

  try {
    const res = await fetch(specUrl, { next: { revalidate: 300 } });
    if (!res.ok) return { ok: false, reason: res.status >= 500 ? 'unreachable' : 'no-spec' };
    const spec = (await res.json()) as OpenApiDocument;
    if (!spec || typeof spec !== 'object' || !spec.paths) return { ok: false, reason: 'no-spec' };
    return { ok: true, spec, specUrl, llmsTxtUrl };
  } catch (error) {
    // res.json() on an HTML 200 (e.g. an app's catch-all page) throws a SyntaxError:
    // that's an app with no spec, not an outage. Anything else (fetch/network) is unreachable.
    return { ok: false, reason: error instanceof SyntaxError ? 'no-spec' : 'unreachable' };
  }
}
