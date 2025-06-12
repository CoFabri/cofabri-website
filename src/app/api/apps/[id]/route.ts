import { NextResponse } from 'next/server';
import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN }).base(process.env.AIRTABLE_BASE_ID!);

interface Testimonial {
  ID: string;
  Statement: string;
}

interface AppData {
  betaSpotsTotal: number;
  betaSpotsFilled: number;
  betaDescription: string;
  status: string;
  name: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching app data for ID:', params.id);
    console.log('Using Airtable Base ID:', process.env.AIRTABLE_BASE_ID);
    
    // Fetch app data
    const appRecord = await base('Apps').find(params.id);
    console.log('Successfully fetched app record:', appRecord.id);
    
    // Fetch testimonials for this app
    const testimonialsTable = base('Beta Statements');
    console.log('Fetching testimonials for app ID:', params.id);
    
    // DEBUG: Fetch one record to inspect all fields
    const debugRecords = await testimonialsTable.select({
      maxRecords: 1,
    }).firstPage();
    
    if (debugRecords.length > 0) {
      console.log('DEBUG: Full fields of first Beta Statement record:', debugRecords[0].fields);
    }

    const testimonials = await testimonialsTable
      .select({
        filterByFormula: `{App Record ID} = '${params.id}'`,
        fields: ['ID', 'Statement']  
      })
      .all();
    
    console.log('Successfully fetched testimonials:', testimonials.length);
    if (testimonials.length > 0) {
      console.log('Sample testimonial:', testimonials[0].fields);
    }

    const response = {
      betaSpotsTotal: appRecord.get('Beta Spots Total'),
      betaSpotsFilled: appRecord.get('Beta Spots Filled'),
      betaDescription: appRecord.get('Beta Description'),
      status: appRecord.get('Status'),
      name: appRecord.get('Name'),
      testimonials: testimonials.map(t => ({
        ID: String(t.fields.ID),  
        Statement: t.fields.Statement
      }))
    };

    console.log('Prepared response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/apps/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch app data' },
      { status: 500 }
    );
  }
} 