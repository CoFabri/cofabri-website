'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const posts = [
  {
    title: 'Maximizing Productivity with Project Manager Pro',
    description: 'Learn how to leverage AI-powered features to boost your team\'s efficiency and project success rates.',
    image: '/blog/productivity.jpg',
    category: 'Productivity',
    date: 'Mar 15, 2024',
    readTime: '5 min read',
  },
  {
    title: 'The Future of CRM: AI-Driven Customer Insights',
    description: 'Discover how artificial intelligence is transforming customer relationship management and driving better business outcomes.',
    image: '/blog/crm-future.jpg',
    category: 'Technology',
    date: 'Mar 12, 2024',
    readTime: '4 min read',
  },
  {
    title: 'Data-Driven Decision Making with Analytics Dashboard',
    description: 'A comprehensive guide to using analytics for making informed business decisions and staying ahead of the competition.',
    image: '/blog/analytics.jpg',
    category: 'Analytics',
    date: 'Mar 10, 2024',
    readTime: '6 min read',
  },
];

const Blog = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animated-gradient-text">
            Latest from Our Blog
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Insights, updates, and expert tips to help you get the most out of our apps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {posts.map((post) => (
            <article
              key={post.title}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-full">
                    {post.category}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>{post.date}</span>
                    <span className="mx-2">•</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
                  {post.title}
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {post.description}
                </p>

                <Link
                  href="/blog"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
                >
                  Read More
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/blog"
            className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            View All Posts
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Blog; 