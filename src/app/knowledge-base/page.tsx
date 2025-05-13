'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import GradientHeading from '@/components/ui/GradientHeading';
import { KnowledgeBaseArticle } from '@/lib/airtable';

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 6;

  // Fetch articles
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch real content from API
        console.log('Fetching articles from API...');
        const response = await fetch('/api/knowledge-base');
        if (!response.ok) throw new Error('Failed to fetch knowledge base articles');
        const articleData = await response.json() as KnowledgeBaseArticle[];
        console.log('Received articles:', articleData);
        
        setArticles(articleData);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(articleData.map(article => article.category)));
        console.log('Unique categories:', uniqueCategories);
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error loading knowledge base articles:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Filter articles based on search and category
  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate pagination for All Articles section
  const regularArticles = filteredArticles;
  const totalPages = Math.ceil(regularArticles.length / articlesPerPage);
  const paginatedArticles = regularArticles.slice(
    (currentPage - 1) * articlesPerPage,
    currentPage * articlesPerPage
  );

  return (
    <div className="min-h-screen">
      <GradientHeading
        title="Knowledge Base"
        subtitle="Find answers to common questions and learn how to use our products"
        extraContent={
          <div className="relative z-50 w-full max-w-4xl mx-auto mt-12">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 
                    text-gray-700 font-medium hover:border-blue-400 focus:border-blue-500 focus:ring-2 
                    focus:ring-blue-200 focus:outline-none transition-all duration-200
                    shadow-sm hover:shadow-md"
                />
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                    ${!selectedCategory
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                      ${selectedCategory === category
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        }
      />
      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No articles found matching your criteria.</p>
          </div>
        ) : (
          <>
            {/* Popular and Featured Articles */}
            <div className="mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Popular Articles */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Articles</h2>
                  <div className="space-y-4">
                    {filteredArticles
                      .filter(article => article.isPopular)
                      .slice(0, 3)
                      .map((article) => (
                        <a
                          key={article.id}
                          href={`/knowledge-base/${article.slug}`}
                          className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-white border border-yellow-100 hover:border-yellow-200 hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <span className="text-yellow-600 text-xl">⭐</span>
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {article.category}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Popular
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors duration-300 truncate">
                              {article.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {article.excerpt || (article.content ? article.content.substring(0, 100) + '...' : '')}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                              <span className="flex items-center">
                                <span className="text-yellow-500 mr-1">⏱️</span>
                                {article.readTime} min read
                              </span>
                            </div>
                          </div>
                        </a>
                      ))}
                  </div>
                </div>

                {/* Featured Articles */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Articles</h2>
                  <div className="space-y-4">
                    {filteredArticles
                      .filter(article => article.isFeatured)
                      .slice(0, 3)
                      .map((article) => (
                        <a
                          key={article.id}
                          href={`/knowledge-base/${article.slug}`}
                          className="group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-white border border-purple-100 hover:border-purple-200 hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 text-xl">✨</span>
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {article.category}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Featured
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-300 truncate">
                              {article.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {article.excerpt || (article.content ? article.content.substring(0, 100) + '...' : '')}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                              <span className="flex items-center">
                                <span className="text-purple-500 mr-1">⏱️</span>
                                {article.readTime} min read
                              </span>
                            </div>
                          </div>
                        </a>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* All Articles */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedArticles.map((article) => (
                  <a
                    key={article.id}
                    href={`/knowledge-base/${article.slug}`}
                    className="group p-6 rounded-xl glass-card hover:border-indigo-500/50 transition-all duration-300"
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
                      {article.excerpt || (article.content ? article.content.substring(0, 150) + '...' : '')}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="text-indigo-500">⏱️</span>
                      <span className="ml-2">{article.readTime} min read</span>
                    </div>
                  </a>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 