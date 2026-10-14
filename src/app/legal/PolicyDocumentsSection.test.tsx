import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PolicyDocumentsSection from './PolicyDocumentsSection';
import { groupPoliciesByApp } from '@/lib/policy-groups';

const groups = groupPoliciesByApp(
  [
    { slug: 'tradecraft-terms-of-use', title: 'Terms Of Use', policyType: 'legal', apps: ['tradecraft'], versionNumber: 2, publishedAt: '2026-10-01T00:00:00Z' },
    { slug: 'gathr-privacy', title: 'Privacy Policy', policyType: 'legal', apps: ['gathr'], versionNumber: 1 },
  ],
  { tradecraft: 'Tradecraft', gathr: 'Gathr' },
);

describe('PolicyDocumentsSection', () => {
  it('renders nothing when there are no groups', () => {
    expect(renderToStaticMarkup(<PolicyDocumentsSection groups={[]} search="" />)).toBe('');
  });
  it('renders the heading, app groups and reader links', () => {
    const html = renderToStaticMarkup(<PolicyDocumentsSection groups={groups} search="" />);
    expect(html).toContain('Documents');
    expect(html).toContain('href="/legal/tradecraft-terms-of-use"');
    expect(html).toContain('href="/legal/gathr-privacy"');
    expect(html).toContain('Read Document');
  });
  it('filters by search and renders nothing when nothing matches', () => {
    const html = renderToStaticMarkup(<PolicyDocumentsSection groups={groups} search="terms" />);
    expect(html).toContain('tradecraft-terms-of-use');
    expect(html).not.toContain('gathr-privacy');
    expect(renderToStaticMarkup(<PolicyDocumentsSection groups={groups} search="zzz" />)).toBe('');
  });
});
