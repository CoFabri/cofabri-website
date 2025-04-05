import { NextResponse } from 'next/server';
import { getKnowledgeBaseArticles } from '@/lib/airtable';

export async function GET() {
  try {
    console.log('Fetching knowledge base articles...');
    const articles = await getKnowledgeBaseArticles();
    console.log('Fetched articles:', articles);
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching knowledge base articles:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge base articles' }, { status: 500 });
  }
} 