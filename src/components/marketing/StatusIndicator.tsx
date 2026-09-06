'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { SystemStatus } from '@/lib/status-api';
import { buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { incidentDotClasses, mostSevereIncident } from '@/lib/incident-display';

// The status label is already shown as the tooltip title, so this only
// needs the incident detail itself — no "Identified: " style prefix that
// would just repeat the title.
const getStatusMessage = (status: SystemStatus | null) => status?.message?.trim() || null;

function useSystemStatus() {
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

  const activeIncident = mostSevereIncident(statuses);
  return {
    dotColor: activeIncident ? incidentDotClasses(activeIncident.publicStatus) : 'bg-success',
    label: activeIncident ? activeIncident.publicStatus : 'All systems normal',
    message: getStatusMessage(activeIncident ?? null),
    hasActiveIssues: Boolean(activeIncident),
  };
}

export default function StatusIndicator({ variant = 'icon' }: { variant?: 'icon' | 'row' }) {
  const status = useSystemStatus();

  if (variant === 'row') {
    if (!status) return <div className="h-14 w-full rounded-[11px] border border-border" />;
    return (
      <Link
        href="/status"
        className="flex h-14 w-full items-center justify-between rounded-[11px] border border-border px-4 text-foreground"
      >
        <span className="flex items-center gap-2.5">
          <span className={`block h-2 w-2 flex-shrink-0 rounded-full ${status.dotColor}`} />
          <span className="text-[14px] font-semibold">{status.label}</span>
        </span>
        <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
      </Link>
    );
  }

  if (!status) return <div className="h-9 w-9" />;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/status"
          aria-label={`Status: ${status.label}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
        >
          {/* The dot never animates — a ping/pulse reads as an alarm on a page where nothing is wrong. */}
          <span className={`block h-2 w-2 flex-shrink-0 rounded-full ${status.dotColor}`} />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="font-medium">{status.label}</p>
        {status.hasActiveIssues && status.message && (
          <p className="mt-0.5 line-clamp-3 text-background/70">{status.message}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
