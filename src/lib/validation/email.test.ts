import { describe, expect, it } from 'vitest';
import { isValidEmail, normalizeEmail, formatEmailInput } from './email';

describe('isValidEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isValidEmail('person@example.com')).toBe(true);
    expect(isValidEmail('  person@example.com  ')).toBe(true); // trims before testing
  });

  it('rejects addresses missing an @ or a domain dot', () => {
    expect(isValidEmail('personexample.com')).toBe(false);
    expect(isValidEmail('person@examplecom')).toBe(false);
    expect(isValidEmail('person@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects addresses containing whitespace', () => {
    expect(isValidEmail('person @example.com')).toBe(false);
    expect(isValidEmail('per son@example.com')).toBe(false);
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Person@Example.COM  ')).toBe('person@example.com');
  });
});

describe('formatEmailInput', () => {
  it('lowercases without trimming, so a trailing space typed mid-entry is preserved', () => {
    expect(formatEmailInput('Person@Example.com ')).toBe('person@example.com ');
  });
});
