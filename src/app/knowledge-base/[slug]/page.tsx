import { getKnowledgeBaseArticle } from '@/lib/airtable';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, BookOpenIcon, ClockIcon, TagIcon } from '@heroicons/react/24/outline';
import { Metadata } from 'next';
import AnimatedGradient from '@/components/ui/AnimatedGradient';
import BackButton from '@/components/ui/BackButton';
import ArticleContent from './ArticleContent';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

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

export default async function KnowledgeBaseArticlePage({ params }: KnowledgeBaseArticlePageProps) {
  const article = await getKnowledgeBaseArticle(params.slug);

  if (!article) {
    notFound();
  }

  // Debug logging
  console.log('Article from Airtable:', article);
  console.log('Published At value:', article.publishedAt);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
        <AnimatedGradient />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="relative z-20">
              <BackButton />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-8 animated-gradient-text">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 text-gray-600">
              <div className="flex items-center gap-x-2">
                <BookOpenIcon className="h-5 w-5 text-blue-500" />
                <span className="text-gray-900">{article.author}</span>
              </div>
              <div className="flex items-center gap-x-2">
                <ClockIcon className="h-5 w-5 text-blue-500" />
                <span>{article.readTime} min read</span>
              </div>
              <time dateTime={article.lastUpdated} className="text-gray-500">
                {article.lastUpdated ? new Date(article.lastUpdated).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Not updated'}
              </time>
            </div>

            {article.tags && article.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
                      <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg prose-blue max-w-none">
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: article.content }} 
                />
              </div>
            </div>
        </div>
      </section>
    </div>
  );
} 