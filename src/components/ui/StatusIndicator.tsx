'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SystemStatus } from '@/lib/airtable';

const getSeverityColor = (status: SystemStatus | null) => {
  if (!status) return 'bg-green-500';
  
  // Use the same color logic as the status page
  switch (status.publicStatus) {
    case 'Investigating':
      return 'bg-red-500';
    case 'Identified':
      return 'bg-orange-500';
    case 'Monitoring':
      return 'bg-blue-500';
    case 'Resolved':
      return 'bg-green-500';
    default:
      return 'bg-green-500';
  }
};

const getStatusMessage = (status: SystemStatus | null) => {
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

export default function StatusIndicator() {
  const [statuses, setStatuses] = useState<SystemStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error('Failed to fetch status');
        const data = await response.json();
        setStatuses(data);
      } catch (error) {
        console.error('Error fetching status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
    // Refresh status every 5 minutes
    const interval = setInterval(fetchStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return null;

  // Find the most severe active status to determine the color
  const activeStatuses = statuses.filter(status => status.publicStatus !== 'Resolved');
  const hasActiveIssues = activeStatuses.length > 0;
  
  // Get the most severe status for color (priority: Investigating > Identified > Monitoring)
  const getStatusPriority = (status: string) => {
    switch (status) {
      case 'Investigating': return 3;
      case 'Identified': return 2;
      case 'Monitoring': return 1;
      default: return 0;
    }
  };
  
  const mostSevereStatus = activeStatuses.reduce((prev, current) => {
    return getStatusPriority(current.publicStatus) > getStatusPriority(prev.publicStatus) ? current : prev;
  }, activeStatuses[0]);
  
  const dotColor = hasActiveIssues ? getSeverityColor(mostSevereStatus) : 'bg-green-500';
  const message = hasActiveIssues 
    ? getStatusMessage(mostSevereStatus || null)
    : 'All systems operational';

  return (
    <Link
      href="/status"
      className="relative group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-50"
    >
      <div className="relative">
        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
        {hasActiveIssues && (
          <div
            className={`absolute top-0 left-0 w-2.5 h-2.5 rounded-full ${dotColor} animate-ping opacity-75`}
          />
        )}
      </div>
      <span className="sr-only">System Status</span>
      
      {/* Tooltip */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-normal max-w-xs w-max opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden text-ellipsis">
        <span className="block truncate">{message}</span>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 border-4 border-transparent border-b-gray-900" />
      </div>
    </Link>
  );
} 