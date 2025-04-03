import React from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const categories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics and set up your account',
    articles: [
      { id: 'welcome', title: 'Welcome to CoFabri' },
      { id: 'account-setup', title: 'Setting Up Your Account' },
      { id: 'first-steps', title: 'First Steps Guide' },
    ],
  },
  {
    id: 'features',
    title: 'Features',
    description: 'Explore all our powerful features',
    articles: [
      { id: 'ai-capabilities', title: 'AI Capabilities' },
      { id: 'automation', title: 'Automation Features' },
      { id: 'integrations', title: 'Third-Party Integrations' },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Solve common issues and get help',
    articles: [
      { id: 'common-issues', title: 'Common Issues' },
      { id: 'error-messages', title: 'Error Messages Guide' },
      { id: 'contact-support', title: 'Contacting Support' },
    ],
  },
];

const popularArticles = [
  {
    id: 'getting-started',
    title: 'Getting Started with CoFabri',
    description: 'A comprehensive guide to help you get started with our platform.',
  },
  {
    id: 'ai-features',
    title: 'Understanding AI Features',
    description: 'Learn how to leverage our AI capabilities for your business.',
  },
  {
    id: 'automation',
    title: 'Setting Up Automation',
    description: 'Step-by-step guide to setting up your first automation workflow.',
  },
];

export const metadata = {
  title: 'Knowledge Base',
  description: 'Find answers to your questions and learn how to use CoFabri effectively.',
};

export default function KnowledgeBasePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-100 rounded-full filter blur-3xl opacity-60" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-60" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 animated-gradient-text">
            Knowledge Base
          </h1>
          <p className="text-xl text-gray-700 text-center max-w-2xl mx-auto mb-12">
            Find answers to your questions and learn how to use CoFabri effectively.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for articles..."
                className="w-full px-6 py-4 rounded-xl glass-card text-gray-900 placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all duration-300"
              />
              <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600 transition-colors duration-300">
                <MagnifyingGlassIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 gradient-text">
            Popular Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {popularArticles.map((article) => (
              <Link
                key={article.id}
                href={`/knowledge-base/article/${article.id}`}
                className="group p-6 rounded-xl glass-card hover:border-indigo-500/50 transition-all duration-300"
              >
                <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                  {article.title}
                </h3>
                <p className="text-gray-600">
                  {article.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 gradient-text">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <div
                key={category.id}
                className="p-6 rounded-xl glass-card"
              >
                <h3 className="text-xl font-semibold mb-3 text-gray-900">
                  {category.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {category.description}
                </p>
                <ul className="space-y-2">
                  {category.articles.map((article) => (
                    <li key={article.id}>
                      <Link
                        href={`/knowledge-base/article/${article.id}`}
                        className="text-indigo-600 hover:text-indigo-700 transition-colors duration-300"
                      >
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 