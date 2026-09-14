// src/lib/developer-portal/fetch-my-apps.ts

import { cache } from 'react';
import type { DeveloperPortalApp } from './types';

const COFABRI_API_BASE_URL = process.env.COFABRI_API_BASE_URL;

export type MyAppsResult =
  | { ok: true; apps: DeveloperPortalApp[] }
  | { ok: false };

interface MyAppsApiResponse {
  success: boolean;
  apps: Array<{
    app_id: string;
    app_name: string;
    logo_url: string | null;
    favicon_url: string | null;
    app_url: string | null;
    description: string | null;
    api_docs_url: string | null;
  }>;
}

function mapApp(row: MyAppsApiResponse['apps'][number]): DeveloperPortalApp {
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
export const fetchMyApps = cache(async (accessToken: string): Promise<MyAppsResult> => {
  if (!COFABRI_API_BASE_URL) {
    return { ok: false };
  }

  try {
    const res = await fetch(`${COFABRI_API_BASE_URL}/web/api/my-apps`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      return { ok: false };
    }
    const data = (await res.json()) as MyAppsApiResponse;
    return { ok: true, apps: data.apps.map(mapApp) };
  } catch {
    return { ok: false };
  }
});
