import type { SystemStatus } from '@/lib/airtable';

// Shared by the embeddable status-dot widgets (src/app/api/status-widget,
// src/app/api/status/[app]), which render raw HTML/CSS server-side rather
// than Tailwind classes, so they need hex values rather than the
// bg-danger/bg-warning/etc. tokens used elsewhere. Values mirror the
// --danger/--warning/--primary/--success tokens in globals.css (light mode)
// so an embedded widget matches the site's own status colors instead of
// generic Tailwind red/orange/blue/green.
const PRIORITY: Record<string, number> = { Investigating: 3, Identified: 2, Monitoring: 1, Resolved: 0 };

export function mostSevereStatus(statuses: SystemStatus[]): SystemStatus | null {
  const active = statuses.filter((s) => s.publicStatus !== 'Resolved');
  if (active.length === 0) return null;
  return active.reduce((prev, curr) => (PRIORITY[curr.publicStatus] > PRIORITY[prev.publicStatus] ? curr : prev));
}

export function incidentHexColor(publicStatus: SystemStatus['publicStatus'] | undefined): string {
  switch (publicStatus) {
    case 'Investigating':
      return '#D92D20';
    case 'Identified':
      return '#D98212';
    case 'Monitoring':
      return '#0B6BE6';
    default:
      return '#12A150';
  }
}

export function incidentWidgetMessage(status: SystemStatus | null): string {
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
}

// The widget text renders admin/third-party-provider free text (incident
// messages) directly into server-rendered HTML — escape it so an incident
// message can never break out of the markup.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
