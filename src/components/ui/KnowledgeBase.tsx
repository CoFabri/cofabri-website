'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { KnowledgeBaseArticle } from '@/lib/airtable';
import { getKnowledgeBaseArticles } from '@/lib/airtable';
import SectionHeading from '@/components/ui/SectionHeading';

export default function KnowledgeBase() {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const response = await fetch('/api/knowledge-base');
        if (!response.ok) throw new Error('Failed to fetch knowledge base articles');
        const data = await response.json();
        setArticles(data);
        
        // Extract unique categories
        const categories = Array.from(new Set(data.map((article: KnowledgeBaseArticle) => article.category))) as string[];
        setAllCategories(categories);
      } catch (err) {
        console.error('Error fetching knowledge base articles:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch knowledge base articles');
      } finally {
        setIsLoading(false);
      }
    }

    fetchArticles();
  }, []);

  useEffect(() => {
    let filtered = [...articles];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) ||
        (article.excerpt || '').toLowerCase().includes(query) ||
        (article.content || '').toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(article => 
        article.category === selectedCategory
      );
    }

    setFilteredArticles(filtered);
  }, [articles, searchQuery, selectedCategory]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <section className="relative min-h-[320px] flex flex-col items-center justify-center pt-32 pb-24">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-500">Loading knowledge base articles...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="relative min-h-[320px] flex flex-col items-center justify-center pt-32 pb-24">
        <SectionHeading
          title="Knowledge Base"
          subtitle={isTestMode ? "Demo Mode: Using sample content" : "Find answers to common questions and learn how to use our products"}
        />

        {/* Search Bar */}
        <div className="relative mb-8">
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
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {allCategories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
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

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article) => (
            <Link
              key={article.id}
              href={`/knowledge-base/${article.slug}`}
              className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src="/images/placeholder.jpg"
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {article.category}
                  </span>
                </div>
                <h2 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                  {article.title}
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {article.excerpt || article.content.substring(0, 150)}...
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">⏱️</span>
                    <span>{article.readTime} min read</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">📅</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No articles found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or category filter
            </p>
          </div>
        )}
      </section>
    </div>
  );
} 