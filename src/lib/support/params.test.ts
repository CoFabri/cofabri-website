import { describe, expect, it } from 'vitest';
import {
  parseSupportParams,
  sanitizeAudience,
  sanitizeEntryPoint,
  sanitizeTenant,
} from './params';

const q = (s: string) => new URLSearchParams(s);

describe('sanitizeEntryPoint', () => {
  it('accepts chat', () => {
    expect(sanitizeEntryPoint('chat')).toBe('chat');
  });
  it('defaults to website when absent', () => {
    expect(sanitizeEntryPoint(null)).toBe('website');
    expect(sanitizeEntryPoint('')).toBe('website');
  });
  it('keeps known values', () => {
    expect(sanitizeEntryPoint('help-menu')).toBe('help-menu');
    expect(sanitizeEntryPoint('error-page')).toBe('error-page');
  });
  it('maps anything unknown to other, never storing free text', () => {
    expect(sanitizeEntryPoint('<script>alert(1)</script>')).toBe('other');
    expect(sanitizeEntryPoint('Medoura')).toBe('other');
  });
});

describe('sanitizeAudience', () => {
  it('only patient is patient', () => {
    expect(sanitizeAudience('patient')).toBe('patient');
    expect(sanitizeAudience('staff')).toBe('staff');
    expect(sanitizeAudience('admin')).toBe('staff');
    expect(sanitizeAudience(null)).toBe('staff');
  });
});

describe('sanitizeTenant', () => {
  it('trims, strips control characters and caps length', () => {
    expect(sanitizeTenant('  Acme Clinic \n')).toBe('Acme Clinic');
    expect(sanitizeTenant('a'.repeat(500))).toHaveLength(100);
    expect(sanitizeTenant(undefined)).toBe('');
  });
});

describe('parseSupportParams', () => {
  it('returns safe defaults for no params', () => {
    expect(parseSupportParams(null)).toEqual({
      appNames: [], subject: 'support', firstName: '', lastName: '', email: '', phone: '',
      language: 'English', from: 'website', tenant: '', audience: 'staff',
    });
  });

  it('reads existing params and the new ones', () => {
    const p = parseSupportParams(q('app=Medoura,Praxis&subject=feature&firstName=Jane&lastName=Doe&email=jane%40example.com&phone=%2B15551234567&language=Spanish&from=settings&tenant=Acme'));
    expect(p.appNames).toEqual(['Medoura', 'Praxis']);
    expect(p.subject).toBe('feature');
    expect(p.firstName).toBe('Jane');
    expect(p.email).toBe('jane@example.com');
    expect(p.language).toBe('Spanish');
    expect(p.from).toBe('settings');
    expect(p.tenant).toBe('Acme');
  });

  it('falls back on a bad subject or language', () => {
    const p = parseSupportParams(q('subject=weird&language=Klingon'));
    expect(p.subject).toBe('support');
    expect(p.language).toBe('English');
  });

  it('ignores identity params for patients', () => {
    const p = parseSupportParams(q('audience=patient&firstName=Jane&lastName=Doe&email=jane%40example.com&phone=5551234567&tenant=Acme%20Clinic'));
    expect(p.audience).toBe('patient');
    expect(p.firstName).toBe('');
    expect(p.lastName).toBe('');
    expect(p.email).toBe('');
    expect(p.phone).toBe('');
    expect(p.tenant).toBe('Acme Clinic');
  });

  it('caps oversized identity values', () => {
    const p = parseSupportParams(q(`firstName=${'a'.repeat(300)}&email=${'b'.repeat(300)}%40x.com`));
    expect(p.firstName.length).toBeLessThanOrEqual(50);
    expect(p.email.length).toBeLessThanOrEqual(100);
  });

  it('uses the first value when a param repeats', () => {
    expect(parseSupportParams(q('from=help-menu&from=settings')).from).toBe('help-menu');
  });

  it('ignores the legacy referrer param', () => {
    expect(parseSupportParams(q('referrer=Medoura')).from).toBe('website');
  });
});
