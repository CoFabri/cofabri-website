import { NextResponse } from 'next/server';
import { fetchFromAirtable, AirtableRecord } from '@/lib/airtable';
import { FieldSet } from 'airtable';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Map URL types to Airtable table names
const typeToTable: Record<string, string> = {
  'kb': 'Knowledge Base',
  'apps': 'Apps',
  'authors': 'Authors',
  'roadmap': 'Roadmap',
  'status': 'System Status',
  'marketing': 'Marketing Popups',
  'banner': 'Sitewide Banners',
  'popup': 'Marketing Popups',
  'testimonial': 'Testimonials'
};

interface AuthorFields {
  Name: string;
  Role: string;
  Bio: string;
  Image?: { url: string }[];
  'Social Links'?: string[];
}

// Define required fields for each content type
const requiredFieldsMap = {
  kb: ['Title', 'Content', 'Slug', 'Category'],
  apps: [
    'Name',
    'Description',
    'Application Status',
    'Category',
    'URL'
  ],
  authors: ['Name', 'Role'],
  roadmap: ['Name', 'Description', 'Status'],
  status: ['Title', 'Message', 'Severity'],
  testimonial: ['Name', 'Role', 'Company', 'Content', 'Rating', 'Profile Image']
};

export async function GET(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = params;
    console.log('Fetching preview for:', { type, id });
    
    const tableName = typeToTable[type];
    console.log('Table name:', tableName);
    
    if (!tableName) {
      console.error('Invalid content type:', type);
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    console.log('Attempting to find record in table:', tableName, 'with id:', id);
    
    const records = await fetchFromAirtable<FieldSet>(tableName, {
      filterByFormula: `RECORD_ID() = '${id}'`
    });

    if (records.length === 0) {
      console.error('Record not found');
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    const record = records[0];
    const requiredFields = requiredFieldsMap[type as keyof typeof requiredFieldsMap] || [];

    // Check if all required fields are present
    const missingFields = requiredFields.filter(field => !record.fields[field]);
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: record.id,
      type,
      ...record.fields
    });
  } catch (error) {
    console.error('Error finding record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch record' },
      { status: 500 }
    );
  }
} 