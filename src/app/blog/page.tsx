'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CalendarIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const BlogPage = () => {
  const posts = [
    {
      title: 'The Future of SaaS: Trends to Watch in 2024',
      description: 'Explore the emerging trends shaping the future of SaaS and how they will impact businesses in the coming years.',
      image: '/images/blog/saas-trends-2024.jpg',
      category: 'Industry Insights',
      date: 'March 15, 2024',
      readTime: '6 min read',
      slug: 'saas-trends-2024'
    },
    {
      title: 'Building Scalable SaaS Architecture',
      description: 'Learn the best practices for building and maintaining scalable SaaS applications that can grow with your business.',
      image: '/images/blog/scalable-architecture.jpg',
      category: 'Technical',
      date: 'March 10, 2024',
      readTime: '8 min read',
      slug: 'scalable-architecture'
    },
    {
      title: 'The Rise of No-Code Platforms',
      description: 'How no-code platforms are revolutionizing software development and empowering non-technical users.',
      image: '/images/blog/no-code-platforms.jpg',
      category: 'Industry Insights',
      date: 'March 5, 2024',
      readTime: '5 min read',
      slug: 'no-code-platforms'
    },
    {
      title: 'SaaS Security Best Practices',
      description: 'Essential security measures every SaaS company should implement to protect their users and data.',
      image: '/images/blog/saas-security.jpg',
      category: 'Security',
      date: 'February 28, 2024',
      readTime: '7 min read',
      slug: 'saas-security'
    }
  ];

  const categories = [
    { name: 'All', count: posts.length },
    { name: 'Industry Insights', count: posts.filter(p => p.category === 'Industry Insights').length },
    { name: 'Technical', count: posts.filter(p => p.category === 'Technical').length },
    { name: 'Security', count: posts.filter(p => p.category === 'Security').length }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-100 rounded-full filter blur-3xl opacity-60" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-60" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 animated-gradient-text">
            Insights & Updates
          </h1>
          <p className="text-xl text-gray-700 text-center max-w-2xl mx-auto mb-12">
            Stay informed with the latest trends, best practices, and company news
            from the CoFabri team.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Categories */}
          <div className="flex flex-wrap gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category.name}
                className="px-4 py-2 rounded-full bg-white text-gray-700 hover:bg-gray-50 transition"
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>

          {/* Blog Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition">
                  <div className="relative h-48">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {post.date}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {post.description}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <TagIcon className="w-4 h-4 mr-1" />
                      {post.category}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Newsletter */}
          <div className="mt-16">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
                <p className="text-blue-50 mb-6">
                  Subscribe to our newsletter to receive the latest updates and insights
                  directly in your inbox.
                </p>
                <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-50 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPage; 