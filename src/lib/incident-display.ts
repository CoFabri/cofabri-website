import type { SystemStatus } from '@/lib/airtable';

export function incidentDotClasses(publicStatus: SystemStatus['publicStatus']): string {
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

export function incidentPillClasses(publicStatus: SystemStatus['publicStatus']): string {
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

export function severityPillClasses(severity: SystemStatus['severity']): string {
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

const SEVERITY_PRIORITY: Record<SystemStatus['publicStatus'], number> = {
  Investigating: 3,
  Identified: 2,
  Monitoring: 1,
  Resolved: 0,
};

export function mostSevereIncident(incidents: SystemStatus[]): SystemStatus | undefined {
  const active = incidents.filter((s) => s.publicStatus !== 'Resolved');
  if (active.length === 0) return undefined;
  return active.reduce((prev, current) =>
    SEVERITY_PRIORITY[current.publicStatus] > SEVERITY_PRIORITY[prev.publicStatus] ? current : prev
  );
}

// Same best-effort case-insensitive name match StatusPageContent uses to
// cross-reference an app against open incidents — pulled out here so the app
// detail page's status dot stays in sync with what /status itself shows,
// instead of re-implementing the match logic a second time.
export function matchAppIncident(appName: string, statuses: SystemStatus[]): SystemStatus | undefined {
  const open = statuses.filter((s) => s.publicStatus !== 'Resolved');
  return open.find(
    (incident) =>
      incident.application?.toLowerCase() === appName.toLowerCase() ||
      incident.affectedServices?.some((s) => s.toLowerCase() === appName.toLowerCase())
  );
}
