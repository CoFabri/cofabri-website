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

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  slug: string;
  author: string;
  readTime: number;
  publishedAt: string;
  lastUpdated?: string;
  isPopular?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  applications?: string[];
  logoUrl?: string;
  relatedTopics?: string[] | string;
}

interface KbArticleRow {
  id: string;
  article_title: string;
  article_content: string | null;
  excerpt: string | null;
  category: string;
  site_url_slug: string | null;
  author_name: string | null;
  read_time: number | null;
  last_updated: string | null;
  is_popular: boolean | null;
  is_featured: boolean | null;
  tags: string[] | null;
  logo_url: string | null;
  application_names?: string[];
  related_topic_slugs?: string[];
}

function mapKbArticle(row: KbArticleRow): KnowledgeBaseArticle {
  return {
    id: row.id,
    title: row.article_title,
    content: row.article_content || '',
    excerpt: row.excerpt || undefined,
    category: row.category,
    slug: row.site_url_slug || row.id,
    author: row.author_name || '',
    readTime: row.read_time || 0,
    publishedAt: row.last_updated || '',
    lastUpdated: row.last_updated || undefined,
    isPopular: row.is_popular || undefined,
    isFeatured: row.is_featured || undefined,
    tags: row.tags || [],
    applications: row.application_names || [],
    logoUrl: row.logo_url || undefined,
    relatedTopics: row.related_topic_slugs,
  };
}

export async function getKnowledgeBaseArticles(): Promise<KnowledgeBaseArticle[]> {
  try {
    const rows = await apiFetch<KbArticleRow[]>('/web/content/knowledge-base');
    return rows.map(mapKbArticle);
  } catch (error) {
    console.error('Error fetching knowledge base articles:', error);
    return [];
  }
}

export async function getKnowledgeBaseArticle(slug: string): Promise<KnowledgeBaseArticle | null> {
  try {
    const row = await apiFetch<KbArticleRow>(`/web/content/knowledge-base/${encodeURIComponent(slug)}`);
    return mapKbArticle(row);
  } catch (error) {
    console.error('Error fetching knowledge base article:', error);
    return null;
  }
}

export async function getKnowledgeBaseArticlesBySlugs(slugs: string[]): Promise<KnowledgeBaseArticle[]> {
  if (slugs.length === 0) return [];
  const all = await getKnowledgeBaseArticles();
  const slugSet = new Set(slugs);
  return all.filter((article) => slugSet.has(article.slug));
}

export async function getFeaturedKnowledgeBaseArticles(): Promise<KnowledgeBaseArticle[]> {
  try {
    const rows = await apiFetch<KbArticleRow[]>('/web/content/knowledge-base?featured=true');
    return rows.slice(0, 6).map(mapKbArticle);
  } catch (error) {
    console.error('Error fetching featured knowledge base articles:', error);
    return [];
  }
}

export interface RoadmapFeature {
  id: string;
  name: string;
  description: string;
  status: string;
  milestone: string;
  releaseType: string;
  releasedDate?: string;
  application?: string;
  applicationUrl?: string;
  featuresAndChanges?: string;
  releaseNotes?: string;
}

interface RoadmapRow {
  id: string;
  roadmap_item_name: string;
  description: string | null;
  status: string;
  target_quarter: string | null;
  target_date: string | null;
  app_id: string | null;
}

function mapRoadmapItem(row: RoadmapRow): RoadmapFeature {
  return {
    id: row.id,
    name: row.roadmap_item_name,
    description: row.description || '',
    status: row.status,
    milestone: row.target_quarter || '',
    releaseType: '',
    releasedDate: row.target_date || undefined,
    application: row.app_id || undefined,
    applicationUrl: undefined,
    featuresAndChanges: undefined,
    releaseNotes: undefined,
  };
}

export async function getRoadmapFeatures(): Promise<RoadmapFeature[]> {
  try {
    const rows = await apiFetch<RoadmapRow[]>('/web/content/roadmap');
    return rows.map(mapRoadmapItem);
  } catch (error) {
    console.error('Error fetching roadmap features:', error);
    return [];
  }
}
