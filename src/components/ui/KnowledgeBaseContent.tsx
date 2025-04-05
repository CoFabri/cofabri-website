'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { KnowledgeBaseArticle } from '@/lib/airtable';
import { KnowledgeBaseSearch } from './KnowledgeBaseSearch';
import AnimatedGradient from './AnimatedGradient';

interface KnowledgeBaseContentProps {
  initialArticles: KnowledgeBaseArticle[];
  initialPopularArticles: KnowledgeBaseArticle[];
}

export function KnowledgeBaseContent({ initialArticles, initialPopularArticles }: KnowledgeBaseContentProps) {
  const [articles, setArticles] = useState(initialArticles);
  const [popularArticles, setPopularArticles] = useState(initialPopularArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(12);

  // Group articles by category
  const articlesByCategory = articles.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, typeof articles>);

  // Get unique categories
  const categories = Object.keys(articlesByCategory);

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('q', searchQuery);

        const response = await fetch(`/api/knowledge-base?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch articles');
        const data = await response.json();
        setArticles(data);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchArticles, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Filter articles by selected category
  const filteredArticles = selectedCategory
    ? articles.filter(article => article.category === selectedCategory)
    : articles;

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
        <AnimatedGradient />
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-8 animated-gradient-text">
              Knowledge Base
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Find answers to common questions and learn how to make the most of our tools.
            </p>
            <div className="max-w-2xl mx-auto">
              <KnowledgeBaseSearch onSearch={setSearchQuery} />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
              <nav className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    selectedCategory === null
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Articles
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      selectedCategory === category
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            {/* Popular Articles - Only show when there's no search query */}
            {!searchQuery && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6 animated-gradient-text">
                  Popular Articles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {popularArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/knowledge-base/${article.slug}`}
                      className="group p-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-lg 
                        hover:border-indigo-500/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {article.category}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Popular
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {article.excerpt || article.content.substring(0, 150)}...
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-500">⏱️</span>
                          <span>{article.readTime} min read</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-500">👤</span>
                          <span>{article.author}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Articles Grid */}
            <section>
              <h2 className="text-2xl font-bold mb-6 animated-gradient-text">
                {searchQuery 
                  ? `Search Results for "${searchQuery}"`
                  : selectedCategory 
                    ? `${selectedCategory} Articles` 
                    : 'All Articles'}
              </h2>
              {isLoading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No articles found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery ? 'Try adjusting your search query' : 'No articles in this category'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredArticles.slice(0, displayLimit).map((article) => (
                      <Link
                        key={article.id}
                        href={`/knowledge-base/${article.slug}`}
                        className="group p-6 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-lg 
                          hover:border-indigo-500/50 transition-all duration-300"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {article.category}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {article.excerpt || article.content.substring(0, 150)}...
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-500">⏱️</span>
                            <span>{article.readTime} min read</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-500">👤</span>
                            <span>{article.author}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {filteredArticles.length > displayLimit && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={() => setDisplayLimit(prev => prev + 12)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Load More Articles
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
} 