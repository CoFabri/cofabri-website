'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ClockIcon, 
  UserIcon, 
  TagIcon,
  ChevronRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const ArticlePage = ({ params }: { params: { slug: string } }) => {
  // This would normally come from an API or database
  const articles = {
    'getting-started': {
      title: 'Getting Started with CoFabri',
      description: 'Learn how to set up and start using CoFabri effectively.',
      author: 'Sarah Johnson',
      date: 'March 15, 2024',
      readTime: '8 min read',
      category: 'Getting Started',
      tags: ['Setup', 'Basics', 'Tutorial'],
      content: `
        <h2>Introduction</h2>
        <p>Welcome to CoFabri! This guide will help you get started with our platform and make the most of its features.</p>

        <h2>Creating Your Account</h2>
        <p>To begin using CoFabri, follow these steps:</p>
        <ol>
          <li>Visit our website and click the "Sign Up" button</li>
          <li>Enter your email address and create a password</li>
          <li>Complete your profile information</li>
          <li>Verify your email address</li>
        </ol>

        <h2>Setting Up Your Workspace</h2>
        <p>After creating your account, you'll need to:</p>
        <ul>
          <li>Choose your preferred apps from our marketplace</li>
          <li>Configure your workspace settings</li>
          <li>Invite team members (if applicable)</li>
          <li>Set up integrations with your existing tools</li>
        </ul>

        <h2>Best Practices</h2>
        <p>Here are some tips to help you get the most out of CoFabri:</p>
        <ul>
          <li>Start with the core apps that match your needs</li>
          <li>Take advantage of our integration capabilities</li>
          <li>Regularly check for app updates and new features</li>
          <li>Use our support resources when needed</li>
        </ul>
      `,
      relatedArticles: [
        {
          title: 'Advanced Features Guide',
          slug: 'advanced-features',
        },
        {
          title: 'Integration Setup',
          slug: 'integration-setup',
        },
        {
          title: 'Team Collaboration',
          slug: 'team-collaboration',
        },
      ],
    },
    'advanced-features': {
      title: 'Advanced Features Guide',
      description: 'Learn about the advanced features and capabilities of CoFabri.',
      author: 'Michael Chen',
      date: 'March 20, 2024',
      readTime: '10 min read',
      category: 'Advanced',
      tags: ['Features', 'Advanced', 'Guide'],
      content: `
        <h2>Advanced Features Overview</h2>
        <p>CoFabri offers a range of advanced features to enhance your productivity and workflow.</p>

        <h2>Custom Workflows</h2>
        <p>Learn how to create and manage custom workflows:</p>
        <ul>
          <li>Setting up automation rules</li>
          <li>Creating custom triggers</li>
          <li>Managing workflow permissions</li>
        </ul>

        <h2>API Integration</h2>
        <p>Advanced integration capabilities:</p>
        <ul>
          <li>Custom API endpoints</li>
          <li>Webhook configurations</li>
          <li>Data synchronization</li>
        </ul>
      `,
      relatedArticles: [
        {
          title: 'Getting Started',
          slug: 'getting-started',
        },
        {
          title: 'API Documentation',
          slug: 'api-documentation',
        },
      ],
    },
    'integration-setup': {
      title: 'Integration Setup Guide',
      description: 'Learn how to set up and configure integrations with other tools.',
      author: 'Emily Rodriguez',
      date: 'March 25, 2024',
      readTime: '12 min read',
      category: 'Integrations',
      tags: ['Setup', 'Integrations', 'Guide'],
      content: `
        <h2>Integration Basics</h2>
        <p>Setting up integrations with CoFabri is straightforward and powerful.</p>

        <h2>Supported Integrations</h2>
        <p>We support integration with:</p>
        <ul>
          <li>Project Management Tools</li>
          <li>Communication Platforms</li>
          <li>Cloud Storage Services</li>
          <li>Development Tools</li>
        </ul>

        <h2>Configuration Steps</h2>
        <p>Follow these steps to set up integrations:</p>
        <ol>
          <li>Access the Integrations section</li>
          <li>Choose your desired integration</li>
          <li>Configure connection settings</li>
          <li>Test the integration</li>
        </ol>
      `,
      relatedArticles: [
        {
          title: 'Getting Started',
          slug: 'getting-started',
        },
        {
          title: 'Advanced Features',
          slug: 'advanced-features',
        },
      ],
    },
  };

  const article = articles[params.slug as keyof typeof articles];

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
          <p className="text-xl text-gray-600 mb-8">
            The article you're looking for doesn't exist.
          </p>
          <Link
            href="/knowledge-base"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Knowledge Base
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <ChevronRightIcon className="w-4 h-4" />
            <Link href="/knowledge-base" className="hover:text-blue-600">Knowledge Base</Link>
            <ChevronRightIcon className="w-4 h-4" />
            <span className="text-gray-900">{article.title}</span>
          </div>
        </div>
      </div>

      {/* Article Header */}
      <header className="bg-white border-b border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <Link 
            href="/knowledge-base"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Knowledge Base
          </Link>
          
          <h1 className="text-4xl font-bold mb-4 animated-gradient-text">
            {article.title}
          </h1>
          
          <p className="text-xl text-gray-600 mb-6 max-w-3xl">
            {article.description}
          </p>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center">
              <UserIcon className="w-5 h-5 mr-2" />
              {article.author}
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              {article.readTime}
            </div>
            <div className="flex items-center">
              <TagIcon className="w-5 h-5 mr-2" />
              {article.category}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-8 prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </div>
            
            {/* Tags */}
            <div className="mt-8 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Related Articles */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Related Articles</h3>
              <div className="space-y-4">
                {article.relatedArticles.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/knowledge-base/${related.slug}`}
                    className="block p-4 rounded-lg hover:bg-gray-50 transition"
                  >
                    <h4 className="text-blue-600 font-medium mb-1">
                      {related.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>

            {/* Help Box */}
            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Need More Help?</h3>
              <p className="text-gray-600 mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <Link
                href="/contact"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Contact Support
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ArticlePage; 