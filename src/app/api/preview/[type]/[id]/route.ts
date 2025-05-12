import { NextResponse } from 'next/server';
import { getAirtableBase } from '@/lib/airtable';
import { FieldSet } from 'airtable';

// Map URL types to Airtable table names
const typeToTable: Record<string, string> = {
  'kb': 'Knowledge Base',
  'apps': 'Apps',
  'authors': 'Authors',
  'roadmap': 'Roadmap',
  'status': 'System Status',
  'marketing': 'Marketing Popups',
  'banner': 'Banners',
  'popup': 'Marketing Popups'
};

interface AuthorFields {
  Name: string;
  Role: string;
  Bio: string;
  Image?: { url: string }[];
  'Social Links'?: string[];
}

interface AirtableRecord {
  id: string;
  type: string;
  Author?: AuthorFields;
  [key: string]: any;
}

interface AirtableAttachment {
  url: string;
  [key: string]: any;
}

export async function GET(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const base = getAirtableBase();
    if (!base) {
      return NextResponse.json(
        { error: 'Airtable not configured' },
        { status: 500 }
      );
    }

    const { type, id } = params;
    const tableName = typeToTable[type];
    
    if (!tableName) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    try {
      const record = await base(tableName).find(id);
      const content = {
        ...record.fields,
        id: record.id,
        type
      };

      return NextResponse.json(content, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (error) {
      console.error('Error finding record:', error);
      return NextResponse.json(
        { error: 'Content not found', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error fetching preview content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 