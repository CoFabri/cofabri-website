import { NextResponse } from 'next/server';

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
        error: errorData
      });
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    return response.json();
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
    const appData = await fetchFromAirtable(`Apps/${params.id}`);
    console.log('Successfully fetched app record:', appData.id);
    
    // Fetch testimonials
    const testimonialsResponse = await fetchFromAirtable(
      `Beta Statements?filterByFormula={App Record ID}='${params.id}'&fields[]=ID&fields[]=Statement`
    );
    
    const testimonials = testimonialsResponse.records.map((record: any) => ({
      ID: String(record.fields.ID),
      Statement: record.fields.Statement
    }));

    const response: AppData = {
      betaSpotsTotal: appData.fields['Beta Spots Total'] || 0,
      betaSpotsFilled: appData.fields['Beta Spots Filled'] || 0,
      betaDescription: appData.fields['Beta Description'] || '',
      status: appData.fields['Status'] || 'Coming Soon',
      name: appData.fields['Name'] || 'Unknown App',
      testimonials
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