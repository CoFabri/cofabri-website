import { NextResponse } from 'next/server';
import { getAirtableRecords } from '@/lib/airtable';
import type { FieldSet, Record } from 'airtable';

export async function GET() {
  try {
    console.log('Fetching banners from Airtable...');
    const records = await getAirtableRecords('Sitewide Banners');
    console.log('Fetched records:', records.length);
    
    const banners = records.map((record: Record<FieldSet>) => {
      const banner = {
        id: record.id,
        title: record.get('Title') as string,
        message: record.get('Message') as string,
        type: record.get('Type') as 'Info' | 'Success' | 'Warning' | 'Error',
        startDate: record.get('Start Date') as string,
        endDate: record.get('End Date') as string,
        isActive: record.get('Is Active') as boolean,
        linkUrl: record.get('Link URL') as string,
        linkText: record.get('Link Text') as string,
        backgroundColor: record.get('Background Color') as 'Default' | 'Blue' | 'Green' | 'Yellow' | 'Red',
        textColor: record.get('Text Color') as 'White' | 'Dark',
        position: record.get('Position') as 'Top' | 'Bottom',
        priority: record.get('Priority') as number,
      };
      console.log('Processed banner:', banner);
      return banner;
    });

    console.log('Returning banners:', banners);
    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
} 