// src/lib/api-client.ts
const COFABRI_API_BASE_URL = process.env.COFABRI_API_BASE_URL;

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${COFABRI_API_BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`cofabri-api error on ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface App {
  id: string;
  name: string;
  description?: string;
  url?: string;
  screenshot?: string;
  faviconUrl?: string;
  status: string;
  category?: string;
  feature1?: string;
  feature2?: string;
  feature3?: string;
  launchDate?: string;
  releaseDate?: string;
  domains?: string;
  featureOnWebsite?: boolean;
}

interface AppRow {
  app_id: string;
  app_name: string;
  high_level_description: string | null;
  app_url: string | null;
  screenshot_url: string | null;
  favicon_url: string | null;
  lifecycle_stage: string | null;
  category: string | null;
  feature_1: string | null;
  feature_2: string | null;
  feature_3: string | null;
  launch_date: string | null;
  latest_release_date: string | null;
  featured_app: boolean;
  beta_statements?: unknown[];
}

function mapApp(row: AppRow): App {
  return {
    id: row.app_id,
    name: row.app_name,
    description: row.high_level_description || 'No description available',
    url: row.app_url || undefined,
    screenshot: row.screenshot_url || '/images/placeholder.jpg',
    faviconUrl: row.favicon_url || undefined,
    status: row.lifecycle_stage || 'Live',
    category: row.category || undefined,
    feature1: row.feature_1 || undefined,
    feature2: row.feature_2 || undefined,
    feature3: row.feature_3 || undefined,
    launchDate: row.launch_date || undefined,
    releaseDate: row.latest_release_date || undefined,
    domains: undefined,
    featureOnWebsite: row.featured_app,
  };
}

export async function getApps(): Promise<App[]> {
  try {
    const rows = await apiFetch<AppRow[]>('/web/content/apps');
    return rows.map(mapApp);
  } catch (error) {
    console.error('Error fetching apps:', error);
    return [];
  }
}

export async function getApp(appId: string): Promise<App | null> {
  try {
    const row = await apiFetch<AppRow>(`/web/content/apps/${encodeURIComponent(appId)}`);
    return mapApp(row);
  } catch (error) {
    console.error(`Error fetching app ${appId}:`, error);
    return null;
  }
}
