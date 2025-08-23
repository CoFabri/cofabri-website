'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import GradientHeading from '@/components/ui/GradientHeading';
import { KnowledgeBaseArticle } from '@/lib/airtable';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

function KnowledgeBaseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedApplication, setSelectedApplication] = useState('');
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [applications, setApplications] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 6;

  // Initialize from URL parameters
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const tagParam = searchParams.get('tag');
    const applicationParam = searchParams.get('application');
    const searchParam = searchParams.get('search');
    
    if (categoryParam) setSelectedCategory(categoryParam);
    if (tagParam) setSelectedTag(tagParam);
    if (applicationParam) setSelectedApplication(applicationParam);
    if (searchParam) setSearchQuery(searchParam);
  }, [searchParams]);

  // Fetch articles
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch real content from API
        console.log('Fetching articles from API...');
        const response = await fetch('/api/knowledge-base', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch knowledge base articles');
        const articleData = await response.json() as KnowledgeBaseArticle[];
        console.log('Received articles:', articleData);
        
        setArticles(articleData);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(articleData.map(article => article.category)));
        console.log('Unique categories:', uniqueCategories);
        setCategories(uniqueCategories);
        
        // Extract unique tags
        const allTags = articleData.flatMap(article => article.tags || []);
        const uniqueTags = Array.from(new Set(allTags));
        console.log('Unique tags:', uniqueTags);
        setTags(uniqueTags);
        
        // Extract unique applications
        const allApplications = articleData.flatMap(article => article.applications || []);
        const uniqueApplications = Array.from(new Set(allApplications));
        console.log('Unique applications:', uniqueApplications);
        setApplications(uniqueApplications);
      } catch (error) {
        console.error('Error loading knowledge base articles:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Filter articles based on search, category, tags, and applications
  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    
    const matchesTag = !selectedTag || (article.tags && article.tags.includes(selectedTag));
    
    const matchesApplication = !selectedApplication || (article.applications && article.applications.includes(selectedApplication));
    
    return matchesSearch && matchesCategory && matchesTag && matchesApplication;
  });

  // Calculate pagination for All Articles section
  const regularArticles = filteredArticles;
  const totalPages = Math.ceil(regularArticles.length / articlesPerPage);
  const paginatedArticles = regularArticles.slice(
    (currentPage - 1) * articlesPerPage,
    currentPage * articlesPerPage
  );

  // URL update functions
  const updateURL = (newCategory?: string, newTag?: string, newApplication?: string, newSearch?: string) => {
    const params = new URLSearchParams();
    
    if (newCategory) params.set('category', newCategory);
    if (newTag) params.set('tag', newTag);
    if (newApplication) params.set('application', newApplication);
    if (newSearch) params.set('search', newSearch);
    
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page
    updateURL(category || undefined, selectedTag || undefined, selectedApplication || undefined, searchQuery || undefined);
  };

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    setCurrentPage(1); // Reset to first page
    updateURL(selectedCategory || undefined, tag || undefined, selectedApplication || undefined, searchQuery || undefined);
  };

  const handleApplicationChange = (application: string) => {
    setSelectedApplication(application);
    setCurrentPage(1); // Reset to first page
    updateURL(selectedCategory || undefined, selectedTag || undefined, application || undefined, searchQuery || undefined);
  };

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    setCurrentPage(1); // Reset to first page
    updateURL(selectedCategory || undefined, selectedTag || undefined, selectedApplication || undefined, search || undefined);
  };

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
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 
                    text-gray-700 font-medium hover:border-blue-400 focus:border-blue-500 focus:ring-2 
                    focus:ring-blue-200 focus:outline-none transition-all duration-200
                    shadow-sm hover:shadow-md"
                />
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700 mr-2 self-center">Categories:</span>
                <button
                  onClick={() => handleCategoryChange('')}
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
                    onClick={() => handleCategoryChange(category)}
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

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 mr-2 self-center">Tags:</span>
                  <button
                    onClick={() => handleTagChange('')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                      ${!selectedTag
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    All Tags
                  </button>
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagChange(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                        ${selectedTag === tag
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Applications */}
              {applications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 mr-2 self-center">Applications:</span>
                  <button
                    onClick={() => handleApplicationChange('')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                      ${!selectedApplication
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    All Applications
                  </button>
                  {applications.map((application) => (
                    <button
                      key={application}
                      onClick={() => handleApplicationChange(application)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                        ${selectedApplication === application
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {application}
                    </button>
                  ))}
                </div>
              )}
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
                              {article.applications && article.applications.length > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {article.applications[0]}
                                  {article.applications.length > 1 && ` +${article.applications.length - 1}`}
                                </span>
                              )}
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
                              {article.applications && article.applications.length > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {article.applications[0]}
                                  {article.applications.length > 1 && ` +${article.applications.length - 1}`}
                                </span>
                              )}
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
                      {article.applications && article.applications.length > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {article.applications[0]}
                          {article.applications.length > 1 && ` +${article.applications.length - 1}`}
                        </span>
                      )}
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

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <KnowledgeBaseContent />
    </Suspense>
  );
} 