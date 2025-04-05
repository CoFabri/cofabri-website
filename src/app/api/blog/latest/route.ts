import { NextResponse } from 'next/server';
import { getBlogPosts } from '@/lib/airtable';

export async function GET() {
  try {
    const posts = await getBlogPosts();
    
    // Sort posts by publishedAt date in descending order (latest first)
    const sortedPosts = posts.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });

    // Return only the first 3 posts
    const latestPosts = sortedPosts.slice(0, 3);

    return NextResponse.json(latestPosts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
} 