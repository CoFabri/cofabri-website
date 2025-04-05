import { getRoadmapFeatures } from '@/lib/airtable';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('API Route: Starting to fetch roadmap features...');
    const features = await getRoadmapFeatures();
    console.log('API Route: Successfully fetched features:', JSON.stringify(features, null, 2));
    
    if (!features || features.length === 0) {
      console.log('API Route: No features found');
      return NextResponse.json({ error: 'No roadmap features found' }, { status: 404 });
    }

    return NextResponse.json(features);
  } catch (error) {
    console.error('API Route: Error fetching roadmap features:', error);
    return NextResponse.json({ error: 'Failed to fetch roadmap features' }, { status: 500 });
  }
} 