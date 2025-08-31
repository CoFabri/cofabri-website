import { getSystemStatus } from '@/lib/airtable';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// In-memory cache for status data (shared with main status endpoint)
let statusCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET(request: Request) {
  try {
    const now = Date.now();
    
    // Check if we have valid cached data
    if (statusCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Serving status widget from cache');
    } else {
      // Fetch fresh data from Airtable
      console.log('Fetching fresh status for widget from Airtable');
      statusCache = await getSystemStatus();
      cacheTimestamp = now;
    }
    
    const statuses = statusCache;
    
    // Get most severe status for color
    const getStatusPriority = (status: string) => {
      const priorities: Record<string, number> = { 'Investigating': 3, 'Identified': 2, 'Monitoring': 1, 'Resolved': 0 };
      return priorities[status] || 0;
    };
    
    const activeStatuses = statuses.filter((s: any) => s.publicStatus !== 'Resolved');
    const mostSevere = activeStatuses.length > 0 
      ? activeStatuses.reduce((prev: any, curr: any) => 
          getStatusPriority(curr.publicStatus) > getStatusPriority(prev.publicStatus) ? curr : prev
        )
      : null;
    
    const getStatusColor = () => {
      if (!statuses || statuses.length === 0) return '#10b981'; // Green
      if (!mostSevere) return '#10b981'; // Green
      
      switch (mostSevere.publicStatus) {
        case 'Investigating': return '#ef4444'; // Red
        case 'Identified': return '#f97316'; // Orange
        case 'Monitoring': return '#3b82f6'; // Blue
        default: return '#10b981'; // Green
      }
    };
    
    const statusColor = getStatusColor();
    const statusText = !statuses || statuses.length === 0 
      ? 'System Status' 
      : mostSevere 
        ? `System Status - ${mostSevere.publicStatus}`
        : 'System Status';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CoFabri System Status</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: transparent;
        }
        .status-widget {
            display: inline-flex;
            align-items: center;
            gap: 0.5em;
            text-decoration: none;
            background: transparent;
            border: none;
            transition: opacity 0.2s ease;
            /* Inherit font properties from parent */
            font-family: inherit;
            font-size: inherit;
            font-weight: inherit;
            color: inherit;
            line-height: inherit;
        }
        .status-widget:hover {
            opacity: 0.8;
        }
        .status-dot {
            width: 0.5em;
            height: 0.5em;
            border-radius: 50%;
            background-color: ${statusColor};
            flex-shrink: 0;
            /* Scale dot size relative to font size */
            min-width: 6px;
            min-height: 6px;
            max-width: 12px;
            max-height: 12px;
        }
        .status-text {
            white-space: nowrap;
        }
    </style>
</head>
<body>
    <a href="https://cofabri.com/status" target="_blank" rel="noopener noreferrer" class="status-widget">
        <div class="status-dot"></div>
        <span class="status-text">${statusText}</span>
    </a>
    <script>
        // Auto-refresh every 5 minutes
        setTimeout(() => {
            window.location.reload();
        }, 300000);
    </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error generating status widget:', error);
    
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>CoFabri System Status</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: transparent; }
        .status-widget {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            background: transparent;
            border: none;
            text-decoration: none;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #9ca3af;
        }
    </style>
</head>
<body>
    <a href="https://cofabri.com/status" target="_blank" rel="noopener noreferrer" class="status-widget">
        <div class="status-dot"></div>
        <span>System Status</span>
    </a>
</body>
</html>`;
    
    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      },
    });
  }
}
