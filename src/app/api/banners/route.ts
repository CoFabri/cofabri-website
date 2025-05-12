import { NextResponse } from 'next/server';
import { getAirtableRecords, AirtableRecord } from '@/lib/airtable';

interface BannerFields {
  Title: string;
  Message: string;
  Type: 'Info' | 'Success' | 'Warning' | 'Error';
  'Start Date': string;
  'End Date': string;
  'Is Active': boolean;
  'Link URL'?: string;
  'Link Text'?: string;
  'Background Color': 'Default' | 'Blue' | 'Green' | 'Yellow' | 'Red';
  'Text Color': 'White' | 'Dark';
  'Position': 'Top' | 'Bottom';
  Priority?: number;
}

export const revalidate = 300; // Revalidate every 5 minutes

export async function GET(request: Request) {
  try {
    console.log('Fetching banners from Airtable...');
    const records = await getAirtableRecords<BannerFields>('Sitewide Banners');
    console.log('Fetched records:', records.length);
    
    const banners = records.map((record: AirtableRecord<BannerFields>) => {
      const banner = {
        id: record.id,
        title: record.fields.Title,
        message: record.fields.Message,
        type: record.fields.Type,
        startDate: record.fields['Start Date'],
        endDate: record.fields['End Date'],
        isActive: record.fields['Is Active'],
        linkUrl: record.fields['Link URL'],
        linkText: record.fields['Link Text'],
        backgroundColor: record.fields['Background Color'],
        textColor: record.fields['Text Color'],
        position: record.fields['Position'],
        priority: record.fields.Priority || 0,
      };
      console.log('Processed banner:', banner);
      return banner;
    });

    console.log('Returning banners:', banners);
    return NextResponse.json(banners, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
} 