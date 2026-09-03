import { describe, expect, it } from 'vitest';
import { incidentDotClasses, incidentPillClasses, severityPillClasses, mostSevereIncident } from './incident-display';
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
    ...overrides,
  };
}

describe('incidentDotClasses / incidentPillClasses', () => {
  it('use the danger color for Investigating', () => {
    expect(incidentDotClasses('Investigating')).toContain('danger');
    expect(incidentPillClasses('Investigating')).toContain('danger');
  });

  it('default to the success color for an unrecognized status', () => {
    expect(incidentDotClasses('Resolved')).toContain('success');
    expect(incidentPillClasses('Resolved')).toContain('success');
  });
});

describe('severityPillClasses', () => {
  it('maps Critical to the danger palette and Low to the muted palette', () => {
    expect(severityPillClasses('Critical')).toContain('danger');
    expect(severityPillClasses('Low')).toContain('muted');
  });
});

describe('mostSevereIncident', () => {
  it('returns undefined when everything is resolved', () => {
    expect(mostSevereIncident([status({ publicStatus: 'Resolved' })])).toBeUndefined();
    expect(mostSevereIncident([])).toBeUndefined();
  });

  it('picks the most severe active incident', () => {
    const identified = status({ publicStatus: 'Identified' });
    const investigating = status({ publicStatus: 'Investigating' });
    expect(mostSevereIncident([identified, investigating])).toBe(investigating);
  });
});
