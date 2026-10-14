import { describe, expect, it } from 'vitest';
import { filterPolicyGroups, groupPoliciesByApp } from './policy-groups';

const p = (slug: string, title: string, apps: string[]) => ({ slug, title, policyType: 'legal', apps, versionNumber: 1 });

describe('groupPoliciesByApp', () => {
  it('groups by app, sorted by app name then title, using display names', () => {
    const groups = groupPoliciesByApp(
      [p('b', 'Terms', ['tradecraft']), p('a', 'Privacy', ['tradecraft']), p('c', 'Privacy', ['gathr'])],
      { tradecraft: 'Tradecraft', gathr: 'Gathr' },
    );
    expect(groups.map((g) => g.appName)).toEqual(['Gathr', 'Tradecraft']);
    expect(groups[1]!.policies.map((x) => x.title)).toEqual(['Privacy', 'Terms']);
  });
  it('lists a multi-app policy under each app and Title-Cases unknown app ids', () => {
    const groups = groupPoliciesByApp([p('x', 'Cookies', ['cofabri-website', 'luxier'])], {});
    expect(groups.map((g) => g.appName)).toEqual(['Cofabri Website', 'Luxier']);
    expect(groups.every((g) => g.policies.length === 1)).toBe(true);
  });
  it('returns no groups for no policies, and ignores policies with no apps', () => {
    expect(groupPoliciesByApp([], {})).toEqual([]);
    expect(groupPoliciesByApp([p('x', 'X', [])], {})).toEqual([]);
  });
});

describe('filterPolicyGroups', () => {
  const groups = groupPoliciesByApp(
    [p('a', 'Privacy Policy', ['tradecraft']), p('b', 'Terms Of Use', ['tradecraft']), p('c', 'Privacy Policy', ['gathr'])],
    { tradecraft: 'Tradecraft', gathr: 'Gathr' },
  );
  it('returns everything for a blank search', () => {
    expect(filterPolicyGroups(groups, '  ')).toEqual(groups);
  });
  it('matches title case-insensitively and drops emptied groups', () => {
    const out = filterPolicyGroups(groups, 'TERMS');
    expect(out.map((g) => g.appName)).toEqual(['Tradecraft']);
    expect(out[0]!.policies.map((x) => x.slug)).toEqual(['b']);
  });
  it('matches the app name and keeps all of that app\'s policies', () => {
    const out = filterPolicyGroups(groups, 'gath');
    expect(out.map((g) => g.appName)).toEqual(['Gathr']);
    expect(out[0]!.policies).toHaveLength(1);
  });
  it('returns [] for no groups or no match', () => {
    expect(filterPolicyGroups([], 'x')).toEqual([]);
    expect(filterPolicyGroups(groups, 'zzz')).toEqual([]);
  });
});
