import type { KnowledgeBaseArticle } from './api-client';

type ArticleRef = Pick<KnowledgeBaseArticle, 'slug' | 'title' | 'applications'>;

const INTRO_SLUG = /^(what-is|getting-started)/;
const COMPARISON_SLUG = /(^|-)vs-/;

/**
 * Articles that introduce an app ("what is ..." / "getting started ..."),
 * for linking from that app's page. Matches on the slug convention and on the
 * article being linked to the app in the knowledge base.
 */
export function pickAppIntroArticles<T extends ArticleRef>(appId: string, articles: T[]): T[] {
  return articles.filter(
    (a) => INTRO_SLUG.test(a.slug) && a.applications.some((app) => app.id === appId),
  );
}

/** The Co-Build comparison articles ("co-build-vs-..."), at most `limit`. */
export function pickCoBuildComparisons<T extends ArticleRef>(articles: T[], limit = 2): T[] {
  return articles.filter((a) => a.slug.startsWith('co-build') && COMPARISON_SLUG.test(a.slug)).slice(0, limit);
}
