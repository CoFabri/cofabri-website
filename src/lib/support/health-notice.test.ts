import { describe, expect, it } from 'vitest';
import { shouldShowHealthNotice } from './health-notice';

const apps = [
  { id: 'medoura', category: 'healthcare' },
  { id: 'praxis', category: 'Healthcare' },
  { id: 'gathr', category: 'social' },
  { id: 'nocat' },
  { id: 'nullcat', category: null },
  { id: 'padded', category: '  HEALTHCARE ' },
];

describe('shouldShowHealthNotice', () => {
  it('is false while apps are not loaded', () => {
    expect(shouldShowHealthNotice([], apps, false)).toBe(false);
    expect(shouldShowHealthNotice(['medoura'], apps, false)).toBe(false);
  });
  it('is true when nothing is selected (unknown app)', () => {
    expect(shouldShowHealthNotice([], apps, true)).toBe(true);
  });
  it('is true for a healthcare app', () => {
    expect(shouldShowHealthNotice(['medoura'], apps, true)).toBe(true);
  });
  it('is false for a non-healthcare app only', () => {
    expect(shouldShowHealthNotice(['gathr'], apps, true)).toBe(false);
  });
  it('is true for a mix of healthcare and social', () => {
    expect(shouldShowHealthNotice(['gathr', 'medoura'], apps, true)).toBe(true);
  });
  it('handles odd casing and whitespace', () => {
    expect(shouldShowHealthNotice(['praxis'], apps, true)).toBe(true);
    expect(shouldShowHealthNotice(['padded'], apps, true)).toBe(true);
  });
  it('is false when category is missing or null', () => {
    expect(shouldShowHealthNotice(['nocat'], apps, true)).toBe(false);
    expect(shouldShowHealthNotice(['nullcat'], apps, true)).toBe(false);
  });
  it('ignores selected ids not in the list', () => {
    expect(shouldShowHealthNotice(['ghost'], apps, true)).toBe(false);
  });
});
