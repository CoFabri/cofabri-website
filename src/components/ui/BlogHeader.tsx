'use client';

import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AnimatedGradient from './AnimatedGradient';

interface BlogHeaderProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: { tag?: string }) => void;
  tags: string[];
}

export default function BlogHeader({ onSearch, onFilterChange, tags }: BlogHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleTagChange = (tag: string) => {
    const newTag = selectedTag === tag ? '' : tag;
    setSelectedTag(newTag);
    onFilterChange({ tag: newTag });
  };

  return (
    <section className="relative pt-32 pb-24 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
      <AnimatedGradient />
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 animated-gradient-text">
            Blog
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Read our latest articles, tutorials, and insights about software development, product management, and industry trends.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search articles..."
                className="block w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl shadow-sm 
                  focus:ring-2 focus:ring-blue-200 focus:border-blue-500 sm:text-sm transition-all duration-200"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => handleTagChange('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedTag === ''
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagChange(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 