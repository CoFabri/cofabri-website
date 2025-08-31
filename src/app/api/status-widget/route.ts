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
    
    // Determine if we should show pulsing animation
    const shouldPulse = activeStatuses.length > 0;
    
    // Get status message logic (same as navigation header)
    const getStatusMessage = (status: any) => {
      if (!status) return 'All systems operational';
      
      switch (status.publicStatus) {
        case 'Investigating':
          return status.message ? `Investigating: ${status.message}` : 'Investigating';
        case 'Identified':
          return status.message ? `Issue Identified: ${status.message}` : 'Issue Identified';
        case 'Monitoring':
          return status.message ? `Monitoring Resolution: ${status.message}` : 'Monitoring Resolution';
        case 'Resolved':
          return status.message ? `Resolved: ${status.message}` : 'Resolved';
        default:
          return status.message || status.publicStatus || 'All systems operational';
      }
    };
    
    const message = shouldPulse 
      ? getStatusMessage(mostSevere)
      : 'All systems operational';
    
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
            overflow: hidden;
        }
        .status-widget {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            background: transparent;
            border: none;
            transition: opacity 0.2s ease;
            position: relative;
            /* Default styles that will be overridden by JavaScript */
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 400;
            color: #374151;
            line-height: 1.4;
            width: 100%;
            height: 100%;
        }
        .status-widget:hover {
            opacity: 0.8;
        }
        .status-dot-container {
            position: relative;
            display: inline-block;
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
        ${shouldPulse ? `
        .status-dot-ping {
            position: absolute;
            top: 0;
            left: 0;
            width: 0.5em;
            height: 0.5em;
            border-radius: 50%;
            background-color: ${statusColor};
            opacity: 0.75;
            animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
            /* Scale dot size relative to font size */
            min-width: 8px;
            min-height: 8px;
            max-width: 16px;
            max-height: 16px;
        }
        @keyframes ping {
            75%, 100% {
                transform: scale(2);
                opacity: 0;
            }
        }
        ` : ''}
        .status-widget.loading .status-dot {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <a href="https://cofabri.com/status" target="_blank" rel="noopener noreferrer" class="status-widget">
        <div class="status-dot-container">
            <div class="status-dot"></div>
            ${shouldPulse ? '<div class="status-dot-ping"></div>' : ''}
        </div>
    </a>
    <script>
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
                            widget.style.color = computedStyle.color;
                            widget.style.lineHeight = computedStyle.lineHeight;
                            
                            // Adjust dot size based on font size
                            const fontSize = parseFloat(computedStyle.fontSize);
                            const dotSize = Math.max(8, Math.min(16, fontSize * 0.6));
                            const dot = document.querySelector('.status-dot');
                            const pingDot = document.querySelector('.status-dot-ping');
                            if (dot) {
                                dot.style.width = dotSize + 'px';
                                dot.style.height = dotSize + 'px';
                            }
                            if (pingDot) {
                                pingDot.style.width = dotSize + 'px';
                                pingDot.style.height = dotSize + 'px';
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
    console.error('Error generating status widget:', error);
    
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>CoFabri System Status</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: transparent; overflow: hidden; }
        .status-widget {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            background: transparent;
            border: none;
            transition: opacity 0.2s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 400;
            color: #374151;
            line-height: 1.4;
            width: 100%;
            height: 100%;
        }
        .status-dot-container {
            position: relative;
            display: inline-block;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #9ca3af;
        }
        .status-dot-ping {
            position: absolute;
            top: 0;
            left: 0;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #9ca3af;
            opacity: 0.75;
            animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
            75%, 100% {
                transform: scale(2);
                opacity: 0;
            }
        }
    </style>
</head>
<body>
    <a href="https://cofabri.com/status" target="_blank" rel="noopener noreferrer" class="status-widget">
        <div class="status-dot-container">
            <div class="status-dot-ping"></div>
            <div class="status-dot"></div>
        </div>
    </a>
    <script>
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
                            widget.style.color = computedStyle.color;
                            widget.style.lineHeight = computedStyle.lineHeight;
                            
                            // Adjust dot size based on font size
                            const fontSize = parseFloat(computedStyle.fontSize);
                            const dotSize = Math.max(8, Math.min(16, fontSize * 0.6));
                            const dot = document.querySelector('.status-dot');
                            const pingDot = document.querySelector('.status-dot-ping');
                            if (dot) {
                                dot.style.width = dotSize + 'px';
                                dot.style.height = dotSize + 'px';
                            }
                            if (pingDot) {
                                pingDot.style.width = dotSize + 'px';
                                pingDot.style.height = dotSize + 'px';
                            }
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
