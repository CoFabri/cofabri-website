import { NextResponse } from 'next/server';
import { getBanners } from '@/lib/api-client';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(_request: Request) {
  try {
    console.log('Fetching banners...');
    const banners = await getBanners();
    console.log('Fetched banners:', banners.length);

    // getBanners() already only returns currently-active banners (the API
    // filters by is_active + date range server-side), so no further
    // active/date filtering is needed here. Shape the response to match
    // what SitewideBanner.tsx expects (isActive/position/link).
    const shaped = banners.map((banner) => ({
      id: banner.id,
      title: banner.title,
      message: banner.message,
      type: banner.type,
      isActive: true,
      position: 'Top' as const,
      link: banner.linkUrl
        ? {
            text: banner.linkText || 'Learn More',
            url: banner.linkUrl,
          }
        : undefined,
      backgroundColor: banner.backgroundColor,
      textColor: banner.textColor,
      priority: banner.priority,
    }));

    console.log('Returning banners:', shaped);
    return NextResponse.json(shaped);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}
