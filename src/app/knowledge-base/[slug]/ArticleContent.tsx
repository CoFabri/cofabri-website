'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { KnowledgeBaseArticle } from '@/lib/airtable';

interface ArticleContentProps {
  article: KnowledgeBaseArticle;
}

export default function ArticleContent({ article }: ArticleContentProps) {
  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="container mx-auto px-4 py-12">
        <Link 
          href="/knowledge-base"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Knowledge Base
        </Link>

        <article className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>
            <div className="flex items-center text-gray-600 space-x-4">
              <span>{article.author}</span>
              <span>•</span>
              <span>{article.readTime} min read</span>
              <span>•</span>
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString()}
              </time>
            </div>
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="prose prose-lg max-w-none">
            <div 
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.content }} 
            />
          </div>
        </article>
      </div>
    </div>
  );
} 