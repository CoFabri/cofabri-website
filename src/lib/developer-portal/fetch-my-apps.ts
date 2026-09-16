// src/lib/developer-portal/fetch-my-apps.ts

import { cache } from 'react';
import type { DeveloperPortalApp } from './types';

const COFABRI_API_BASE_URL = process.env.COFABRI_API_BASE_URL;

export type MyAppsResult =
  | { ok: true; apps: DeveloperPortalApp[] }
  | { ok: false };

interface AccountAppsApiResponse {
  success: boolean;
  apps: Array<{
    app_id: string;
    app_name: string;
    logo_url: string | null;
    favicon_url: string | null;
    app_url: string | null;
    description: string | null;
    api_docs_url: string | null;
    // GET /web/api/account/apps lists every publicly-visible app plus the
    // ones this identity actually has an account on (see cofabri-api's
    // LinkedAppsService.getLinkedAndAvailableApps) -- /developers only
    // wants the latter, same as the old per-app /web/api/my-apps did.
    linked: boolean;
  }>;
}

function mapApp(row: AccountAppsApiResponse['apps'][number]): DeveloperPortalApp {
  return {
    appId: row.app_id,
    appName: row.app_name,
    logoUrl: row.logo_url,
    faviconUrl: row.favicon_url,
    appUrl: row.app_url,
    description: row.description,
    apiDocsUrl: row.api_docs_url,
  };
}

// React cache() dedupes this within a single request -- both AccessStat and
// AppGrid call it, but cofabri-api only sees one request per page load.
//
// `accessToken` here is the raw cofabri_session cookie value (see
// session.ts) forwarded as a Cookie header -- this site never verifies it,
// cofabri-api's GET /web/api/account/apps does (authenticateCentralSession)
// and 401s if it's missing/invalid/expired, which this treats the same as
// "not signed in" (the page already only calls this once it has a cookie
// value at all; an expired one still needs to fail gracefully here).
export const fetchMyApps = cache(async (accessToken: string): Promise<MyAppsResult> => {
  if (!COFABRI_API_BASE_URL) {
    return { ok: false };
  }

  try {
    const res = await fetch(`${COFABRI_API_BASE_URL}/web/api/account/apps`, {
      headers: { Cookie: `cofabri_session=${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      return { ok: false };
    }
    const data = (await res.json()) as AccountAppsApiResponse;
    return { ok: true, apps: data.apps.filter((row) => row.linked).map(mapApp) };
  } catch {
    return { ok: false };
  }
});
