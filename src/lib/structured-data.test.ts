import { describe, expect, it } from 'vitest';
import {
  ORGANIZATION_ID,
  buildArticleSchema,
  buildSoftwareApplicationSchema,
  serializeJsonLd,
} from './structured-data';

describe('buildSoftwareApplicationSchema', () => {
  it('builds the required shape and references the organization by @id', () => {
    const s = buildSoftwareApplicationSchema({
      id: 'gathr',
      name: 'Gathr',
      description: 'Event tool',
      appUrl: 'gathr.app',
      category: 'Community',
    });
    expect(s).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Gathr',
      description: 'Event tool',
      applicationCategory: 'Community',
      operatingSystem: 'Web',
      url: 'https://gathr.app/',
      publisher: { '@id': ORGANIZATION_ID },
    });
  });

  it('falls back to the CoFabri app page and omits missing optional fields', () => {
    const s = buildSoftwareApplicationSchema({ id: 'x', name: 'X' });
    expect(s.url).toBe('https://cofabri.com/apps/x');
    expect(s.applicationCategory).toBe('BusinessApplication');
    expect('description' in s).toBe(false);
    expect('offers' in s).toBe(false);
    expect('aggregateRating' in s).toBe(false);
  });

  it('ignores an unparseable app url', () => {
    expect(buildSoftwareApplicationSchema({ id: 'x', name: 'X', appUrl: 'http://' }).url).toBe('https://cofabri.com/apps/x');
  });
});

describe('buildArticleSchema', () => {
  it('builds required fields with ISO dates and canonical mainEntityOfPage', () => {
    const s = buildArticleSchema({
      slug: 'setup',
      title: 'Setup',
      description: 'How to set up',
      publishedAt: '2026-01-02',
      lastUpdated: '2026-02-03T10:00:00Z',
      tags: ['a', 'b'],
    });
    expect(s).toMatchObject({
      '@type': 'Article',
      headline: 'Setup',
      description: 'How to set up',
      datePublished: '2026-01-02T00:00:00.000Z',
      dateModified: '2026-02-03T10:00:00.000Z',
      keywords: 'a, b',
      author: { '@id': ORGANIZATION_ID },
      publisher: { '@id': ORGANIZATION_ID },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://cofabri.com/knowledge-base/setup' },
    });
  });

  it('omits missing optional fields and drops invalid dates', () => {
    const s = buildArticleSchema({ slug: 's', title: 'T', publishedAt: 'nope', tags: [] });
    expect('description' in s).toBe(false);
    expect('datePublished' in s).toBe(false);
    expect('dateModified' in s).toBe(false);
    expect('keywords' in s).toBe(false);
  });

  it('uses the published date for dateModified when never updated', () => {
    const s = buildArticleSchema({ slug: 's', title: 'T', publishedAt: '2026-01-02' });
    expect(s.dateModified).toBe(s.datePublished);
  });
});

describe('serializeJsonLd', () => {
  it('escapes < so content cannot break out of the script tag', () => {
    const out = serializeJsonLd(buildArticleSchema({ slug: 's', title: '</script><script>alert(1)</script>' }));
    expect(out).not.toContain('<');
    expect(out).toContain('\\u003c/script>');
    expect(JSON.parse(out).headline).toBe('</script><script>alert(1)</script>');
  });
});
