import type { App, KnowledgeBaseArticle } from './api-client';

const MAX_EDIT_DISTANCE = 2;
const MIN_PREFIX_LENGTH = 4;

export type ClosestMatch =
  | { kind: 'app'; app: App }
  | { kind: 'article'; article: KnowledgeBaseArticle };

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = curr;
  }
  return prev[b.length];
}

// Distance from a broken slug to a real one, or null when they aren't close
// enough to be a confident "you probably meant this". A prefix match counts
// (a truncated link) but only past a few characters, so "/a" can't match anything.
function slugDistance(broken: string, real: string): number | null {
  const a = broken.toLowerCase();
  const b = real.toLowerCase();
  if (a.length >= MIN_PREFIX_LENGTH && b.startsWith(a)) return b.length - a.length;
  const d = editDistance(a, b);
  return d <= MAX_EDIT_DISTANCE ? d : null;
}

export function lastSegment(pathname: string): string {
  const segments = pathname.split('?')[0].split('#')[0].split('/').filter(Boolean);
  const last = segments[segments.length - 1] ?? '';
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

// Compares the last path segment to app ids and knowledge-base slugs. Under
// /apps only apps are candidates and under /knowledge-base only articles;
// anywhere else both are, since the visitor could have meant either.
export function findClosestMatch(
  pathname: string,
  apps: App[],
  articles: KnowledgeBaseArticle[]
): ClosestMatch | null {
  const slug = lastSegment(pathname);
  if (!slug) return null;

  const inApps = pathname.startsWith('/apps/');
  const inKb = pathname.startsWith('/knowledge-base/');

  let best: { match: ClosestMatch; distance: number } | null = null;
  const consider = (match: ClosestMatch, real: string) => {
    const distance = slugDistance(slug, real);
    if (distance !== null && (!best || distance < best.distance)) best = { match, distance };
  };

  if (!inKb) for (const app of apps) consider({ kind: 'app', app }, app.id);
  if (!inApps) for (const article of articles) consider({ kind: 'article', article }, article.slug);

  return (best as { match: ClosestMatch } | null)?.match ?? null;
}

function tokens(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
}

function updatedAt(article: KnowledgeBaseArticle): number {
  const t = Date.parse(article.lastUpdated || article.publishedAt);
  return Number.isNaN(t) ? 0 : t;
}

// Articles to suggest under the apps list. For a broken knowledge-base link,
// the ones sharing words with the broken slug come first (that visitor wanted
// something specific); otherwise it's featured-then-newest. Never the matched
// article itself, which already has its own row.
export function pickSuggestedArticles(
  pathname: string,
  articles: KnowledgeBaseArticle[],
  excludeSlug?: string,
  limit = 3
): { articles: KnowledgeBaseArticle[]; related: boolean } {
  const pool = articles.filter((a) => a.slug !== excludeSlug);
  const byNewest = (a: KnowledgeBaseArticle, b: KnowledgeBaseArticle) => updatedAt(b) - updatedAt(a);

  if (pathname.startsWith('/knowledge-base/')) {
    const wanted = new Set(tokens(lastSegment(pathname)));
    const score = (a: KnowledgeBaseArticle) =>
      tokens(`${a.slug} ${a.title}`).filter((t) => wanted.has(t)).length;
    const related = pool.filter((a) => score(a) > 0).sort((a, b) => score(b) - score(a) || byNewest(a, b));
    if (related.length > 0) return { articles: related.slice(0, limit), related: true };
  }

  const ranked = [...pool].sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured) || byNewest(a, b));
  return { articles: ranked.slice(0, limit), related: false };
}

export function searchSuggestions(
  query: string,
  apps: App[],
  articles: KnowledgeBaseArticle[],
  limit = 6
): { apps: App[]; articles: KnowledgeBaseArticle[] } {
  const q = query.trim().toLowerCase();
  if (!q) return { apps: [], articles: [] };
  const matchingApps = apps.filter((a) =>
    [a.name, a.category, a.description].some((f) => f?.toLowerCase().includes(q))
  );
  const matchingArticles = articles.filter((a) =>
    [a.title, a.excerpt, a.category].some((f) => f?.toLowerCase().includes(q))
  );
  return { apps: matchingApps.slice(0, limit), articles: matchingArticles.slice(0, limit) };
}
