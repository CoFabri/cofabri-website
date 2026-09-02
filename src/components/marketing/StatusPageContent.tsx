'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { SystemStatus } from '@/lib/airtable';
import type { App } from '@/lib/api-client';
import Breadcrumbs from './Breadcrumbs';
import PageHero from './PageHero';

interface StatusPageContentProps {
  initialStatuses: SystemStatus[];
  apps: App[];
}

const REFRESH_SECONDS = 300;

function statusDotClasses(publicStatus: SystemStatus['publicStatus']): string {
  switch (publicStatus) {
    case 'Investigating':
      return 'bg-danger';
    case 'Identified':
      return 'bg-warning';
    case 'Monitoring':
      return 'bg-primary';
    case 'Resolved':
    default:
      return 'bg-success';
  }
}

function statusPillClasses(publicStatus: SystemStatus['publicStatus']): string {
  switch (publicStatus) {
    case 'Investigating':
      return 'bg-danger/15 text-danger';
    case 'Identified':
      return 'bg-warning/15 text-warning';
    case 'Monitoring':
      return 'bg-accent text-accent-foreground';
    case 'Resolved':
    default:
      return 'bg-success/15 text-success';
  }
}

function severityPillClasses(severity: SystemStatus['severity']): string {
  switch (severity) {
    case 'Critical':
      return 'bg-danger/15 text-danger';
    case 'High':
      return 'bg-warning/15 text-warning';
    case 'Medium':
      return 'bg-accent text-accent-foreground';
    case 'Low':
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

export function StatusPageContent({ initialStatuses, apps }: StatusPageContentProps) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(REFRESH_SECONDS);

  const openIncidents = useMemo(() => statuses.filter((s) => s.publicStatus !== 'Resolved'), [statuses]);
  const resolvedIncidents = useMemo(() => statuses.filter((s) => s.publicStatus === 'Resolved'), [statuses]);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch('/api/status', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch status');
        setStatuses(await response.json());
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };

    const timer = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          fetchStatuses();
          return REFRESH_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Cross-reference each app (and the platform as a whole) against open
  // incidents by name — SystemStatus.application is a free-text label from
  // cofabri-core, not an app_id, so this is a best-effort case-insensitive
  // match rather than a foreign key join.
  const services = useMemo(() => {
    const matchIncident = (name: string) =>
      openIncidents.find(
        (incident) =>
          incident.application?.toLowerCase() === name.toLowerCase() ||
          incident.affectedServices?.some((s) => s.toLowerCase() === name.toLowerCase())
      );

    const appRows = apps.map((app) => ({ name: app.name, incident: matchIncident(app.name) }));
    const platformIncident = openIncidents.find(
      (incident) => !appRows.some((row) => row.incident === incident)
    );

    return [...appRows, { name: 'CoFabri Platform', incident: platformIncident }];
  }, [apps, openIncidents]);

  const allOperational = openIncidents.length === 0;

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-9 pb-24 sm:px-10">
      <div className="mb-14">
        <Breadcrumbs items={[{ name: 'Status', href: '/status' }]} />
      </div>

      <PageHero
        eyebrow="Status"
        title={allOperational ? 'All systems operational.' : `${openIncidents.length} active ${openIncidents.length === 1 ? 'incident' : 'incidents'}.`}
        subtitle="Live status for every CoFabri service. Updated automatically, and by a human when something needs saying."
        right={
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-ink-faint">
            <RefreshCw className="h-3.5 w-3.5" />
            Refreshes in {formatCountdown(secondsUntilRefresh)}
          </div>
        }
      />

      <div className="mt-11 overflow-hidden rounded-2xl border border-border">
        <div className="flex items-center justify-between bg-muted px-7 py-5">
          <span className="text-[15px] font-semibold text-foreground">Services</span>
        </div>
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between gap-8 border-t border-border px-7 py-[18px] first:border-t-0"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`block h-2 w-2 flex-shrink-0 rounded-full ${
                  service.incident ? statusDotClasses(service.incident.publicStatus) : 'bg-success'
                }`}
              />
              <span className="text-base font-semibold text-foreground">{service.name}</span>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                service.incident ? statusPillClasses(service.incident.publicStatus) : 'bg-success/15 text-success'
              }`}
            >
              {service.incident ? service.incident.publicStatus : 'Operational'}
            </span>
          </div>
        ))}
      </div>

      {(openIncidents.length > 0 || resolvedIncidents.length > 0) && (
        <>
          <h2 className="m-0 mt-[72px] mb-6 text-[32px] font-semibold tracking-[-0.025em] text-foreground">
            Recent incidents
          </h2>
          {[...openIncidents, ...resolvedIncidents].slice(0, 10).map((incident) => (
            <div key={incident.ticketId} className="mb-4 rounded-xl border border-border p-7">
              <div className="flex flex-wrap items-start justify-between gap-8">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClasses(incident.publicStatus)}`}>
                      {incident.publicStatus}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${severityPillClasses(incident.severity)}`}>
                      {incident.severity}
                    </span>
                    <span className="font-mono text-[11px] text-ink-disabled">{incident.ticketId}</span>
                  </div>
                  <h3 className="m-0 text-xl font-semibold tracking-[-0.02em] text-foreground">{incident.title}</h3>
                  {incident.message && (
                    <p className="mt-2.5 max-w-[680px] text-base leading-[1.6] text-ink-muted">{incident.message}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right font-mono text-[11px] leading-[1.9] text-ink-faint">
                  {incident.application && <div>{incident.application}</div>}
                  <div>{formatDate(incident['Created Date'])}</div>
                </div>
              </div>
              {incident.affectedServices && incident.affectedServices.length > 0 && (
                <div className="mt-[22px] flex flex-wrap gap-2.5 border-t border-border pt-5">
                  {incident.affectedServices.map((service) => (
                    <span key={service} className="rounded-md bg-muted px-2.5 py-1 text-[13px] text-ink-body">
                      {service}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
