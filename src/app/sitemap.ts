import { MetadataRoute } from 'next'

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

  // Try to fetch dynamic content for sitemap
  let dynamicPages: MetadataRoute.Sitemap = [];
  
  try {
    // Fetch knowledge base articles
    const kbResponse = await fetch(`${baseUrl}/api/knowledge-base`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (kbResponse.ok) {
      const articles = await kbResponse.json();
      const articlePages = articles.map((article: any) => ({
        url: `${baseUrl}/knowledge-base/${article.slug}`,
        lastModified: new Date(article.lastModified || Date.now()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
      dynamicPages = [...dynamicPages, ...articlePages];
    }
  } catch (error) {
    console.error('Error fetching dynamic content for sitemap:', error);
  }

  return [...staticPages, ...dynamicPages];
}
