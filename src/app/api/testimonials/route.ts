import { NextResponse } from 'next/server';
import { getTestimonials } from '@/lib/airtable';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    let testimonials = await getTestimonials(3);
    if (appId) {
      testimonials = testimonials.filter(t => Array.isArray(t.apps) && t.apps.includes(appId));
    }
    return NextResponse.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 }
    );
  }
} 