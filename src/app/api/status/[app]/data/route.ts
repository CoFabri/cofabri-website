import { getSystemStatus, SystemStatus } from '@/lib/airtable';
import { incidentHexColor, incidentWidgetMessage, mostSevereStatus } from '@/lib/status-widget-colors';
import { NextRequest, NextResponse } from 'next/server';

// JSON counterpart to the iframe-based /api/status/[app] widget. Embedding
// sites fetch this client-side and render the dot + text as real DOM in
// their own page, so it inherits their actual fonts/colors instead of the
// iframe version's best-effort (and, cross-origin, non-functional) style
// inheritance. Public and unauthenticated like the iframe route — this is
// the same status data, just JSON instead of an HTML document.
export const dynamic = 'force-dynamic';

let statusCache: SystemStatus[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ app: string }> }) {
  try {
    const { app: appSlug } = await params;
    const now = Date.now();

    if (!statusCache || now - cacheTimestamp >= CACHE_DURATION) {
      statusCache = await getSystemStatus();
      cacheTimestamp = now;
    }

    // Same filtering rules as the iframe route: always include CoFabri API
    // issues, plus anything tagged directly for this app or listed in its
    // affected services.
    const relevantStatuses = statusCache.filter((status: SystemStatus) => {
      if (status.application === 'CoFabri API') return true;

      if (status.application) {
        const normalizedAppName = status.application.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedSlug = appSlug.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedAppName === normalizedSlug) return true;
      }

      if (status.affectedServices && Array.isArray(status.affectedServices)) {
        return status.affectedServices.some((service: string) => {
          const normalizedService = service.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normalizedSlug = appSlug.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalizedService.includes(normalizedSlug);
        });
      }

      return false;
    });

    const mostSevere = mostSevereStatus(relevantStatuses);

    return NextResponse.json(
      { color: incidentHexColor(mostSevere?.publicStatus), text: incidentWidgetMessage(mostSevere) },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('Error generating status data:', error);
    return NextResponse.json(
      { color: '#9ca3af', text: 'Status unavailable' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
