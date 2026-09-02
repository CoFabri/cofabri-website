'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SystemStatus } from '@/lib/airtable';
import { buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { incidentDotClasses, mostSevereIncident } from '@/lib/incident-display';

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

  const activeIncident = mostSevereIncident(statuses);
  const hasActiveIssues = Boolean(activeIncident);

  const dotColor = activeIncident ? incidentDotClasses(activeIncident.publicStatus) : 'bg-success';
  const label = activeIncident ? activeIncident.publicStatus : 'All systems normal';
  const message = getStatusMessage(activeIncident ?? null);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/status"
          aria-label={`Status: ${label}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
        >
          {/* The dot never animates — a ping/pulse reads as an alarm on a page where nothing is wrong. */}
          <span className={`block h-2 w-2 flex-shrink-0 rounded-full ${dotColor}`} />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="font-medium">{label}</p>
        {hasActiveIssues && <p className="text-background/70">{message}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
