// This file's original purpose (Airtable-backed content reads) has been
// fully replaced by src/lib/api-client.ts, which reads from cofabri-api
// instead. getSystemStatus/getServiceUptimeHistory below now also go
// through cofabri-api (GET /web/content/status-feed, which itself proxies
// cofabri-core's public status API), so this file's only remaining
// distinction from api-client.ts is which file the code happens to live
// in, not which backend it talks to.
// TODO: this file no longer touches Airtable at all; a follow-up rename
// (e.g. to src/lib/status-api.ts) would better reflect what's left here.

export interface SystemStatus {
  ticketId: string;
  title: string;
  publicStatus: 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  message: string;
  'Created Date': string;
  'Updated At': string;
  'Resolved Date': string;
  affectedServices: string[];
  application?: string;
  updates?: string;
  affectedAppIds: string[];
  isPlatformWide: boolean;
}

export interface ServiceUptimeDay {
  date: string;
  status: 'operational' | 'degraded' | 'down';
}

export interface ServiceUptimeHistory {
  id: string;
  name: string;
  history: ServiceUptimeDay[];
}

// GET /web/content/status-feed's response shape — cofabri-api passes
// cofabri-core's /api/public/status payload through verbatim. Its incident
// objects already match SystemStatus field-for-field (see cofabri-core's
// app/api/public/status/route.ts, which capitalizes publicStatus/severity
// on the way out to match this exact contract) — this function only needs
// to fetch, unwrap, and default missing pieces, not remap field names.
interface StatusFeedResponse {
  services?: Array<{
    id?: string;
    name?: string;
    history?: ServiceUptimeDay[];
  }>;
  incidents?: Array<{
    ticketId?: string;
    title?: string;
    publicStatus?: SystemStatus['publicStatus'];
    severity?: SystemStatus['severity'];
    message?: string;
    'Created Date'?: string;
    'Updated At'?: string;
    'Resolved Date'?: string;
    affectedServices?: string[];
    application?: string;
    updates?: string;
    affectedAppIds?: string[];
    isPlatformWide?: boolean;
  }>;
}

export async function getSystemStatus(): Promise<SystemStatus[]> {
  try {
    const baseUrl = process.env.COFABRI_API_BASE_URL;
    if (!baseUrl) {
      throw new Error('COFABRI_API_BASE_URL is not configured');
    }

    const response = await fetch(`${baseUrl}/web/content/status-feed`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`cofabri-api status-feed returned ${response.status}`);
    }

    const data = (await response.json()) as StatusFeedResponse;

    return (data.incidents ?? []).map(incident => {
      const publicStatus = incident.publicStatus || 'Monitoring';

      return {
        ticketId: incident.ticketId || `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: incident.title || `System Issue - ${publicStatus}`,
        publicStatus,
        severity: incident.severity || 'Medium',
        message:
          incident.message ||
          `We are currently ${publicStatus.toLowerCase()} a system issue. Our team is working to resolve this as quickly as possible.`,
        'Created Date': incident['Created Date'] || new Date().toISOString(),
        'Updated At': incident['Updated At'] || new Date().toISOString(),
        'Resolved Date': incident['Resolved Date'] || '',
        affectedServices: incident.affectedServices || [],
        application: incident.application || 'CoFabri System',
        updates: incident.updates || '',
        affectedAppIds: incident.affectedAppIds || [],
        isPlatformWide: incident.isPlatformWide || false,
      };
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    return [];
  }
}

// Same endpoint as getSystemStatus, fetched separately rather than combined
// into one call — every other caller of getSystemStatus (the nav dot, the
// widgets, the polling /api/status route) only ever needs incidents, so this
// stays a second lean request made only from the one place (the /status page)
// that actually renders the 90-day uptime bars, rather than growing
// getSystemStatus's contract for callers that don't need it.
export async function getServiceUptimeHistory(): Promise<ServiceUptimeHistory[]> {
  try {
    const baseUrl = process.env.COFABRI_API_BASE_URL;
    if (!baseUrl) {
      throw new Error('COFABRI_API_BASE_URL is not configured');
    }

    const response = await fetch(`${baseUrl}/web/content/status-feed`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`cofabri-api status-feed returned ${response.status}`);
    }

    const data = (await response.json()) as StatusFeedResponse;

    return (data.services ?? [])
      .filter((s): s is { id: string; name: string; history?: ServiceUptimeDay[] } => Boolean(s.id && s.name))
      .map((s) => ({ id: s.id, name: s.name, history: s.history ?? [] }));
  } catch (error) {
    console.error('Error fetching service uptime history:', error);
    return [];
  }
}
