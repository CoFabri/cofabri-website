// CoFabri System Status Widget
// Embed this script on any page to show real-time system status

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

  // Create widget styles
  function createStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .cofabri-status-widget {
        display: inline-flex;
        align-items: center;
        gap: 0.5em;
        text-decoration: none;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: opacity 0.2s ease;
        /* Inherit font properties from parent */
        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
        color: inherit;
        line-height: inherit;
      }
      
      .cofabri-status-widget:hover {
        opacity: 0.8;
      }
      
      .cofabri-status-dot {
        width: 0.5em;
        height: 0.5em;
        border-radius: 50%;
        flex-shrink: 0;
        /* Scale dot size relative to font size */
        min-width: 6px;
        min-height: 6px;
        max-width: 12px;
        max-height: 12px;
      }
      
      .cofabri-status-text {
        white-space: nowrap;
      }
      
      .cofabri-status-widget.loading .cofabri-status-dot {
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
      console.error('CoFabri Status Widget: Failed to fetch status:', error);
      return null;
    }
  }

  // Update widget
  async function updateWidget(widget) {
    const dot = widget.querySelector('.cofabri-status-dot');
    const text = widget.querySelector('.cofabri-status-text');
    
    // Show loading state
    widget.classList.add('loading');
    text.textContent = 'System Status';
    
    const statuses = await fetchStatus();
    
    // Remove loading state
    widget.classList.remove('loading');
    
    if (statuses === null) {
      // Error state
      dot.style.backgroundColor = '#9ca3af';
      text.textContent = 'System Status';
      return;
    }
    
    // Update color and text
    const color = getStatusColor(statuses);
    dot.style.backgroundColor = color;
    
    if (!statuses || statuses.length === 0) {
      text.textContent = 'System Status';
    } else {
      const mostSevere = getMostSevereStatus(statuses);
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
    widget.className = 'cofabri-status-widget';
    
    widget.innerHTML = `
      <div class="cofabri-status-dot"></div>
      <span class="cofabri-status-text">System Status</span>
    `;
    
    return widget;
  }

  // Initialize widget
  function init() {
    // Create styles if not already present
    if (!document.querySelector('style[data-cofabri-widget]')) {
      const style = document.createElement('style');
      style.setAttribute('data-cofabri-widget', 'true');
      createStyles();
    }
    
    // Find or create container
    let container = document.getElementById('cofabri-status-widget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'cofabri-status-widget';
      document.body.appendChild(container);
    }
    
    // Create and add widget
    const widget = createWidget();
    container.appendChild(widget);
    
    // Initial update
    updateWidget(widget);
    
    // Set up periodic updates
    setInterval(() => updateWidget(widget), CONFIG.updateInterval);
    
    return widget;
  }

  // Auto-initialize if script is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for manual initialization
  window.CoFabriStatusWidget = {
    init: init,
    updateWidget: updateWidget,
    fetchStatus: fetchStatus
  };

})();
