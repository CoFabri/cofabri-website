import { getRoadmapFeatures } from '@/lib/airtable';
import { NextResponse } from 'next/server';

export const revalidate = 3600; // Revalidate every hour

export async function GET(request: Request) {
  try {
    const features = await getRoadmapFeatures();
    
    if (!features || features.length === 0) {
      return NextResponse.json({ error: 'No roadmap features found' }, { status: 404 });
    }

    return NextResponse.json(features);
  } catch (error) {
    console.error('API Route: Error fetching roadmap features:', error);
    return NextResponse.json({ error: 'Failed to fetch roadmap features' }, { status: 500 });
  }
} 