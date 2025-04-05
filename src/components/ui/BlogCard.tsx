import Image from 'next/image';
import Link from 'next/link';
import { BlogPost } from '@/lib/airtable';
import { ClockIcon, UserIcon, TagIcon } from '@heroicons/react/24/outline';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition">
        {post.featuredImage && (
          <div className="relative w-full h-48">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
            {post.title}
          </h2>
          <p className="text-gray-600 mb-4">
            {post.excerpt || post.content.substring(0, 150)}...
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              <span>{post.readingTime} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>{post.authorId}</span>
            </div>
            <div className="flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              <span>{post.category}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
} 