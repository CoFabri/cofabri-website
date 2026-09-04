import { describe, expect, it } from 'vitest';
import { getSignupState, getSignupCopy } from './signup-state';

describe('getSignupState', () => {
  it('is legacy-waitlist for apps still In Development, regardless of capacity', () => {
    expect(getSignupState({ status: 'In Development', betaCapacity: null, betaSpotsFilled: 0 })).toEqual({
      kind: 'legacy-waitlist',
    });
    expect(getSignupState({ status: 'In Development', betaCapacity: 0, betaSpotsFilled: 0 })).toEqual({
      kind: 'legacy-waitlist',
    });
  });

  it('is unavailable for a status this page does not support', () => {
    expect(getSignupState({ status: 'Live', betaCapacity: null, betaSpotsFilled: 0 })).toEqual({
      kind: 'unavailable',
      status: 'Live',
    });
    expect(getSignupState({ status: 'Active', betaCapacity: null, betaSpotsFilled: 0 })).toEqual({
      kind: 'unavailable',
      status: 'Active',
    });
  });

  it('is not-open for a beta app with no capacity set', () => {
    expect(getSignupState({ status: 'Beta', betaCapacity: null, betaSpotsFilled: 0 })).toEqual({ kind: 'not-open' });
  });

  it('is closed for a beta app with capacity explicitly set to 0', () => {
    expect(getSignupState({ status: 'Beta', betaCapacity: 0, betaSpotsFilled: 0 })).toEqual({ kind: 'closed' });
  });

  it('is full when filled reaches capacity', () => {
    expect(getSignupState({ status: 'Beta', betaCapacity: 10, betaSpotsFilled: 10 })).toEqual({
      kind: 'full',
      capacity: 10,
      filled: 10,
    });
  });

  it('is full when filled somehow exceeds capacity', () => {
    expect(getSignupState({ status: 'Beta', betaCapacity: 10, betaSpotsFilled: 11 })).toEqual({
      kind: 'full',
      capacity: 10,
      filled: 11,
    });
  });

  it('is open with the correct remaining count when spots are available', () => {
    expect(getSignupState({ status: 'Beta', betaCapacity: 10, betaSpotsFilled: 4 })).toEqual({
      kind: 'open',
      capacity: 10,
      filled: 4,
      remaining: 6,
    });
  });
});

describe('getSignupCopy', () => {
  it('describes each closed state with the app name interpolated', () => {
    expect(getSignupCopy({ kind: 'not-open' }, 'Medoura').title).toContain('Medoura');
    expect(getSignupCopy({ kind: 'closed' }, 'Medoura').title).toContain('Medoura');
    expect(getSignupCopy({ kind: 'full', capacity: 10, filled: 10 }, 'Medoura').title).toContain('Medoura');
  });

  it('describes unavailable differently for a live app than for any other status', () => {
    const live = getSignupCopy({ kind: 'unavailable', status: 'Live' }, 'Medoura');
    expect(live.title).toContain('live');
    const other = getSignupCopy({ kind: 'unavailable', status: 'Paused' }, 'Medoura');
    expect(other.title).not.toContain('live');
  });

  it('throws for a state that should still show the form instead of a block', () => {
    expect(() => getSignupCopy({ kind: 'legacy-waitlist' }, 'Medoura')).toThrow();
    expect(() => getSignupCopy({ kind: 'open', capacity: 10, filled: 4, remaining: 6 }, 'Medoura')).toThrow();
  });
});
