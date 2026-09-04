import { NextRequest, NextResponse } from 'next/server';
import { getApp, type BetaStatement } from '@/lib/api-client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface AppData {
  betaCapacity: number | null;
  betaSpotsFilled: number;
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

    const app = await getApp(id);

    if (!app) {
      throw new Error('Invalid app data response');
    }

    const response: AppData = {
      betaCapacity: app.betaCapacity ?? null,
      betaSpotsFilled: app.betaSpotsFilled ?? 0,
      status: app.status || 'Coming Soon',
      name: app.name || 'Unknown App',
      betaStatements: app.betaStatements || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/apps/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch app data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
