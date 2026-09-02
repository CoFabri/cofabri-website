'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SystemStatus } from '@/lib/airtable';
import { buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

  if (isLoading) return <div className="h-9 w-9" />;

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
  const label = hasActiveIssues ? mostSevereStatus.publicStatus : 'All systems normal';
  const message = hasActiveIssues
    ? getStatusMessage(mostSevereStatus || null)
    : 'All systems operational';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/status"
          aria-label={`Status: ${label}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
        >
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className={`block h-2 w-2 rounded-full ${dotColor}`} />
            {hasActiveIssues && (
              <span className={`absolute inset-0 rounded-full ${dotColor} animate-ping opacity-75`} />
            )}
          </span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="font-medium">{label}</p>
        {hasActiveIssues && <p className="text-background/70">{message}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
