'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpenIcon, RocketLaunchIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const categories = [
  {
    title: 'Getting Started',
    description: 'Learn the basics and get up and running quickly',
    icon: RocketLaunchIcon,
    articles: [
      'Quick Start Guide',
      'Setting Up Your Account',
      'Basic Features Overview',
    ],
  },
  {
    title: 'User Guides',
    description: 'Detailed guides for using our apps effectively',
    icon: BookOpenIcon,
    articles: [
      'Project Management Best Practices',
      'CRM Integration Guide',
      'Analytics Dashboard Tutorial',
    ],
  },
  {
    title: 'Troubleshooting',
    description: 'Solutions to common issues and FAQs',
    icon: QuestionMarkCircleIcon,
    articles: [
      'Common Issues & Solutions',
      'API Troubleshooting',
      'Performance Optimization',
    ],
  },
];

const KnowledgeBase = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animated-gradient-text">
            Knowledge Base
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about using our apps and getting the most out of them
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <div
              key={category.title}
              className="group relative p-8 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
                  <category.icon className="w-8 h-8" />
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                {category.title}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {category.description}
              </p>

              <ul className="space-y-3">
                {category.articles.map((article) => (
                  <li key={article}>
                    <Link
                      href="/knowledge-base"
                      className="text-indigo-600 hover:text-indigo-700 flex items-center"
                    >
                      <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2" />
                      {article}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/knowledge-base"
            className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Browse All Articles
          </Link>
        </div>
      </div>
    </section>
  );
};

export default KnowledgeBase; 