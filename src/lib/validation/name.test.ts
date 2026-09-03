import { describe, expect, it } from 'vitest';
import { sanitizeName, toTitleCase, formatNameInput, normalizeName } from './name';

describe('sanitizeName', () => {
  it('strips digits and control/punctuation characters not valid in a name', () => {
    expect(sanitizeName('J0hn123')).toBe('Jhn');
    expect(sanitizeName('John! @Doe#')).toBe('John Doe');
  });

  it('keeps apostrophes, hyphens and periods', () => {
    expect(sanitizeName("O'Brien")).toBe("O'Brien");
    expect(sanitizeName('Mary-Jane')).toBe('Mary-Jane');
    expect(sanitizeName('St. John')).toBe('St. John');
  });

  it('collapses repeated whitespace and trims', () => {
    expect(sanitizeName('  John   Doe  ')).toBe('John Doe');
  });
});

describe('toTitleCase', () => {
  it('capitalizes the first letter of each word', () => {
    expect(toTitleCase('john doe')).toBe('John Doe');
  });

  it('treats apostrophes and hyphens as word boundaries', () => {
    expect(toTitleCase("o'brien")).toBe("O'Brien");
    expect(toTitleCase('mary-jane')).toBe('Mary-Jane');
  });

  it('never trims, so a trailing space typed mid-entry is preserved', () => {
    expect(toTitleCase('john ')).toBe('John ');
  });
});

describe('formatNameInput', () => {
  it('delegates to toTitleCase for live typing', () => {
    expect(formatNameInput('jane')).toBe('Jane');
  });
});

describe('normalizeName', () => {
  it('sanitizes then title-cases for submit-time cleanup', () => {
    expect(normalizeName("  o'brien123  ")).toBe("O'Brien");
    expect(normalizeName('mary-jane!!')).toBe('Mary-Jane');
  });
});
