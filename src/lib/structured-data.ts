/**
 * JSON-LD builders for the app and knowledge-base pages.
 *
 * Only facts the pages already show are emitted; optional fields are omitted
 * rather than guessed. Deliberately no offers, ratings, reviews, or
 * certification claims.
 */

export const SITE_URL = 'https://cofabri.com';
/** Matches the `@id` on the Organization node emitted from the root layout. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

type JsonLd = Record<string, unknown>;

export interface SoftwareApplicationInput {
  id: string;
  name: string;
  description?: string;
  /** The app's own domain/URL, when it has one worth pointing at. */
  appUrl?: string;
  category?: string;
}

export interface ArticleInput {
  slug: string;
  title: string;
  description?: string;
  publishedAt?: string;
  lastUpdated?: string;
  tags?: string[];
}

/** Drops undefined, null and empty-string values so missing data is omitted, not guessed. */
function compact(obj: JsonLd): JsonLd {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)),
  );
}

function normalizeUrl(url?: string): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).toString();
  } catch {
    return undefined;
  }
}

function isoDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function buildSoftwareApplicationSchema(input: SoftwareApplicationInput): JsonLd {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: input.name,
    description: input.description?.trim(),
    applicationCategory: input.category?.trim() || 'BusinessApplication',
    operatingSystem: 'Web',
    url: normalizeUrl(input.appUrl) ?? `${SITE_URL}/apps/${input.id}`,
    mainEntityOfPage: `${SITE_URL}/apps/${input.id}`,
    publisher: { '@id': ORGANIZATION_ID },
  });
}

export function buildArticleSchema(input: ArticleInput): JsonLd {
  const url = `${SITE_URL}/knowledge-base/${input.slug}`;
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description?.trim(),
    datePublished: isoDate(input.publishedAt),
    dateModified: isoDate(input.lastUpdated) ?? isoDate(input.publishedAt),
    keywords: input.tags && input.tags.length > 0 ? input.tags.join(', ') : undefined,
    author: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  });
}

/** JSON.stringify with `<` escaped so content can never close the script tag. */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
