import { NextResponse } from 'next/server';
import { getKnowledgeBaseArticles } from '@/lib/airtable';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const articles = await getKnowledgeBaseArticles();
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching knowledge base articles:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge base articles' }, { status: 500 });
  }
} 