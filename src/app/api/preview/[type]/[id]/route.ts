import { NextResponse } from 'next/server';
import { getAirtableBase } from '@/lib/airtable';
import { FieldSet } from 'airtable';

// Map URL types to Airtable table names
const typeToTable: Record<string, string> = {
  'blog': 'Blog Posts',
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
    const { type, id } = params;
    console.log('Fetching preview for:', { type, id });
    
    const table = typeToTable[type];
    console.log('Mapped table:', table);

    if (!table) {
      console.log('Invalid content type:', type);
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    const base = getAirtableBase();
    if (!base) {
      console.log('Airtable not configured');
      return NextResponse.json(
        { error: 'Airtable not configured' },
        { status: 500 }
      );
    }

    try {
      console.log('Attempting to find record in table:', table);
      // Ensure we're getting the correct record by ID
      const record = await base(table).find(id);
      console.log('Found record:', record.id);
      
      // Get all fields from the record
      const fields = record.fields as Record<string, any>;
      console.log('Record fields:', Object.keys(fields));
      
      // Create content object with only the fields that exist in Airtable
      const content: AirtableRecord = {
        id: record.id,
        type,
      };

      // Only include fields that exist in the record and are not empty
      Object.keys(fields).forEach(key => {
        const value = fields[key];
        if (value !== undefined && value !== null && value !== '') {
          content[key] = value;
        }
      });

      console.log('Processed content:', content);

      // If this is a blog post, fetch the author data
      if (type === 'blog' && content.Author) {
        const authorId = Array.isArray(content.Author) ? content.Author[0] : content.Author;
        try {
          const authorRecord = await base('Authors').find(authorId);
          const fields = authorRecord.fields as Record<string, any>;
          
          content.Author = {
            Name: fields.Name as string,
            Role: fields.Role as string,
            Bio: fields.Bio as string,
            Image: Array.isArray(fields.Image) && fields.Image.length > 0 
              ? [{ url: (fields.Image[0] as any).url }] 
              : undefined,
            'Social Links': fields['Social Links'] as string[]
          };
        } catch (error) {
          console.error('Error fetching author:', error);
        }
      }

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