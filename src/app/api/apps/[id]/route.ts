import { NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

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

async function fetchFromAirtable(endpoint: string) {
  const response = await fetch(`${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.statusText}`);
  }

  return response.json();
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

    const response = {
      betaSpotsTotal: appData.fields['Beta Spots Total'],
      betaSpotsFilled: appData.fields['Beta Spots Filled'],
      betaDescription: appData.fields['Beta Description'],
      status: appData.fields['Status'],
      name: appData.fields['Name'],
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