import { MetadataRoute } from 'next'
import { getApps, getKnowledgeBaseArticles } from '@/lib/api-client'

const baseUrl = 'https://cofabri.com'

/**
 * Last-modified dates for pages whose content lives in this repo. Bump a date
 * by hand when that page's copy changes. Pages driven by live data (apps list,
 * roadmaps, changelog, knowledge base index) carry no lastmod rather than a
 * made-up one.
 *
 * /support, /status and /legal (and its documents) are noindex, so they are
 * deliberately absent from the sitemap.
 */
const STATIC_PAGES: {
  path: string
  lastModified?: string
  changeFrequency: 'daily' | 'weekly' | 'monthly'
  priority: number
}[] = [
  { path: '', lastModified: '2026-10-15', changeFrequency: 'weekly', priority: 1 },
  { path: '/apps', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/co-build', lastModified: '2026-09-15', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/contact', lastModified: '2026-09-02', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about', lastModified: '2026-09-28', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/knowledge-base', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/roadmaps', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/changelog', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/developers', lastModified: '2026-09-21', changeFrequency: 'monthly', priority: 0.6 },
]

/** A real, non-future date or undefined (the entry then omits lastmod). */
function validPastDate(...candidates: (string | undefined)[]): Date | undefined {
  const now = Date.now()
  for (const value of candidates) {
    if (!value) continue
    const date = new Date(value)
    if (!Number.isNaN(date.getTime()) && date.getTime() <= now) return date
  }
  return undefined
}

function entry(
  url: string,
  lastModified: Date | undefined,
  changeFrequency: 'daily' | 'weekly' | 'monthly',
  priority: number,
): MetadataRoute.Sitemap[number] {
  return { url, ...(lastModified ? { lastModified } : {}), changeFrequency, priority }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = STATIC_PAGES.map((page) =>
    entry(`${baseUrl}${page.path}`, validPastDate(page.lastModified), page.changeFrequency, page.priority),
  )

  // Fetch dynamic content directly through the shared API client (not an
  // HTTP round-trip to this site's own /api routes) — avoids depending on
  // this deployment's own base URL resolving correctly at sitemap-build time.
  const [apps, articles] = await Promise.all([
    getApps().catch(() => []),
    getKnowledgeBaseArticles().catch(() => []),
  ])

  const appPages = apps.map((app) =>
    entry(`${baseUrl}/apps/${app.id}`, validPastDate(app.releaseDate, app.launchDate), 'monthly', 0.6),
  )

  const articlePages = articles.map((article) =>
    entry(
      `${baseUrl}/knowledge-base/${article.slug}`,
      validPastDate(article.lastUpdated, article.publishedAt),
      'monthly',
      0.6,
    ),
  )

  return [...staticPages, ...appPages, ...articlePages]
}
