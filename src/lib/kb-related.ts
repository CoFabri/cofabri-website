import type { KnowledgeBaseArticle } from './api-client';

const DEFAULT_LIMIT = 3;

function updatedAt(article: KnowledgeBaseArticle): number {
  const t = Date.parse(article.lastUpdated || article.publishedAt);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Related articles for one with no hand-curated related topics, so the section
 * fills itself. Articles sharing an app rank first, then same-category ones;
 * each tier is newest-first. Unrelated articles are never used as filler.
 */
export function pickFallbackRelated(
  current: KnowledgeBaseArticle,
  all: KnowledgeBaseArticle[],
  limit = DEFAULT_LIMIT
): KnowledgeBaseArticle[] {
  const appIds = new Set(current.applications.map((a) => a.id));
  const byNewest = (a: KnowledgeBaseArticle, b: KnowledgeBaseArticle) => updatedAt(b) - updatedAt(a);

  const others = all.filter((a) => a.id !== current.id && a.slug !== current.slug);
  const sharesApp = (a: KnowledgeBaseArticle) => a.applications.some((app) => appIds.has(app.id));

  const sameApp = others.filter(sharesApp).sort(byNewest);
  const sameCategory = others.filter((a) => !sharesApp(a) && a.category === current.category).sort(byNewest);

  return [...sameApp, ...sameCategory].slice(0, limit);
}
