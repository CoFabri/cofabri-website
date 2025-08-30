# CoFabri System Status API

## Quick Integration

**API**: `GET https://cofabri.com/api/status`  
**Response**: Array of status objects or empty array `[]` if all operational

## Embeddable Widget Options

### Option 1: General Status Widget (All Systems)
Add this script to any webpage:

```html
<script src="https://cofabri.com/status-widget.js"></script>
```

The widget automatically appears with a dot indicator and "System Status" text.

### Option 2: App-Specific Status Widget (Recommended for Individual Apps)
Add this script to individual app pages:

```html
<!-- Auto-detect app from URL -->
<script src="https://cofabri.com/app-status-widget.js"></script>

<!-- Or specify app manually -->
<script src="https://cofabri.com/app-status-widget.js" data-app="myapp"></script>
```

This widget only shows issues affecting that specific app or the CoFabri API.

### Option 3: Iframe Widgets
Embed these iframes anywhere:

```html
<!-- General status -->
<iframe 
  src="https://cofabri.com/api/status-widget" 
  width="200" 
  height="40" 
  frameborder="0"
  scrolling="no">
</iframe>

<!-- App-specific status -->
<iframe 
  src="https://cofabri.com/api/status/myapp" 
  width="200" 
  height="40" 
  frameborder="0"
  scrolling="no">
</iframe>
```

### Option 4: Custom Implementation
```javascript
// Fetch status and update indicator
async function updateStatusIndicator() {
  try {
    const response = await fetch('https://cofabri.com/api/status');
    const statuses = await response.json();
    
    // Get most severe active status
    const activeStatuses = statuses.filter(s => s.publicStatus !== 'Resolved');
    const mostSevere = activeStatuses.reduce((prev, curr) => {
      const priority = { 'Investigating': 3, 'Identified': 2, 'Monitoring': 1 };
      return priority[curr.publicStatus] > priority[prev.publicStatus] ? curr : prev;
    });
    
    // Update your indicator
    const indicator = document.getElementById('status-indicator');
    const color = statuses.length === 0 ? '#10b981' : // Green
                  mostSevere.publicStatus === 'Investigating' ? '#ef4444' : // Red
                  mostSevere.publicStatus === 'Identified' ? '#f97316' : // Orange
                  '#3b82f6'; // Blue
    
    indicator.style.backgroundColor = color;
    indicator.onclick = () => window.open('https://cofabri.com/status', '_blank');
  } catch (error) {
    console.error('Status unavailable');
  }
}

// Update every 5 minutes
updateStatusIndicator();
setInterval(updateStatusIndicator, 300000);
```

## Status Colors
- 🟢 **Green** (`#10b981`): All operational
- 🔴 **Red** (`#ef4444`): Investigating
- 🟠 **Orange** (`#f97316`): Identified  
- 🔵 **Blue** (`#3b82f6`): Monitoring

## Link to Status Page
Always link your indicator to: `https://cofabri.com/status`
