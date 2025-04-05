import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogPost } from '@/lib/airtable';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeftIcon, BookOpenIcon, ClockIcon, TagIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import BackButton from '@/components/ui/BackButton';
import NewsletterSignup from '@/components/ui/NewsletterSignup';

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Featured Image Section */}
      {post.featuredImage && (
        <div className="relative w-full h-[70vh] min-h-[500px] max-h-[700px]">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
          <div className="absolute top-8 left-8 z-10">
            <BackButton />
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Content */}
          <div className="flex-1">
            {/* Title and Metadata */}
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight">{post.title}</h1>
              
              <div className="flex flex-wrap items-center gap-8 text-gray-600 mb-8">
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="h-5 w-5 text-blue-500" />
                  <span className="text-gray-900 font-medium">{post.authorId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-blue-500" />
                  <span>{post.readingTime} min read</span>
                </div>
                <div className="flex items-center gap-2">
                  <TagIcon className="h-5 w-5 text-blue-500" />
                  <span>{post.category}</span>
                </div>
                <time dateTime={post.publishedAt} className="text-gray-500">
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-10">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50/80 rounded-full ring-1 ring-blue-100/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Excerpt */}
              {post.excerpt && (
                <div className="prose prose-lg mb-12">
                  <p className="text-xl text-gray-600 italic border-l-4 border-blue-500/50 pl-6">{post.excerpt}</p>
                </div>
              )}

              {/* Content */}
              <div className="prose prose-lg max-w-none mb-12">
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: post.content }} 
                />
              </div>

              {/* Bottom Newsletter Signup - Hidden on Mobile */}
              <div className="hidden md:block bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-sm ring-1 ring-blue-100/50">
                <div className="flex items-center gap-3 mb-4">
                  <EnvelopeIcon className="h-6 w-6 text-blue-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Stay Updated</h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Subscribe to our newsletter to get the latest insights and updates delivered straight to your inbox.
                </p>
                <NewsletterSignup />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-8">
            {/* Author Profile */}
            {post.authorId && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/50 p-6 shadow-sm ring-1 ring-gray-100/50">
                <div className="flex items-center gap-4 mb-4">
                  {post.authorImage && (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-blue-100/50">
                      <Image
                        src={post.authorImage}
                        alt={post.authorId}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{post.authorId}</h3>
                    {post.authorRole && (
                      <p className="text-sm text-gray-600">{post.authorRole}</p>
                    )}
                  </div>
                </div>
                {post.authorBio && (
                  <p className="text-gray-600 mb-4">{post.authorBio}</p>
                )}
                {post.authorSocial && post.authorSocial.length > 0 && (
                  <div className="flex gap-4">
                    {post.authorSocial.map((social) => (
                      <Link
                        key={social.platform}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        dangerouslySetInnerHTML={{ __html: social.icon }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sidebar Newsletter Signup */}
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm ring-1 ring-blue-100/50">
              <div className="flex items-center gap-3 mb-4">
                <EnvelopeIcon className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">Newsletter</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Get the latest insights delivered to your inbox.
              </p>
              <NewsletterSignup />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 