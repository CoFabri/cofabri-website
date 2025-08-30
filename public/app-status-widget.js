// CoFabri App-Specific Status Widget
// Embed this script on individual app pages to show app-specific status

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    apiUrl: 'https://cofabri.com/api/status',
    statusPageUrl: 'https://cofabri.com/status',
    updateInterval: 300000, // 5 minutes
    colors: {
      operational: '#10b981',
      investigating: '#ef4444',
      identified: '#f97316',
      monitoring: '#3b82f6'
    }
  };

  // Get app slug from data attribute or URL
  function getAppSlug() {
    // Check for data attribute first
    const script = document.currentScript || document.querySelector('script[src*="app-status-widget.js"]');
    if (script && script.dataset.app) {
      return script.dataset.app;
    }
    
    // Try to extract from URL path
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      return pathParts[0];
    }
    
    // Fallback to domain-based detection
    const hostname = window.location.hostname;
    if (hostname.includes('.')) {
      return hostname.split('.')[0];
    }
    
    return 'unknown';
  }

  // Create widget styles
  function createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .cofabri-app-status-widget {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        color: #374151;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: opacity 0.2s ease;
        text-decoration: none;
      }
      
      .cofabri-app-status-widget:hover {
        opacity: 0.8;
      }
      
      .cofabri-app-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      
      .cofabri-app-status-text {
        white-space: nowrap;
      }
      
      .cofabri-app-status-widget.loading .cofabri-app-status-dot {
        background-color: #9ca3af;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }

  // Get status priority
  function getStatusPriority(status) {
    const priorities = {
      'Investigating': 3,
      'Identified': 2,
      'Monitoring': 1,
      'Resolved': 0
    };
    return priorities[status] || 0;
  }

  // Get most severe status
  function getMostSevereStatus(statuses) {
    const activeStatuses = statuses.filter(s => s.publicStatus !== 'Resolved');
    if (activeStatuses.length === 0) return null;
    
    return activeStatuses.reduce((prev, curr) => {
      return getStatusPriority(curr.publicStatus) > getStatusPriority(prev.publicStatus) ? curr : prev;
    });
  }

  // Filter statuses for specific app
  function filterStatusesForApp(allStatuses, appSlug) {
    return allStatuses.filter(status => {
      // Always include CoFabri API issues
      if (status.application === 'CoFabri API') {
        return true;
      }
      
      // Include issues affecting this specific app
      if (status.application && status.application.toLowerCase() === appSlug.toLowerCase()) {
        return true;
      }
      
      // Include issues where this app is in the affected services
      if (status.affectedServices && Array.isArray(status.affectedServices)) {
        return status.affectedServices.some(service => 
          service.toLowerCase().includes(appSlug.toLowerCase())
        );
      }
      
      return false;
    });
  }

  // Get status color
  function getStatusColor(statuses) {
    if (!statuses || statuses.length === 0) {
      return CONFIG.colors.operational;
    }
    
    const mostSevere = getMostSevereStatus(statuses);
    if (!mostSevere) {
      return CONFIG.colors.operational;
    }
    
    switch (mostSevere.publicStatus) {
      case 'Investigating': return CONFIG.colors.investigating;
      case 'Identified': return CONFIG.colors.identified;
      case 'Monitoring': return CONFIG.colors.monitoring;
      default: return CONFIG.colors.operational;
    }
  }

  // Fetch status from API
  async function fetchStatus() {
    try {
      const response = await fetch(CONFIG.apiUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('CoFabri App Status Widget: Failed to fetch status:', error);
      return null;
    }
  }

  // Update widget
  async function updateWidget(widget, appSlug) {
    const dot = widget.querySelector('.cofabri-app-status-dot');
    const text = widget.querySelector('.cofabri-app-status-text');
    
    // Show loading state
    widget.classList.add('loading');
    text.textContent = 'System Status';
    
    const allStatuses = await fetchStatus();
    
    // Remove loading state
    widget.classList.remove('loading');
    
    if (allStatuses === null) {
      // Error state
      dot.style.backgroundColor = '#9ca3af';
      text.textContent = 'System Status';
      return;
    }
    
    // Filter statuses for this app
    const relevantStatuses = filterStatusesForApp(allStatuses, appSlug);
    
    // Update color and text
    const color = getStatusColor(relevantStatuses);
    dot.style.backgroundColor = color;
    
    if (!relevantStatuses || relevantStatuses.length === 0) {
      text.textContent = 'System Status';
    } else {
      const mostSevere = getMostSevereStatus(relevantStatuses);
      if (mostSevere) {
        text.textContent = `System Status - ${mostSevere.publicStatus}`;
      } else {
        text.textContent = 'System Status';
      }
    }
  }

  // Create widget element
  function createWidget() {
    const widget = document.createElement('a');
    widget.href = CONFIG.statusPageUrl;
    widget.target = '_blank';
    widget.rel = 'noopener noreferrer';
    widget.className = 'cofabri-app-status-widget';
    
    widget.innerHTML = `
      <div class="cofabri-app-status-dot"></div>
      <span class="cofabri-app-status-text">System Status</span>
    `;
    
    return widget;
  }

  // Initialize widget
  function init() {
    const appSlug = getAppSlug();
    console.log(`Initializing CoFabri app status widget for: ${appSlug}`);
    
    // Create styles if not already present
    if (!document.querySelector('style[data-cofabri-app-widget]')) {
      const style = document.createElement('style');
      style.setAttribute('data-cofabri-app-widget', 'true');
      createStyles();
    }
    
    // Find or create container
    let container = document.getElementById('cofabri-app-status-widget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'cofabri-app-status-widget';
      document.body.appendChild(container);
    }
    
    // Create and add widget
    const widget = createWidget();
    container.appendChild(widget);
    
    // Initial update
    updateWidget(widget, appSlug);
    
    // Set up periodic updates
    setInterval(() => updateWidget(widget, appSlug), CONFIG.updateInterval);
    
    return widget;
  }

  // Auto-initialize if script is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for manual initialization
  window.CoFabriAppStatusWidget = {
    init: init,
    updateWidget: updateWidget,
    fetchStatus: fetchStatus,
    getAppSlug: getAppSlug
  };

})();
