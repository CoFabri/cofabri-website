'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { KnowledgeBaseArticle } from '@/lib/airtable';
import { marked } from 'marked';
import { useState, useEffect } from 'react';

interface ArticleContentProps {
  article: KnowledgeBaseArticle;
}

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

export default function ArticleContent({ article }: ArticleContentProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    if (article.content) {
      convertMarkdownToHtml(article.content).then(setHtmlContent);
    }
  }, [article.content]);

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
              {article.readTime && (
                <>
                  <span>•</span>
                  <span>{article.readTime} min read</span>
                </>
              )}
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
        </article>
      </div>
    </div>
  );
} 