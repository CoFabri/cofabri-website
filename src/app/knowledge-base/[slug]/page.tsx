import { getKnowledgeBaseArticle, getKnowledgeBaseArticlesBySlugs } from '@/lib/airtable';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, BookOpenIcon, ClockIcon, TagIcon } from '@heroicons/react/24/outline';
import { Metadata } from 'next';
import AnimatedGradient from '@/components/ui/AnimatedGradient';
import BackButton from '@/components/ui/BackButton';
import ArticleContent from './ArticleContent';
import { marked } from 'marked';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

// Configure marked for safe HTML output
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Function to convert markdown to HTML
async function convertMarkdownToHtml(markdown: string): Promise<string> {
  try {
    // Convert markdown to HTML
    let html = await marked(markdown);
    
    // Add extra spacing for better readability
    html = html
      // Add spacing after paragraphs
      .replace(/<\/p>\s*<p>/g, '</p>\n<p>')
      // Add spacing after lists
      .replace(/<\/ul>\s*<p>/g, '</ul>\n<p>')
      .replace(/<\/ol>\s*<p>/g, '</ol>\n<p>')
      // Add spacing before lists
      .replace(/<p>\s*<ul>/g, '<p>\n<ul>')
      .replace(/<p>\s*<ol>/g, '<p>\n<ol>')
      // Ensure proper spacing around strong tags
      .replace(/(<strong>.*?<\/strong>)/g, '<span class="font-semibold text-gray-900">$1</span>');
    
    return html;
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    return markdown; // Fallback to original text if conversion fails
  }
}

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
      modifiedTime: article.lastUpdated,
      authors: [article.author],
      tags: article.tags,
    },
    other: {
      'article:published_time': article.publishedAt,
      'article:modified_time': article.lastUpdated || article.publishedAt,
    },
  };
}

export default async function KnowledgeBaseArticlePage({ params }: KnowledgeBaseArticlePageProps) {
  const article = await getKnowledgeBaseArticle(params.slug);

  if (!article) {
    notFound();
  }

  // Convert markdown to HTML
  let htmlContent = '';
  if (article.content) {
    htmlContent = await convertMarkdownToHtml(article.content);
  }

  // Fetch related articles if relatedTopics exist
  let relatedArticles: any[] = [];
  if (article.relatedTopics) {
    // Handle both array and string formats
    let topicSlugs: string[] = [];
    if (Array.isArray(article.relatedTopics)) {
      topicSlugs = article.relatedTopics;
    } else if (typeof article.relatedTopics === 'string') {
      // If it's a string, try to parse it as comma-separated values
      topicSlugs = article.relatedTopics.split(',').map(slug => slug.trim()).filter(slug => slug.length > 0);
    }
    
    // Filter out non-slug values and map common titles to slugs
    const validSlugs = topicSlugs.filter(slug => {
      // Check if it looks like a valid slug (lowercase, no spaces, alphanumeric + hyphens)
      return /^[a-z0-9-]+$/.test(slug);
    });
    
    // Map common titles to their actual slugs
    const titleToSlugMap: { [key: string]: string } = {
      'Knowledge Base Coming Soon': 'coming-soon',
      'Welcome to CertiFi Central - Your Certification Exam Platform': 'welcome-certifi-central'
    };
    
    // Add mapped slugs for any titles that were found
    const mappedSlugs = topicSlugs
      .filter(slug => !/^[a-z0-9-]+$/.test(slug)) // Get non-slug values
      .map(title => titleToSlugMap[title])
      .filter(slug => slug); // Remove undefined values
    
    const allSlugs = [...validSlugs, ...mappedSlugs];
    
    if (allSlugs.length > 0) {
      relatedArticles = await getKnowledgeBaseArticlesBySlugs(allSlugs);
    }
  }

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

            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 text-gray-600 mb-6">
              <div className="flex items-center gap-x-2">
                <BookOpenIcon className="h-5 w-5 text-blue-500" />
                <span className="text-gray-900">{article.author}</span>
              </div>
              {article.readTime && (
                <div className="flex items-center gap-x-2">
                  <ClockIcon className="h-5 w-5 text-blue-500" />
                  <span>{article.readTime} min read</span>
                </div>
              )}
              <div className="flex items-center gap-x-2">
                <span className="text-gray-500">Published:</span>
                <time dateTime={article.publishedAt} className="text-gray-900">
                  {new Date(article.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
              <div className="flex items-center gap-x-2">
                <span className="text-gray-500">Last Updated:</span>
                <time dateTime={article.lastUpdated || article.publishedAt} className="text-gray-900">
                  {new Date(article.lastUpdated || article.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
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

            {/* Application Logo */}
            {article.logoUrl && article.applications && article.applications.length > 0 && (
              <img 
                src={article.logoUrl} 
                alt={`${article.applications[0]} Logo`}
                className="h-8 w-auto object-contain"
              />
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg prose-blue max-w-none">
              {article.content ? (
                <div 
                  className="text-gray-700 leading-relaxed markdown-content"
                  dangerouslySetInnerHTML={{ __html: htmlContent }} 
                  style={{
                    '--tw-prose-body': '#374151',
                    '--tw-prose-headings': '#111827',
                    '--tw-prose-links': '#3b82f6',
                    '--tw-prose-bold': '#111827',
                    '--tw-prose-counters': '#6b7280',
                    '--tw-prose-bullets': '#d1d5db',
                    '--tw-prose-hr': '#e5e7eb',
                    '--tw-prose-quotes': '#111827',
                    '--tw-prose-quote-borders': '#e5e7eb',
                    '--tw-prose-captions': '#6b7280',
                    '--tw-prose-code': '#111827',
                    '--tw-prose-pre-code': '#e5e7eb',
                    '--tw-prose-pre-bg': '#1f2937',
                    '--tw-prose-th-borders': '#d1d5db',
                    '--tw-prose-td-borders': '#e5e7eb',
                  } as React.CSSProperties}
                />
              ) : (
                <div className="text-gray-700 leading-relaxed">
                  <p>{article.excerpt || 'Content not available.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related Topics Section */}
      <section className="py-16 bg-blue-600 border-t border-blue-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8">Related Topics</h2>
            {relatedArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <Link
                    key={relatedArticle.id}
                    href={`/knowledge-base/${relatedArticle.slug}`}
                    className="group p-6 rounded-xl glass-card hover:border-indigo-500/50 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {relatedArticle.category}
                      </span>
                      {relatedArticle.applications && relatedArticle.applications.length > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {relatedArticle.applications[0]}
                          {relatedArticle.applications.length > 1 && ` +${relatedArticle.applications.length - 1}`}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                      {relatedArticle.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {relatedArticle.excerpt || (relatedArticle.content ? relatedArticle.content.substring(0, 150) + '...' : '')}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="text-indigo-500">⏱️</span>
                      <span className="ml-2">{relatedArticle.readTime} min read</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-blue-100">No related topics available for this article.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
} 