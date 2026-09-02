import { MetadataRoute } from 'next'
import { getApps, getKnowledgeBaseArticles } from '@/lib/api-client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://cofabri.com'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/apps`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/partners`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/knowledge-base`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/roadmaps`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/status`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/legal`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ]

  // Fetch dynamic content directly through the shared API client (not an
  // HTTP round-trip to this site's own /api routes) — avoids depending on
  // this deployment's own base URL resolving correctly at sitemap-build time.
  const [apps, articles] = await Promise.all([
    getApps().catch(() => []),
    getKnowledgeBaseArticles().catch(() => []),
  ])

  const appPages: MetadataRoute.Sitemap = apps.map((app) => ({
    url: `${baseUrl}/apps/${app.id}`,
    lastModified: new Date(app.releaseDate || app.launchDate || Date.now()),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/knowledge-base/${article.slug}`,
    lastModified: new Date(article.lastUpdated || article.publishedAt || Date.now()),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...appPages, ...articlePages]
}
