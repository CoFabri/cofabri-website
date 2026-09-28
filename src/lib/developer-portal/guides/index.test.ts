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

  it('the FHIR mapping section documents the external-patient-id identifier system', () => {
    const guide = getAppGuide('praxis')!;
    const fhirMapping = guide.sections.find((s) => s.id === 'fhir-mapping')!;
    const text = JSON.stringify(fhirMapping);
    expect(text).toContain('urn:cofabri:praxis:external-patient-id');
  });
});
