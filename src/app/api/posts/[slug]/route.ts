import { NextResponse } from 'next/server';
import { getAirtableBase } from '@/lib/airtable';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const base = getAirtableBase();
    const records = await base('Blog Posts')
      .select({
        filterByFormula: `AND({Status} = 'Published', {Slug} = '${params.slug}')`,
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const record = records[0];
    const authorField = record.get('Author');
    console.log('Raw author field:', authorField);
    
    // Ensure we get a string ID, whether it's from an array or direct string
    const authorId = Array.isArray(authorField) 
      ? authorField[0] 
      : typeof authorField === 'string' 
        ? authorField 
        : authorField?.toString() || '';
        
    console.log('Processed author ID:', authorId);
    
    const post = {
      id: record.id,
      title: record.get('Title') as string,
      content: record.get('Content') as string,
      slug: record.get('Slug') as string,
      publishedAt: record.get('Published At') as string,
      authorId,
      featuredImage: record.get('Featured Image') as string,
      excerpt: record.get('Excerpt') as string,
      category: record.get('Category') as string || 'Uncategorized',
      tags: record.get('Tags') as string[],
      readingTime: record.get('Reading Time') as number,
      relatedPostIds: record.get('Related Posts') as string[] || [],
    };

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
} 