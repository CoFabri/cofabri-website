import { describe, it, expect } from 'vitest';
import { getAppGuide } from './index';

describe('getAppGuide', () => {
  it('returns null for an app with no guide', () => {
    expect(getAppGuide('some-unknown-app')).toBeNull();
  });

  it('still returns the existing rx-bridge guide (no regression)', () => {
    expect(getAppGuide('rx-bridge')?.appId).toBe('rx-bridge');
  });

  it('returns a well-formed praxis guide covering every section the spec requires', () => {
    const guide = getAppGuide('praxis');
    expect(guide).not.toBeNull();
    expect(guide!.appId).toBe('praxis');
    const ids = guide!.sections.map((s) => s.id);
    expect(ids).toEqual(
      expect.arrayContaining(['quickstart', 'authentication', 'signatures', 'fhir-mapping', 'errors-and-limits', 'versioning', 'webhooks'])
    );
    // Every section has at least one block -- an empty section would render a bare heading.
    for (const section of guide!.sections) {
      expect(section.blocks.length, `section "${section.id}" has no blocks`).toBeGreaterThan(0);
    }
  });

  it('the signatures section gives both a Node and a Python verification example', () => {
    const guide = getAppGuide('praxis')!;
    const signatures = guide.sections.find((s) => s.id === 'signatures')!;
    const languages = signatures.blocks.filter((b) => b.kind === 'code').map((b) => b.language);
    expect(languages).toEqual(expect.arrayContaining(['javascript', 'python']));
  });

  it('quotes the exact golden signature pinned by the Praxis repo\'s webhook-signing.golden.test.ts', () => {
    const guide = getAppGuide('praxis')!;
    const signatures = guide.sections.find((s) => s.id === 'signatures')!;
    const jsExample = signatures.blocks.find((b) => b.kind === 'code' && b.language === 'javascript')!;
    expect(jsExample.code).toContain('7d24d3d18fdb2d6edc8e528a1887aed5aef421d03dbb93ac97b426775a269549');
  });

  it('the messaging section documents message.outbound, the endpoints, and the eventId dedupe rule', () => {
    const guide = getAppGuide('praxis')!;
    const messaging = guide.sections.find((s) => s.id === 'messaging')!;
    expect(messaging).toBeDefined();
    const text = JSON.stringify(messaging);
    expect(text).toContain('message.outbound');
    for (const path of [
      '/api/v1/messages/{messageId}/status',
      '/api/v1/patients/{externalPatientId}/messages',
      '/api/v1/patients/{externalPatientId}/messaging',
    ]) {
      expect(text).toContain(path);
    }
    // Retries reuse the messageId but get a new eventId: telling integrators to dedupe on
    // messageId would silently drop every provider resend.
    expect(text).toMatch(/Deduplicate on `eventId`/);
    expect(text).not.toMatch(/dedupe on `?messageId/i);
    expect(text).toContain('messaging_disabled');
  });

  it('the FHIR mapping section documents the external-patient-id identifier system', () => {
    const guide = getAppGuide('praxis')!;
    const fhirMapping = guide.sections.find((s) => s.id === 'fhir-mapping')!;
    const text = JSON.stringify(fhirMapping);
    expect(text).toContain('urn:cofabri:praxis:external-patient-id');
  });

  it('returns a well-formed medoura guide covering the Landing Page API sections', () => {
    const guide = getAppGuide('medoura');
    expect(guide).not.toBeNull();
    expect(guide!.appId).toBe('medoura');
    const ids = guide!.sections.map((s) => s.id);
    expect(ids).toEqual(
      expect.arrayContaining(['overview', 'quickstart', 'authentication', 'rate-limits', 'caching', 'errors', 'categories-filter', 'content', 'versioning'])
    );
    for (const section of guide!.sections) {
      expect(section.blocks.length, `section "${section.id}" has no blocks`).toBeGreaterThan(0);
    }
    const text = JSON.stringify(guide);
    for (const endpoint of ['/api/v1/branding', '/api/v1/categories', '/api/v1/products', '/api/v1/pricing', '/api/v1/content/home']) {
      expect(text).toContain(endpoint);
    }
  });
});
