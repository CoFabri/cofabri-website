import { NextResponse } from 'next/server';
import { getAirtableRecords, AirtableRecord } from '@/lib/airtable';
import { FieldSet } from 'airtable';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

interface BannerFields extends FieldSet {
  Title: string;
  Message: string;
  Type: 'Info' | 'Success' | 'Warning' | 'Error';
  'Start Date': string;
  'End Date': string;
  'Is Active': boolean;
  'Link URL'?: string;
  'Link Text'?: string;
  'Background Color'?: 'Default' | 'Blue' | 'Green' | 'Yellow' | 'Red';
  'Text Color'?: 'White' | 'Dark';
  'Position'?: 'Top' | 'Bottom';
  Priority?: number;
  [key: string]: any; // Add index signature to satisfy FieldSet constraint
}

export async function GET(request: Request) {
  try {
    console.log('Fetching banners from Airtable...');
    const records = await getAirtableRecords<BannerFields>('Sitewide Banners', {
      filterByFormula: '{Is Active}=TRUE()',
      sort: [{ field: 'Priority', direction: 'desc' }]
    });
    console.log('Fetched records:', records.length);
    
    // For now, show all active banners regardless of date
    // TODO: Implement proper date filtering logic
    const activeRecords = records;
    console.log('Using all active banners (date filtering disabled)');
    
    const banners = activeRecords.map((record: AirtableRecord<BannerFields>) => {
      try {
        // Validate required fields
        if (!record.fields.Title || !record.fields.Message || !record.fields.Type) {
          console.warn('Skipping banner with missing required fields:', record.id);
          return null;
        }

        // Validate and process link URL
        let linkUrl = record.fields['Link URL'];
        if (linkUrl) {
          try {
            if (!linkUrl.startsWith('http')) {
              linkUrl = `https://${linkUrl}`;
            }
            new URL(linkUrl); // Validate URL
          } catch (e) {
            console.warn(`Invalid link URL for banner ${record.id}:`, linkUrl);
            linkUrl = undefined;
          }
        }

        const banner = {
          id: record.id,
          title: record.fields.Title,
          message: record.fields.Message,
          type: record.fields.Type,
          startDate: record.fields['Start Date'] || new Date().toISOString(),
          endDate: record.fields['End Date'] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default to 30 days from now
          isActive: record.fields['Is Active'] ?? true,
          link: linkUrl ? {
            text: record.fields['Link Text'] || 'Learn More',
            url: linkUrl
          } : undefined,
          backgroundColor: record.fields['Background Color'] || 'Default',
          textColor: record.fields['Text Color'] || 'Dark',
          position: record.fields['Position'] || 'Top',
          priority: record.fields.Priority || 0,
        };
        console.log('Processed banner:', banner);
        return banner;
      } catch (error) {
        console.error('Error processing banner record:', record.id, error);
        return null;
      }
    }).filter(Boolean); // Remove any null entries

    console.log('Returning banners:', banners);
    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
} 