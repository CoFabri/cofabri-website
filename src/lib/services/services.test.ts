import { describe, expect, it } from 'vitest';
import { brandClass, isComingSoon, resolveServiceContent, serviceCardLine, serviceStatus } from './index';
import { parseServiceContent, serviceContentSchema } from './schema';
import { SERVICE_FALLBACKS } from './fallback';
import { FAMILY_MARKS, familyMarkSvg, hasFamilyMark, markIconScale, markStrokeWidth } from '../family-marks';

describe('lifecycle to pill mapping', () => {
  it('shows a service in development as Coming soon', () => {
    expect(serviceStatus({ status: 'In Development' })).toBe('Coming soon');
    expect(isComingSoon({ status: 'In Development' })).toBe(true);
  });

  it('shows every other status as Live', () => {
    for (const status of ['Live', 'Active', 'Beta', 'Something New']) {
      expect(serviceStatus({ status })).toBe('Live');
      expect(isComingSoon({ status })).toBe(false);
    }
  });
});

describe('brandClass', () => {
  it('maps the three CoFabri products and nothing else', () => {
    expect(brandClass('cofabri-crm')).toBe('br-crm');
    expect(brandClass('cofabri-marketing')).toBe('br-marketing');
    expect(brandClass('cofabri-concierge')).toBe('br-concierge');
    expect(brandClass('medoura')).toBe('');
    expect(brandClass(undefined)).toBe('');
  });
});

describe('service content', () => {
  it('uses Core metadata when it parses, even though a fallback exists', () => {
    const content = resolveServiceContent({ id: 'cofabri-marketing', service: { outcome: 'From Core.' } });
    expect(content?.outcome).toBe('From Core.');
  });

  it('falls back to the repo copy when metadata is empty or invalid', () => {
    for (const service of [undefined, null, {}, { outcome: '' }, 'junk', { outcome: 'ok', steps: [{ title: 'only one', body: 'x' }] }]) {
      expect(resolveServiceContent({ id: 'cofabri-marketing', service })).toEqual(SERVICE_FALLBACKS['cofabri-marketing']);
    }
  });

  it('returns null for an unknown service with no metadata', () => {
    expect(resolveServiceContent({ id: 'brand-new', service: undefined })).toBeNull();
  });

  it('builds the card line from cardLine, then outcome, then the description', () => {
    expect(serviceCardLine({ id: 'cofabri-marketing', service: undefined, description: 'd' })).toBe('We run your paid ads, from setup to reporting.');
    expect(serviceCardLine({ id: 'x', service: { outcome: 'Outcome' }, description: 'd' })).toBe('Outcome');
    expect(serviceCardLine({ id: 'x', service: undefined, description: 'Desc' })).toBe('Desc');
  });

  it('keeps every section optional except the outcome', () => {
    expect(parseServiceContent({ outcome: 'Just this.' })).toEqual({ outcome: 'Just this.' });
    expect(serviceContentSchema.safeParse({}).success).toBe(false);
  });
});

describe('repo fallback copy', () => {
  const all = JSON.stringify(SERVICE_FALLBACKS);

  it('has a page for both launch services', () => {
    expect(Object.keys(SERVICE_FALLBACKS).sort()).toEqual(['cofabri-concierge', 'cofabri-marketing']);
    for (const content of Object.values(SERVICE_FALLBACKS)) {
      expect(serviceContentSchema.safeParse(content).success).toBe(true);
    }
  });

  it('never shows a price', () => {
    expect(all).not.toMatch(/\$\s?\d|\d\s?(usd|dollars)|per month|\/mo\b|\d+\s?%/i);
  });

  it('has no proof section and never names the white-label CRM platform', () => {
    expect(all).not.toMatch(/proof|testimonial|case stud/i);
    expect(all).not.toMatch(/gohighlevel|go high level|highlevel|\bghl\b/i);
  });

  it('keeps Concierge free of compliance, telephony-vendor and internal-tech detail', () => {
    const concierge = JSON.stringify(SERVICE_FALLBACKS['cofabri-concierge']);
    expect(concierge).not.toMatch(/hipaa|twilio|telephon|softphone|supabase|cofabri-api|phi\b|recording/i);
  });

  it('uses Title Case for the one clickable label it mentions', () => {
    expect(all).toContain('Notify Me');
    expect(all).not.toMatch(/notify me\b(?<!Notify Me)/);
  });
});

describe('family marks', () => {
  it('has a tile for the three products only', () => {
    expect(Object.keys(FAMILY_MARKS).sort()).toEqual(['cofabri-concierge', 'cofabri-crm', 'cofabri-marketing']);
    expect(hasFamilyMark('cofabri-crm')).toBe(true);
    expect(hasFamilyMark('medoura')).toBe(false);
    expect(hasFamilyMark(undefined)).toBe(false);
  });

  it('draws a heavier line and a larger icon at 24px', () => {
    expect(markStrokeWidth(24)).toBe(2.3);
    expect(markStrokeWidth(36)).toBe(1.9);
    expect(markIconScale(24)).toBe(0.66);
    expect(markIconScale(56)).toBe(0.6);
  });

  it('exports a standalone svg that matches the tile', () => {
    const svg = familyMarkSvg(FAMILY_MARKS['cofabri-marketing']);
    expect(svg).toContain('#8A6973');
    expect(svg).toContain('#785861');
    expect(svg).toContain('#FFD8D0');
    expect(svg).toContain('aria-label="CoFabri Marketing"');
  });
});
