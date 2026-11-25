import { NextResponse } from 'next/server';
import { getServices } from '@/lib/api-client';

// The visible services (project_type cofabri_service), for the contact form's related-app list.
// Same shape and rules as /api/apps; the API only returns rows flagged display_on_website.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getServices());
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
