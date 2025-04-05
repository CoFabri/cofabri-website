import { getKnowledgeBaseArticle } from '@/lib/airtable';
import { Metadata } from 'next';

interface KnowledgeBaseArticlePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: KnowledgeBaseArticlePageProps): Promise<Metadata> {
  const article = await getKnowledgeBaseArticle(params.slug);
  
  if (!article) {
    return {
      title: 'Article Not Found | Knowledge Base',
      description: 'The requested article could not be found.',
    };
  }

  return {
    title: `${article.title} | Knowledge Base`,
    description: article.excerpt || article.content.substring(0, 160),
    openGraph: {
      title: article.title,
      description: article.excerpt || article.content.substring(0, 160),
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author],
      tags: article.tags,
    },
  };
} 