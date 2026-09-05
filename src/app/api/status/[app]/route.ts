import { getSystemStatus, SystemStatus } from '@/lib/airtable';
import { escapeHtml, incidentHexColor, incidentWidgetMessage, mostSevereStatus } from '@/lib/status-widget-colors';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// In-memory cache for status data (shared with main status endpoint)
let statusCache: SystemStatus[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ app: string }> }
) {
  // Embedding sites that render this widget over a bespoke-colored section
  // (not just light/dark mode) can pin the text color explicitly, since a
  // cross-origin iframe can't otherwise pick up a specific local ancestor's
  // color the way the rest of that page's text does. Parsed outside the try
  // block below so the error-state HTML can use it too.
  const overrideColor = request.nextUrl.searchParams.get('color');
  const explicitColor = overrideColor && /^[0-9a-fA-F]{3,8}$/.test(overrideColor) ? `#${overrideColor}` : null;

  try {
    const resolvedParams = await params;
    const appSlug = resolvedParams.app;
    const now = Date.now();
    
    // Check if we have valid cached data
    if (statusCache && (now - cacheTimestamp) < CACHE_DURATION) {
      // console.log(`Serving app status from cache for: ${appSlug}`);
    } else {
      // Fetch fresh data from Airtable
      // console.log(`Fetching fresh status for app: ${appSlug}`);
      statusCache = await getSystemStatus();
      cacheTimestamp = now;
    }
    
    const allStatuses = statusCache;

    // Filter statuses to only include those affecting this app: platform-wide
    // incidents always show, plus anything specifically tagged with this app_id.
    const relevantStatuses = allStatuses.filter((status: SystemStatus) => {
      return status.isPlatformWide || status.affectedAppIds.includes(appSlug);
    });
    
    const mostSevere = mostSevereStatus(relevantStatuses);
    const statusColor = incidentHexColor(mostSevere?.publicStatus);
    const statusText = escapeHtml(incidentWidgetMessage(mostSevere));

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${appSlug} System Status</title>
    <style>
        html {
            background: transparent;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: transparent;
            overflow: hidden;
        }
        .status-widget {
            display: inline-flex;
            align-items: center;
            justify-content: flex-start;
            gap: 6px;
            text-decoration: none;
            background: transparent;
            border: none;
            transition: opacity 0.2s ease;
            position: relative;
            /* Default styles that will be overridden by JavaScript */
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 400;
            color: ${explicitColor ?? '#374151'};
            line-height: 1.4;
            width: 100%;
            height: 100%;
        }
        .status-widget:hover {
            opacity: 0.8;
        }
        .status-dot-container {
            position: relative;
        }
        .status-dot {
            width: 0.5em;
            height: 0.5em;
            border-radius: 50%;
            background-color: ${statusColor};
            flex-shrink: 0;
            /* Scale dot size relative to font size */
            min-width: 8px;
            min-height: 8px;
            max-width: 16px;
            max-height: 16px;
        }
        .status-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
        }
    </style>
</head>
<body>
    <a href="https://cofabri.com/status" target="_blank" rel="noopener noreferrer" class="status-widget">
        <div class="status-dot-container">
            <div class="status-dot"></div>
        </div>
        <span class="status-text">${statusText}</span>
    </a>
    <script>
        var explicitColor = ${explicitColor ? `'${explicitColor}'` : 'null'};
        // Function to inherit styles from parent page
        function inheritParentStyles() {
            try {
                // Try to access parent window styles
                if (window.parent && window.parent !== window) {
                    const parentDoc = window.parent.document;
                    const parentBody = parentDoc.body;

                    if (parentBody) {
                        const computedStyle = window.parent.getComputedStyle(parentBody);
                        const widget = document.querySelector('.status-widget');

                        if (widget) {
                            // Inherit font properties
                            widget.style.fontFamily = computedStyle.fontFamily;
                            widget.style.fontSize = computedStyle.fontSize;
                            widget.style.fontWeight = computedStyle.fontWeight;
                            if (!explicitColor) widget.style.color = computedStyle.color;
                            widget.style.lineHeight = computedStyle.lineHeight;

                            // Adjust dot size based on font size
                            const fontSize = parseFloat(computedStyle.fontSize);
                            const dotSize = Math.max(8, Math.min(16, fontSize * 0.6));
                            const dot = document.querySelector('.status-dot');
                            if (dot) {
                                dot.style.width = dotSize + 'px';
                                dot.style.height = dotSize + 'px';
                            }
                        }
                    }
                }
            } catch (error) {
                // Cross-origin restrictions or other errors - use default styles
                console.log('Could not inherit parent styles, using defaults');
            }
        }
        
        // Try to inherit styles when page loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', inheritParentStyles);
        } else {
            inheritParentStyles();
        }
        
        // Also try after a short delay to ensure parent is fully loaded
        setTimeout(inheritParentStyles, 100);
        
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
    const resolvedParams = await params;
    console.error(`Error generating status widget for app ${resolvedParams.app}:`, error);
    
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${resolvedParams.app} System Status</title>
    <style>
        html { background: transparent; }
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: transparent; overflow: hidden; }
        .status-widget {
            display: inline-flex;
            align-items: center;
            justify-content: flex-start;
            gap: 6px;
            padding: 8px;
            font-size: 14px;
            font-weight: 500;
            color: ${explicitColor ?? '#374151'};
            background: transparent;
            border: none;
            text-decoration: none;
            width: 100%;
            height: 100%;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #9ca3af;
            flex-shrink: 0;
        }
        .status-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
        }
    </style>
</head>
<body>
    <a href="https://cofabri.com/status" target="_blank" rel="noopener noreferrer" class="status-widget">
        <div class="status-dot"></div>
        <span class="status-text">Status unavailable</span>
    </a>
    <script>
        var explicitColor = ${explicitColor ? `'${explicitColor}'` : 'null'};
        // Same inheritance logic for error state
        function inheritParentStyles() {
            try {
                if (window.parent && window.parent !== window) {
                    const parentDoc = window.parent.document;
                    const parentBody = parentDoc.body;

                    if (parentBody) {
                        const computedStyle = window.parent.getComputedStyle(parentBody);
                        const widget = document.querySelector('.status-widget');

                        if (widget) {
                            widget.style.fontFamily = computedStyle.fontFamily;
                            widget.style.fontSize = computedStyle.fontSize;
                            widget.style.fontWeight = computedStyle.fontWeight;
                            if (!explicitColor) widget.style.color = computedStyle.color;
                            widget.style.lineHeight = computedStyle.lineHeight;
                        }
                    }
                }
            } catch (error) {
                console.log('Could not inherit parent styles, using defaults');
            }
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', inheritParentStyles);
        } else {
            inheritParentStyles();
        }
        
        setTimeout(inheritParentStyles, 100);
    </script>
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
