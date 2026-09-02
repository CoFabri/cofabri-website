import { NextRequest, NextResponse } from 'next/server';
import { getApp, type BetaStatement } from '@/lib/api-client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface AppData {
  betaSpotsTotal: number;
  betaSpotsFilled: number;
  betaDescription: string;
  status: string;
  name: string;
  betaStatements: BetaStatement[];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Fetching app data for ID:', id);

    // Fetch app data
    const app = await getApp(id);
    console.log('Raw app response:', app);

    if (!app) {
      throw new Error('Invalid app data response');
    }

    const response: AppData = {
      // Beta spot counts are not yet available from the new content API;
      // defaulting to 0/empty until that data model gap is resolved.
      betaSpotsTotal: 0,
      betaSpotsFilled: 0,
      betaDescription: '',
      status: app.status || 'Coming Soon',
      name: app.name || 'Unknown App',
      betaStatements: app.betaStatements || [],
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
