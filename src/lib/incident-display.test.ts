import { describe, expect, it } from 'vitest';
import {
  incidentDotClasses,
  incidentPillClasses,
  severityPillClasses,
  mostSevereIncident,
  matchAppIncident,
  matchCofabriIncident,
  matchExternalServiceIncident,
} from './incident-display';
import type { SystemStatus } from '@/lib/status-api';

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
    isThirdParty: false,
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

describe('matchAppIncident', () => {
  it('matches an incident whose affectedAppIds includes the given app id', () => {
    const incident = status({ publicStatus: 'Investigating', affectedAppIds: ['medoura'] });
    expect(matchAppIncident('medoura', [incident])).toBe(incident);
    expect(matchAppIncident('praxis', [incident])).toBeUndefined();
  });

  it('matches any app when the incident is platform-wide', () => {
    const incident = status({ publicStatus: 'Investigating', isPlatformWide: true, affectedAppIds: [] });
    expect(matchAppIncident('medoura', [incident])).toBe(incident);
  });

  it('ignores resolved incidents even if they would otherwise match', () => {
    const incident = status({ publicStatus: 'Resolved', affectedAppIds: ['medoura'] });
    expect(matchAppIncident('medoura', [incident])).toBeUndefined();
  });
});

describe('matchCofabriIncident / matchExternalServiceIncident', () => {
  it('gives a platform-wide incident to CoFabri, never to External Services', () => {
    const incident = status({ publicStatus: 'Investigating', isPlatformWide: true, isThirdParty: false });
    expect(matchCofabriIncident([incident])).toBe(incident);
    expect(matchExternalServiceIncident([incident])).toBeUndefined();
  });

  it('gives a non-third-party incident to CoFabri', () => {
    const incident = status({ publicStatus: 'Investigating', isThirdParty: false });
    expect(matchCofabriIncident([incident])).toBe(incident);
    expect(matchExternalServiceIncident([incident])).toBeUndefined();
  });

  it('gives a third-party incident to External Services, never to CoFabri', () => {
    const incident = status({ publicStatus: 'Investigating', isThirdParty: true });
    expect(matchCofabriIncident([incident])).toBeUndefined();
    expect(matchExternalServiceIncident([incident])).toBe(incident);
  });

  it('splits a mix of both correctly', () => {
    const cofabri = status({ publicStatus: 'Investigating', isThirdParty: false });
    const external = status({ publicStatus: 'Identified', isThirdParty: true });
    expect(matchCofabriIncident([cofabri, external])).toBe(cofabri);
    expect(matchExternalServiceIncident([cofabri, external])).toBe(external);
  });

  it('ignores resolved incidents', () => {
    const incident = status({ publicStatus: 'Resolved', isThirdParty: true });
    expect(matchCofabriIncident([incident])).toBeUndefined();
    expect(matchExternalServiceIncident([incident])).toBeUndefined();
  });
});
