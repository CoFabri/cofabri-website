import type { SystemStatus } from '@/lib/status-api';

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

// Cross-references an app against open incidents by its declared app_id
// (SystemStatus.affectedAppIds / isPlatformWide), not free-text name/domain
// matching — pulled out here so the app detail page's status dot stays in
// sync with what /status itself shows, instead of re-implementing the match
// logic a second time.
export function matchAppIncident(appId: string, statuses: SystemStatus[]): SystemStatus | undefined {
  const open = statuses.filter((s) => s.publicStatus !== 'Resolved');
  return open.find((incident) => incident.isPlatformWide || incident.affectedAppIds.includes(appId));
}

// Of the incidents no specific app has already claimed (see matchAppIncident),
// picks the one that's CoFabri's own responsibility, not a vendor's: a
// platform-wide incident (by definition affects CoFabri as a whole, not one
// third-party provider) or one tied to a monitored 'internal_app' / reported
// manually (isThirdParty false either way). Used for the "CoFabri Services" status row.
export function matchCofabriIncident(unclaimedStatuses: SystemStatus[]): SystemStatus | undefined {
  const open = unclaimedStatuses.filter((s) => s.publicStatus !== 'Resolved');
  return open.find((incident) => incident.isPlatformWide) ?? open.find((incident) => !incident.isThirdParty);
}

// The remaining bucket for the same unclaimed incidents: a genuine
// third-party vendor incident, not already claimed as CoFabri's own above.
// Used for the "External Services" status row.
export function matchExternalServiceIncident(unclaimedStatuses: SystemStatus[]): SystemStatus | undefined {
  const open = unclaimedStatuses.filter((s) => s.publicStatus !== 'Resolved');
  const cofabriIncident = matchCofabriIncident(unclaimedStatuses);
  return open.find((incident) => incident.isThirdParty && incident !== cofabriIncident);
}

// The incident card's "whose fault is this" label — purely a function of
// isThirdParty, independent of affectedAppIds. A vendor outage that happens
// to only affect one app (e.g. GoHighLevel down, only Medoura depends on it)
// is still "External Services", not that app's name: affectedAppIds decides
// which app's status dot goes red, which is a separate question from whether
// the incident is CoFabri's own doing or a vendor's. Mirrors the same
// isThirdParty split matchCofabriIncident/matchExternalServiceIncident use
// for the top-of-page rows, so the card never disagrees with the incident's
// true nature just because a specific app also claimed it for its own dot.
export function incidentApplicationLabel(incident: SystemStatus): string {
  return incident.isThirdParty ? 'External Services' : 'CoFabri Services';
}
