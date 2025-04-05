import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogPost } from '@/lib/airtable';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface AirtableImage {
  url: string;
  width: number;
  height: number;
  filename: string;
}

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getBlogPost(params.slug);
  if (!post) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  return {
    title: post.title,
    description: post.excerpt || post.content.substring(0, 160),
    openGraph: {
      title: post.title,
      description: post.excerpt || post.content.substring(0, 160),
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.authorId],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPost(params.slug);
  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Featured Image */}
            <div className="relative w-full h-[400px] mb-8 rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={post.featuredImage || '/images/placeholder.jpg'}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute top-6 left-6 z-10">
                <Link 
                  href="/blog" 
                  className="inline-flex items-center px-4 py-2 text-sm text-white bg-black/30 backdrop-blur-sm rounded-lg hover:bg-black/40 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Blog
                </Link>
              </div>
            </div>

            {/* Content Container */}
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">{post.title}</h1>
              
              {post.excerpt && (
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">{post.excerpt}</p>
              )}

              <div className="flex items-center gap-8 text-sm mb-8 pb-8 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Image
                      src={Array.isArray(post.authorImage) && post.authorImage[0]?.url || '/images/placeholder-avatar.jpg'}
                      alt={post.authorId}
                      width={32}
                      height={32}
                      className="rounded-full ring-2 ring-white shadow-sm"
                    />
                  </div>
                  <span className="font-medium text-gray-900">{post.authorId}</span>
                </div>
                <div className="text-gray-500">{post.readingTime} min read</div>
                <div className="text-gray-500">{post.category}</div>
                <time className="text-gray-500" dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog/tag/${tag.toLowerCase()}`}
                      className="px-4 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors duration-200"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="prose prose-lg prose-gray max-w-none mb-12">
                <div 
                  className="text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: post.content }} 
                />
              </div>

              {/* Share Section */}
              <div className="flex items-center gap-4 pt-8 border-t border-gray-100">
                <button className="px-6 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">Share</button>
                <button className="px-6 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">Copy Link</button>
              </div>
            </div>

            {/* Bottom Newsletter */}
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Stay Updated</h2>
              <p className="text-gray-600 mb-6">
                Subscribe to our newsletter to get the latest insights and updates delivered straight to your inbox.
              </p>
              <div className="flex gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
                <button className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow">
                  Subscribe Now
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Author Profile */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <Image
                    src={Array.isArray(post.authorImage) && post.authorImage[0]?.url || '/images/placeholder-avatar.jpg'}
                    alt={post.authorId}
                    width={56}
                    height={56}
                    className="rounded-full ring-4 ring-white shadow-md"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{post.authorId}</h3>
                  {post.authorRole && (
                    <p className="text-sm text-gray-500">{post.authorRole}</p>
                  )}
                </div>
              </div>
              {post.authorBio && (
                <p className="text-sm text-gray-600 leading-relaxed">{post.authorBio}</p>
              )}
            </div>

            {/* Sidebar Newsletter */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Newsletter</h2>
              <p className="text-sm text-gray-600 mb-6">
                Get the latest insights delivered to your inbox.
              </p>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
                <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow">
                  Subscribe Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 