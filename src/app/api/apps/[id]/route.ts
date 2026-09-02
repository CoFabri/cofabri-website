import { NextRequest, NextResponse } from 'next/server';
import { getApp, getTestimonials } from '@/lib/api-client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

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

    // Fetch approved testimonials for this app only
    const allTestimonials = await getTestimonials();
    const testimonials = allTestimonials
      .filter((t) => t.isActive && t.apps.includes(id))
      .map((t) => ({
        ID: t.id,
        Statement: t.content,
      }));

    const response: AppData = {
      // Beta spot counts are not yet available from the new content API;
      // defaulting to 0/empty until that data model gap is resolved.
      betaSpotsTotal: 0,
      betaSpotsFilled: 0,
      betaDescription: '',
      status: app.status || 'Coming Soon',
      name: app.name || 'Unknown App',
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
