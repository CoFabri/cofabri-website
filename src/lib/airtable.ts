// This file's original purpose (Airtable-backed content reads) has been
// fully replaced by src/lib/api-client.ts, which reads from cofabri-api
// instead. The one exception is getSystemStatus, which a separate,
// concurrent effort routed to cofabri-core's own public status API
// (see the function below) rather than through cofabri-api — kept here,
// trimmed to just this function, rather than forcing a second migration
// of status onto the cofabri-api path this file otherwise moved away from.
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

// cofabri-core's /api/public/status response shape. Its incident objects
// already match SystemStatus field-for-field (see cofabri-core's
// app/api/public/status/route.ts, which capitalizes publicStatus/severity
// on the way out to match this exact contract) — this function only needs
// to fetch, unwrap, and default missing pieces, not remap field names.
interface CofabriCorePublicStatusResponse {
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
  }>;
}

export async function getSystemStatus(): Promise<SystemStatus[]> {
  try {
    const baseUrl = process.env.COFABRI_CORE_STATUS_API_URL;
    const apiKey = process.env.COFABRI_CORE_STATUS_API_KEY;
    if (!baseUrl || !apiKey) {
      throw new Error('COFABRI_CORE_STATUS_API_URL / COFABRI_CORE_STATUS_API_KEY are not configured');
    }

    const response = await fetch(baseUrl, {
      headers: { 'x-api-key': apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`cofabri-core status API returned ${response.status}`);
    }

    const data = (await response.json()) as CofabriCorePublicStatusResponse;

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
    const baseUrl = process.env.COFABRI_CORE_STATUS_API_URL;
    const apiKey = process.env.COFABRI_CORE_STATUS_API_KEY;
    if (!baseUrl || !apiKey) {
      throw new Error('COFABRI_CORE_STATUS_API_URL / COFABRI_CORE_STATUS_API_KEY are not configured');
    }

    const response = await fetch(baseUrl, {
      headers: { 'x-api-key': apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`cofabri-core status API returned ${response.status}`);
    }

    const data = (await response.json()) as CofabriCorePublicStatusResponse;

    return (data.services ?? [])
      .filter((s): s is { id: string; name: string; history?: ServiceUptimeDay[] } => Boolean(s.id && s.name))
      .map((s) => ({ id: s.id, name: s.name, history: s.history ?? [] }));
  } catch (error) {
    console.error('Error fetching service uptime history:', error);
    return [];
  }
}
