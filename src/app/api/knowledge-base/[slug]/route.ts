import { NextResponse } from 'next/server';
import { getKnowledgeBaseArticle } from '@/lib/airtable';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const article = await getKnowledgeBaseArticle(params.slug);
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    
    // Debug logging
    console.log('API Response:', article);
    console.log('Published At:', article.publishedAt);
    
    return NextResponse.json(article);
  } catch (error) {
    console.error('Error fetching knowledge base article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
} 