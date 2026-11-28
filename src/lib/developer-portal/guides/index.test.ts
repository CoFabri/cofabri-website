import { createHmac } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { getAppGuide } from './index';

describe('getAppGuide', () => {
  it('returns null for an app with no guide', () => {
    expect(getAppGuide('some-unknown-app')).toBeNull();
  });

  it('still returns the existing rx-bridge guide (no regression)', () => {
    expect(getAppGuide('rx-bridge')?.appId).toBe('rx-bridge');
  });

  it('registers the maven-os guide', () => {
    expect(getAppGuide('maven-os')?.appId).toBe('maven-os');
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

  it('the patient notes section documents the signed pathname, the answers and the limits', () => {
    const guide = getAppGuide('praxis')!;
    const notes = guide.sections.find((s) => s.id === 'patient-notes')!;
    expect(notes).toBeDefined();
    const text = JSON.stringify(notes);
    for (const phrase of ['Patient Notes URL', '<t>.<url pathname>', '403', 'no longer in Praxis care', '5 seconds', '1,048,576', '500 notes', '20,000']) {
      expect(text).toContain(phrase);
    }
    // The fixed example must really verify, or integrators chase a bug that is ours.
    const request = notes.blocks.find((b) => b.kind === 'code' && b.language === 'http')!.code!;
    const [, pathname] = /^GET (\S+) /.exec(request)!;
    const [, t, signature] = /X-Praxis-Signature: t=(\d+),v1=([0-9a-f]{64})/.exec(request)!;
    const secret = 'whsec_test_0123456789abcdef0123456789abcdef';
    expect(createHmac('sha256', secret).update(`${t}.${pathname}`).digest('hex')).toBe(signature);
  });

  it('the patient notes section says a 403 needs the not_shared body and how writtenAt without an offset is read', () => {
    const notes = getAppGuide('praxis')!.sections.find((s) => s.id === 'patient-notes')!;
    const rows = notes.blocks.flatMap((b) => (b.kind === 'table' ? b.table!.rows : []));
    const forbidden = rows.find((r) => r[0] === '403')!;
    expect(forbidden.join(' ')).toContain('`{"error":"not_shared"}`');
    expect(forbidden.join(' ')).toMatch(/any other 403/i);
    const writtenAt = rows.find((r) => r[0] === 'writtenAt')!;
    expect(writtenAt.join(' ')).toMatch(/without an offset.*read as UTC/);
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
