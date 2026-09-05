import { NextRequest, NextResponse } from 'next/server';
import {
  getApp,
  getKnowledgeBaseArticle,
  getRoadmapFeatures,
  getLegalDocument,
  getBanners,
  getMarketingPopupConfig,
} from '@/lib/api-client';
import { getSystemStatus } from '@/lib/status-api';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Content types that are not available for preview, and why. `authors` is a
// known gap: no getAuthors()/getAuthor() exists anywhere in api-client.ts,
// and the old Airtable-based preview never had a dedicated rendering card
// for it either. `testimonial` is different — testimonials were removed
// from both the app and the database entirely, so there's nothing left to
// preview, permanently rather than pending future work.
const UNAVAILABLE_TYPES: Record<string, string> = {
  authors: 'Preview for content type "authors" is not available yet. api-client.ts has no getAuthors()/getAuthor() function — this is a known gap from the Airtable-to-Supabase migration.',
  testimonial: 'Preview for content type "testimonial" is no longer available. Testimonials were removed from the app and the database.',
};

// Required fields per type, used to compute the "ready to post" state. Field
// names match the properties actually present on the objects returned below
// (which mirror the api-client.ts interfaces), not the old Airtable field
// names.
const requiredFieldsMap: Record<string, string[]> = {
  kb: ['title', 'content', 'slug', 'category'],
  apps: ['name', 'description', 'status', 'category', 'url'],
  roadmap: ['name', 'description', 'status'],
  legal: ['title', 'documentType', 'status'],
  banner: ['title', 'message', 'bannerType'],
  marketing: ['title', 'content', 'buttonText', 'buttonLink'],
  popup: ['title', 'content', 'buttonText', 'buttonLink'],
  status: ['title', 'message', 'severity'],
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;
    console.log('Fetching preview for:', { type, id });

    if (type in UNAVAILABLE_TYPES) {
      console.error(`Preview type "${type}" is not available: ${UNAVAILABLE_TYPES[type]}`);
      return NextResponse.json({ error: UNAVAILABLE_TYPES[type] }, { status: 404 });
    }

    let payload: Record<string, unknown> | null = null;

    switch (type) {
      case 'kb': {
        const article = await getKnowledgeBaseArticle(id);
        if (article) payload = { ...article, id: article.id };
        break;
      }

      case 'apps': {
        const app = await getApp(id);
        if (app) payload = { ...app, id: app.id };
        break;
      }

      case 'roadmap': {
        // No single-item getter exists; data volume is small (~8 items), so
        // fetch the full list and find by id client-side.
        const features = await getRoadmapFeatures();
        const feature = features.find((f) => f.id === id) || null;
        if (feature) payload = { ...feature, id: feature.id };
        break;
      }

      case 'legal': {
        const doc = await getLegalDocument(id);
        if (doc) payload = { ...doc, id: doc.id };
        break;
      }

      case 'banner': {
        const banners = await getBanners();
        const banner = banners.find((b) => b.id === id) || null;
        if (banner) {
          // Banner.type ("info"/"warning"/etc) would otherwise collide with
          // the preview envelope's own `type` field ("banner"), so it's
          // exposed here as `bannerType` instead.
          const { type: bannerType, ...rest } = banner;
          payload = { ...rest, bannerType, id: banner.id };
        }
        break;
      }

      case 'marketing':
      case 'popup': {
        // Singleton config, no id lookup needed.
        const config = await getMarketingPopupConfig();
        if (config) payload = { ...config, id: 'marketing-popup' };
        break;
      }

      case 'status': {
        const statuses = await getSystemStatus();
        const status = statuses.find((s) => s.ticketId === id) || null;
        if (status) {
          payload = { ...status, id: status.ticketId };
        }
        break;
      }

      default:
        console.error('Invalid content type:', type);
        return NextResponse.json(
          { error: 'Invalid content type' },
          { status: 400 }
        );
    }

    if (!payload) {
      console.error('Record not found');
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    const requiredFields = requiredFieldsMap[type] || [];
    const missingFields = requiredFields.filter((field) => {
      const value = payload![field];
      return (
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      );
    });
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ...payload,
      type,
    });
  } catch (error) {
    console.error('Error finding record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch record' },
      { status: 500 }
    );
  }
}
