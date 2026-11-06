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

// Apps whose spec is not at the default /openapi.json. Keyed by the app id.
export const SPEC_PATH_OVERRIDES: Record<string, string> = {
  'maven-os': '/api/v2/openapi.json',
};

const DEFAULT_SPEC_PATH = '/openapi.json';

// A relative servers[0].url (e.g. "/") would render as a non-absolute base URL;
// resolve it against the app origin. Absolute urls are left untouched.
function withAbsoluteServer(spec: OpenApiDocument, origin: string): OpenApiDocument {
  const first = spec.servers?.[0];
  if (!first || typeof first.url !== 'string') return spec;
  try {
    new URL(first.url);
    return spec;
  } catch {
    // relative; resolve below
  }
  try {
    const resolved = new URL(first.url, `${origin}/`).toString();
    return { ...spec, servers: [{ ...first, url: resolved }, ...(spec.servers?.slice(1) ?? [])] };
  } catch {
    return spec;
  }
}

export async function fetchAppSpec(
  appUrl: string | undefined,
  appId?: string,
): Promise<AppSpecResult | AppSpecFailure> {
  if (!appUrl) return { ok: false, reason: 'no-spec' };
  const origin = originFor(appUrl);
  if (!origin) return { ok: false, reason: 'no-spec' };

  const specUrl = `${origin}${(appId && SPEC_PATH_OVERRIDES[appId]) || DEFAULT_SPEC_PATH}`;
  const llmsTxtUrl = `${origin}/llms.txt`;

  try {
    const res = await fetch(specUrl, { next: { revalidate: 300 } });
    if (!res.ok) return { ok: false, reason: res.status >= 500 ? 'unreachable' : 'no-spec' };
    const spec = (await res.json()) as OpenApiDocument;
    if (!spec || typeof spec !== 'object' || !spec.paths) return { ok: false, reason: 'no-spec' };
    return { ok: true, spec: withAbsoluteServer(spec, origin), specUrl, llmsTxtUrl };
  } catch (error) {
    // res.json() on an HTML 200 (e.g. an app's catch-all page) throws a SyntaxError:
    // that's an app with no spec, not an outage. Anything else (fetch/network) is unreachable.
    return { ok: false, reason: error instanceof SyntaxError ? 'no-spec' : 'unreachable' };
  }
}
