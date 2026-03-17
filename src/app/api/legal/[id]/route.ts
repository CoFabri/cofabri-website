import { NextRequest, NextResponse } from 'next/server';
import { getLegalDocument } from '@/lib/airtable';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await getLegalDocument(id);
    
    if (!document) {
      return NextResponse.json({ error: 'Legal document not found' }, { status: 404 });
    }
    
    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching legal document:', error);
    return NextResponse.json({ error: 'Failed to fetch legal document' }, { status: 500 });
  }
}
