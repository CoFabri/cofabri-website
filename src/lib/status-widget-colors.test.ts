import { describe, expect, it } from 'vitest';
import { mostSevereStatus, incidentHexColor, incidentWidgetMessage } from './status-widget-colors';
import type { SystemStatus } from '@/lib/airtable';

function status(overrides: Partial<SystemStatus> = {}): SystemStatus {
  return {
    ticketId: 't-1',
    title: 'Incident',
    publicStatus: 'Resolved',
    severity: 'Low',
    message: '',
    'Created Date': '',
    'Updated At': '',
    'Resolved Date': '',
    affectedServices: [],
    affectedAppIds: [],
    isPlatformWide: false,
    ...overrides,
  };
}

describe('mostSevereStatus', () => {
  it('returns null when every status is resolved', () => {
    expect(mostSevereStatus([status({ publicStatus: 'Resolved' })])).toBeNull();
    expect(mostSevereStatus([])).toBeNull();
  });

  it('picks the highest-priority active status: Investigating > Identified > Monitoring', () => {
    const monitoring = status({ publicStatus: 'Monitoring' });
    const investigating = status({ publicStatus: 'Investigating' });
    const identified = status({ publicStatus: 'Identified' });
    expect(mostSevereStatus([monitoring, investigating, identified])).toBe(investigating);
  });

  it('ignores resolved statuses when a more severe one is present', () => {
    const resolved = status({ publicStatus: 'Resolved' });
    const identified = status({ publicStatus: 'Identified' });
    expect(mostSevereStatus([resolved, identified])).toBe(identified);
  });
});

describe('incidentHexColor', () => {
  it('maps each public status to its brand hex color', () => {
    expect(incidentHexColor('Investigating')).toBe('#D92D20');
    expect(incidentHexColor('Identified')).toBe('#D98212');
    expect(incidentHexColor('Monitoring')).toBe('#0B6BE6');
    expect(incidentHexColor('Resolved')).toBe('#12A150');
  });

  it('defaults to the resolved (green) color for an undefined status', () => {
    expect(incidentHexColor(undefined)).toBe('#12A150');
  });
});

describe('incidentWidgetMessage', () => {
  it('reports all clear when there is no active status', () => {
    expect(incidentWidgetMessage(null)).toBe('All systems operational');
  });

  it('includes the status message when present', () => {
    expect(incidentWidgetMessage(status({ publicStatus: 'Investigating', message: 'DB latency' }))).toBe(
      'Investigating: DB latency'
    );
  });

  it('falls back to a generic label when there is no message', () => {
    expect(incidentWidgetMessage(status({ publicStatus: 'Monitoring', message: '' }))).toBe('Monitoring Resolution');
  });
});
