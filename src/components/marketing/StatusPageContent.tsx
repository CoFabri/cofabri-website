'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { SystemStatus, ServiceUptimeDay, ServiceUptimeHistory } from '@/lib/airtable';
import type { App } from '@/lib/api-client';
import { incidentDotClasses, incidentPillClasses, severityPillClasses } from '@/lib/incident-display';
import Breadcrumbs from './Breadcrumbs';
import PageHero from './PageHero';
import RevealSection from './RevealSection';

interface StatusPageContentProps {
  initialStatuses: SystemStatus[];
  apps: App[];
  uptimeHistory: ServiceUptimeHistory[];
}

const REFRESH_SECONDS = 300;
const UPTIME_WINDOW_DAYS = 90;

function uptimeWindowDates(): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = UPTIME_WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function dayBarClasses(status: ServiceUptimeDay['status'] | 'none'): string {
  switch (status) {
    case 'operational':
      return 'bg-success';
    case 'degraded':
      return 'bg-warning';
    case 'down':
      return 'bg-danger';
    default:
      return 'bg-border';
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

export function StatusPageContent({ initialStatuses, apps, uptimeHistory }: StatusPageContentProps) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(REFRESH_SECONDS);
  const uptimeWindow = useMemo(() => uptimeWindowDates(), []);

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
    // Same best-effort case-insensitive name match as matchIncident above —
    // monitored_services (cofabri-core) has no foreign key to an app record,
    // just a free-text name, so a service with no matching name here simply
    // renders with no uptime bars rather than a wrong match.
    const matchHistory = (name: string) => uptimeHistory.find((s) => s.name.toLowerCase() === name.toLowerCase());

    const appRows = apps.map((app) => ({
      name: app.name,
      incident: matchIncident(app.name),
      history: matchHistory(app.name)?.history ?? [],
    }));
    const platformIncident = openIncidents.find(
      (incident) => !appRows.some((row) => row.incident === incident)
    );

    return [
      ...appRows,
      { name: 'CoFabri Platform', incident: platformIncident, history: matchHistory('CoFabri Platform')?.history ?? [] },
    ];
  }, [apps, openIncidents, uptimeHistory]);

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
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Refreshes in {formatCountdown(secondsUntilRefresh)}
          </div>
        }
      />

      <RevealSection className="mt-11 overflow-hidden rounded-2xl border border-border">
        <div className="flex items-center justify-between bg-muted px-7 py-5">
          <span className="text-[15px] font-semibold text-foreground">Services</span>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint sm:block">
            {UPTIME_WINDOW_DAYS}-day uptime
          </span>
        </div>
        {services.map((service) => {
          const bars = uptimeWindow.map((date) => service.history.find((d) => d.date === date)?.status ?? 'none');
          const daysWithData = bars.filter((s) => s !== 'none').length;
          const operationalDays = bars.filter((s) => s === 'operational').length;
          const uptimePct = daysWithData > 0 ? ((operationalDays / daysWithData) * 100).toFixed(1) : null;

          return (
            <div
              key={service.name}
              className="grid grid-cols-[1fr_auto] items-center gap-6 border-t border-border px-7 py-[18px] first:border-t-0 sm:grid-cols-[200px_1fr_90px_130px] sm:gap-8"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`block h-2 w-2 flex-shrink-0 rounded-full ${
                    service.incident ? incidentDotClasses(service.incident.publicStatus) : 'bg-success'
                  }`}
                />
                <span className="text-base font-semibold text-foreground">{service.name}</span>
              </div>
              {daysWithData > 0 ? (
                <div className="hidden h-[26px] items-stretch gap-[2px] sm:flex">
                  {bars.map((status, i) => (
                    <span key={i} className={`block flex-1 rounded-[2px] ${dayBarClasses(status)}`} />
                  ))}
                </div>
              ) : (
                <div className="hidden sm:block" />
              )}
              <span className="hidden justify-self-end font-mono text-[13px] text-ink-body sm:block">
                {uptimePct !== null ? `${uptimePct}%` : '—'}
              </span>
              <span
                className={`justify-self-end rounded-full px-2.5 py-1 text-xs font-semibold ${
                  service.incident ? incidentPillClasses(service.incident.publicStatus) : 'bg-success/15 text-success'
                }`}
              >
                {service.incident ? service.incident.publicStatus : 'Operational'}
              </span>
            </div>
          );
        })}
      </RevealSection>

      {(openIncidents.length > 0 || resolvedIncidents.length > 0) && (
        <RevealSection>
          <h2 className="m-0 mt-[72px] mb-6 text-[32px] font-semibold tracking-[-0.025em] text-foreground">
            Recent incidents
          </h2>
          {[...openIncidents, ...resolvedIncidents].slice(0, 10).map((incident) => (
            <div key={incident.ticketId} className="mb-4 rounded-xl border border-border p-7">
              <div className="flex flex-wrap items-start justify-between gap-8">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${incidentPillClasses(incident.publicStatus)}`}>
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
        </RevealSection>
      )}
    </div>
  );
}
