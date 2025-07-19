import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const AIRTABLE_API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

interface AppData {
  betaSpotsTotal: number;
  betaSpotsFilled: number;
  betaDescription: string;
  status: string;
  name: string;
  testimonials: Array<{
    ID: string;
    Statement: string;
  }>;
}

async function fetchFromAirtable(endpoint: string) {
  try {
    const response = await fetch(`${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Airtable API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        endpoint
      });
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Airtable response:', { endpoint, data });
    return data;
  } catch (error) {
    console.error('Error in fetchFromAirtable:', error);
    throw error;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching app data for ID:', params.id);
    
    // Fetch app data
    const appResponse = await fetchFromAirtable(`Apps/${params.id}`);
    console.log('Raw app response:', appResponse);
    
    if (!appResponse || !appResponse.fields) {
      throw new Error('Invalid app data response');
    }
    
    // Fetch testimonials
    const testimonialsResponse = await fetchFromAirtable(
      `Beta Statements?filterByFormula={App Record ID}='${params.id}'&fields[]=ID&fields[]=Statement`
    );
    
    const testimonials = testimonialsResponse.records?.map((record: any) => ({
      ID: String(record.fields.ID),
      Statement: record.fields.Statement
    })) || [];

    const response: AppData = {
      betaSpotsTotal: appResponse.fields['Beta Spots Total'] || 0,
      betaSpotsFilled: appResponse.fields['Beta Spots Filled'] || 0,
      betaDescription: appResponse.fields['Beta Description'] || '',
      status: appResponse.fields['Status'] || 'Coming Soon',
      name: appResponse.fields['Name'] || 'Unknown App',
      testimonials
    };

    console.log('Prepared response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/apps/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch app data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 