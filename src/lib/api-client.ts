// src/lib/api-client.ts
const COFABRI_API_BASE_URL = process.env.COFABRI_API_BASE_URL;

async function apiFetch<T>(path: string): Promise<T> {
  if (!COFABRI_API_BASE_URL) {
    throw new Error('COFABRI_API_BASE_URL is not configured');
  }
  // 5-minute ISR window: CMS-driven marketing content doesn't need per-request
  // freshness, and this is what lets every page reading through this client
  // render statically/incrementally instead of force-dynamic on every request.
  const res = await fetch(`${COFABRI_API_BASE_URL}${path}`, { next: { revalidate: 300 } });
  if (!res.ok) {
    throw new Error(`cofabri-api error on ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface BetaStatement {
  statement: string;
  order: number;
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
  betaStatements?: BetaStatement[];
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
  // Only present on the single-app endpoint (getApp); the list endpoint
  // (getApps) never includes it.
  beta_statements?: BetaStatement[];
}

// The only values statusPillClasses/statusDotClasses (app-display.ts) and
// actionLabel/actionHref actually match against. lifecycle_stage is a free-text
// Supabase column with no CHECK constraint, so normalize casing/separators here
// rather than relying on admins to type an exact match -- a wrong-cased value
// silently fell through to an unstyled badge before this existed.
export const KNOWN_LIFECYCLE_STATUSES = ['Live', 'Active', 'Beta', 'In Development'];

function normalizeStatus(raw: string | null): string {
  const value = (raw ?? '').trim();
  if (!value) return 'Live';
  const normalized = value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const match = KNOWN_LIFECYCLE_STATUSES.find((s) => s.toLowerCase() === normalized);
  // Unrecognized values pass through as-is (still get the default badge style)
  // instead of being mangled, so a genuinely new status is easy to spot in the UI.
  return match ?? value;
}

function mapApp(row: AppRow): App {
  return {
    id: row.app_id,
    name: row.app_name,
    description: row.high_level_description || 'No description available',
    url: row.app_url || undefined,
    // No generic local placeholder fallback here: falling back to a fake
    // "screenshot" made the app detail page's real empty state (a plain
    // "product shot coming soon" panel) unreachable for every app, since
    // every app currently only has an auto-generated social-share banner
    // in Supabase, never a real product screenshot.
    screenshot: row.screenshot_url || undefined,
    faviconUrl: row.favicon_url || undefined,
    status: normalizeStatus(row.lifecycle_stage),
    category: row.category || undefined,
    feature1: row.feature_1 || undefined,
    feature2: row.feature_2 || undefined,
    feature3: row.feature_3 || undefined,
    launchDate: row.launch_date || undefined,
    releaseDate: row.latest_release_date || undefined,
    domains: undefined,
    featureOnWebsite: row.featured_app,
    betaStatements: row.beta_statements,
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

// kb_article_category enum values from Supabase, mapped to display labels.
const KB_CATEGORY_LABELS: Record<string, string> = {
  how_to_guide: 'How-To Guide',
  faq: 'FAQ',
  troubleshooting: 'Troubleshooting',
  release_notes: 'Release Notes',
  best_practices: 'Best Practices',
  other: 'Other',
  internal_reference: 'Internal Reference',
  brand_brief: 'Brand Brief',
};

function mapKbArticle(row: KbArticleRow): KnowledgeBaseArticle {
  return {
    id: row.id,
    title: row.article_title,
    content: row.article_content || '',
    excerpt: row.excerpt || undefined,
    category: KB_CATEGORY_LABELS[row.category] || row.category,
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
    return rows.map(mapKbArticle).slice(0, 6);
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

// Real values of the roadmap_item status enum in Supabase, mapped to the
// Title Case labels the UI (filters, badges) expects.
const ROADMAP_STATUS_MAP: Record<string, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  released: 'Released',
  delayed: 'Delayed',
  cancelled: 'Cancelled',
};

function mapRoadmapItem(row: RoadmapRow): RoadmapFeature {
  return {
    id: row.id,
    name: row.roadmap_item_name,
    description: row.description || '',
    status: ROADMAP_STATUS_MAP[row.status] || row.status,
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

export interface LegalDocument {
  id: string;
  title: string;
  description?: string;
  documentType: string;
  status: string;
  version: string;
  lastUpdated: string;
  documentUrl?: string;
  associatedApp?: string;
  category?: string;
  isPublic: boolean;
  tags?: string[];
}

interface LegalDocRow {
  id: string;
  document_name: string | null;
  title: string;
  document_type: string;
  status: string;
  version: number | null;
  last_updated: string | null;
  effective_date: string | null;
}

// kb_contract_document_type enum values from Supabase, mapped to display labels.
const LEGAL_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  contract: 'Contract',
  t_c: 'Terms & Conditions',
  privacy_policy: 'Privacy Policy',
  nda: 'NDA',
  license_agreement: 'License Agreement',
  other: 'Other',
  policy: 'Policy',
};

function mapLegalDocument(row: LegalDocRow): LegalDocument {
  return {
    id: row.id,
    title: row.title || row.document_name || 'Untitled Document',
    description: undefined,
    documentType: LEGAL_DOCUMENT_TYPE_LABELS[row.document_type] || row.document_type,
    status: row.status,
    version: String(row.version ?? '1.0'),
    lastUpdated: row.last_updated || row.effective_date || new Date().toISOString(),
    documentUrl: undefined,
    associatedApp: undefined,
    category: undefined,
    isPublic: true,
    tags: [],
  };
}

export async function getLegalDocuments(): Promise<LegalDocument[]> {
  try {
    const rows = await apiFetch<LegalDocRow[]>('/web/content/legal');
    return rows.map(mapLegalDocument);
  } catch (error) {
    console.error('Error fetching legal documents:', error);
    return [];
  }
}

export async function getLegalDocument(id: string): Promise<LegalDocument | null> {
  try {
    const row = await apiFetch<LegalDocRow>(`/web/content/legal/${encodeURIComponent(id)}`);
    return mapLegalDocument(row);
  } catch (error) {
    console.error('Error fetching legal document:', error);
    return null;
  }
}

export interface Banner {
  id: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string;
  linkText?: string;
  backgroundColor: string;
  textColor: string;
  priority: number;
}

interface BannerRow {
  id: string;
  title: string;
  message: string | null;
  type: string;
  link_url: string | null;
  link_text: string | null;
  background_color: string;
  text_color: string;
  priority: number;
}

function mapBanner(row: BannerRow): Banner {
  return {
    id: row.id,
    title: row.title,
    message: row.message || '',
    type: row.type,
    linkUrl: row.link_url || undefined,
    linkText: row.link_text || undefined,
    backgroundColor: row.background_color,
    textColor: row.text_color,
    priority: row.priority,
  };
}

export async function getBanners(): Promise<Banner[]> {
  try {
    const rows = await apiFetch<BannerRow[]>('/web/content/banners');
    return rows.map(mapBanner);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}

export interface MarketingPopupConfig {
  title: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  position: 'Center' | 'Bottom Right' | 'Bottom Left';
  delay: number;
  isEnabled: boolean;
}

interface MarketingPopupRow {
  title: string;
  content: string | null;
  button_text: string | null;
  button_link: string | null;
  background_color: string;
  text_color: string;
  button_color: string;
  position: 'center' | 'bottom_right' | 'bottom_left';
  delay: number;
}

const POSITION_MAP: Record<MarketingPopupRow['position'], MarketingPopupConfig['position']> = {
  center: 'Center',
  bottom_right: 'Bottom Right',
  bottom_left: 'Bottom Left',
};

export async function getMarketingPopupConfig(): Promise<MarketingPopupConfig | null> {
  try {
    const row = await apiFetch<MarketingPopupRow | null>('/web/content/marketing-popups');
    if (!row) return null;
    return {
      title: row.title,
      content: row.content || '',
      buttonText: row.button_text || '',
      buttonLink: row.button_link || '/',
      backgroundColor: row.background_color,
      textColor: row.text_color,
      buttonColor: row.button_color,
      position: POSITION_MAP[row.position] || 'Center',
      delay: (row.delay || 0) * 1000,
      isEnabled: true,
    };
  } catch (error) {
    console.error('Error fetching marketing popup config:', error);
    return null;
  }
}

// getSystemStatus intentionally NOT defined here: a concurrent effort
// routed the public status page through cofabri-core's own status API
// instead of cofabri-api. See src/lib/airtable.ts for that implementation
// (trimmed to just this function — everything else in this codebase reads
// through this file instead).
