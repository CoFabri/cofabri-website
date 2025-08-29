import { NextResponse } from 'next/server';
import { getLegalDocuments } from '@/lib/airtable';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const documents = await getLegalDocuments();
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching legal documents:', error);
    return NextResponse.json({ error: 'Failed to fetch legal documents' }, { status: 500 });
  }
}
