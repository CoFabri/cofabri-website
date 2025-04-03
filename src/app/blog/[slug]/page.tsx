'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ClockIcon, 
  UserIcon,
  CalendarIcon,
  ShareIcon,
  ChevronRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const BlogPost = ({ params }: { params: { slug: string } }) => {
  // This would normally come from an API or database
  const post = {
    title: 'The Future of SaaS: Trends to Watch in 2024',
    description: 'Explore the emerging trends shaping the future of SaaS and how they will impact businesses in the coming years.',
    author: {
      name: 'Michael Chen',
      role: 'Product Strategist',
      image: '/images/authors/michael-chen.jpg'
    },
    date: 'March 15, 2024',
    readTime: '6 min read',
    category: 'Industry Insights',
    coverImage: '/images/blog/saas-trends-2024.jpg',
    content: `
      <h2>Introduction</h2>
      <p>The SaaS industry continues to evolve at a rapid pace, bringing new opportunities and challenges for businesses. In this article, we'll explore the key trends that are shaping the future of SaaS in 2024 and beyond.</p>

      <h2>1. AI-Powered SaaS Solutions</h2>
      <p>Artificial Intelligence is no longer just a buzzword - it's becoming an integral part of SaaS applications. From predictive analytics to automated customer service, AI is transforming how businesses operate and serve their customers.</p>

      <h2>2. Vertical SaaS Growth</h2>
      <p>While horizontal SaaS solutions continue to dominate the market, we're seeing a significant rise in vertical SaaS solutions that cater to specific industries. These specialized solutions offer deeper functionality and better alignment with industry-specific needs.</p>

      <h2>3. Enhanced Security Measures</h2>
      <p>With the increasing frequency and sophistication of cyber threats, SaaS providers are implementing more robust security measures. Zero-trust architecture and advanced encryption are becoming standard features rather than premium add-ons.</p>

      <h2>4. Integration Capabilities</h2>
      <p>The ability to seamlessly integrate with other tools and platforms is becoming a crucial factor in SaaS adoption. APIs and pre-built integrations are now key selling points for SaaS products.</p>
    `,
    relatedPosts: [
      {
        title: 'Building a Scalable SaaS Architecture',
        slug: 'building-scalable-saas-architecture',
        image: '/images/blog/scalable-architecture.jpg'
      },
      {
        title: 'The Rise of No-Code Platforms',
        slug: 'rise-of-no-code-platforms',
        image: '/images/blog/no-code-platforms.jpg'
      },
      {
        title: 'SaaS Security Best Practices',
        slug: 'saas-security-best-practices',
        image: '/images/blog/saas-security.jpg'
      }
    ]
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = post.title;
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <ChevronRightIcon className="w-4 h-4" />
            <Link href="/blog" className="hover:text-blue-600">Blog</Link>
            <ChevronRightIcon className="w-4 h-4" />
            <span className="text-gray-900">{post.title}</span>
          </div>
        </div>
      </div>

      {/* Article Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-12">
          <Link 
            href="/blog"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>

          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 animated-gradient-text">
              {post.title}
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              {post.description}
            </p>

            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                    <Image
                      src={post.author.image}
                      alt={post.author.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{post.author.name}</div>
                    <div className="text-sm text-gray-500">{post.author.role}</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  {post.date}
                </div>
                <div className="flex items-center text-gray-600">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  {post.readTime}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleShare('twitter')}
                  className="p-2 text-gray-600 hover:text-blue-500 transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="p-2 text-gray-600 hover:text-blue-700 transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="p-2 text-gray-600 hover:text-blue-600 transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="relative w-full h-[400px]">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8 prose prose-lg max-w-none">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Author Bio */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">About the Author</h3>
              <div className="flex items-center mb-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
                  <Image
                    src={post.author.image}
                    alt={post.author.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-medium">{post.author.name}</h4>
                  <p className="text-gray-600">{post.author.role}</p>
                </div>
              </div>
              <p className="text-gray-600">
                Michael is a product strategist with over 10 years of experience in the SaaS industry.
                He specializes in emerging technologies and their impact on business transformation.
              </p>
            </div>

            {/* Related Posts */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Related Posts</h3>
              <div className="space-y-4">
                {post.relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="block"
                  >
                    <div className="relative w-full h-32 rounded-lg overflow-hidden mb-2">
                      <Image
                        src={related.image}
                        alt={related.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h4 className="text-blue-600 font-medium hover:text-blue-700 transition">
                      {related.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
              <p className="mb-4 text-blue-50">
                Get the latest insights and trends delivered to your inbox.
              </p>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-50 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogPost; 