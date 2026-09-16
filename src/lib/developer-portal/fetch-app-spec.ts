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

export interface AppSpecFailure {
  ok: false;
}

function originFor(appUrl: string): string | null {
  try {
    return new URL(appUrl).origin;
  } catch {
    return null;
  }
}

export async function fetchAppSpec(appUrl: string | undefined): Promise<AppSpecResult | AppSpecFailure> {
  if (!appUrl) return { ok: false };
  const origin = originFor(appUrl);
  if (!origin) return { ok: false };

  const specUrl = `${origin}/openapi.json`;
  const llmsTxtUrl = `${origin}/llms.txt`;

  try {
    const res = await fetch(specUrl, { next: { revalidate: 300 } });
    if (!res.ok) return { ok: false };
    const spec = (await res.json()) as OpenApiDocument;
    if (!spec || typeof spec !== 'object' || !spec.paths) return { ok: false };
    return { ok: true, spec, specUrl, llmsTxtUrl };
  } catch {
    return { ok: false };
  }
}
