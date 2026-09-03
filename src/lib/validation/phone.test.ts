import { describe, expect, it } from 'vitest';
import { isValidPhone, normalizePhone, formatPhoneAsYouType, countryFlagEmoji, DEFAULT_COUNTRY } from './phone';

describe('isValidPhone', () => {
  it('accepts a real, correctly-formatted US number', () => {
    expect(isValidPhone('2125550123', 'US')).toBe(true);
    expect(isValidPhone('(212) 555-0123', 'US')).toBe(true);
  });

  it('rejects a too-short number', () => {
    expect(isValidPhone('5551234', 'US')).toBe(false);
  });

  it('rejects blank input without throwing', () => {
    expect(isValidPhone('', 'US')).toBe(false);
    expect(isValidPhone('   ', 'US')).toBe(false);
  });

  it('does not throw on garbage input', () => {
    expect(isValidPhone('not a phone number', 'US')).toBe(false);
  });

  it('defaults to the US when no country is given', () => {
    expect(DEFAULT_COUNTRY).toBe('US');
    expect(isValidPhone('2125550123')).toBe(true);
  });
});

describe('normalizePhone', () => {
  it('normalizes a valid number to E.164', () => {
    expect(normalizePhone('(212) 555-0123', 'US')).toBe('+12125550123');
  });

  it('returns null for an invalid number instead of throwing', () => {
    expect(normalizePhone('5551234', 'US')).toBeNull();
  });
});

describe('formatPhoneAsYouType', () => {
  it('formats digits as they are typed', () => {
    const formatted = formatPhoneAsYouType('2125550123', '212555012', 'US');
    expect(formatted).toContain('212');
    expect(formatted).toContain('555');
  });

  it('lets a real backspace through formatting punctuation', () => {
    // Typing "(212) 555-0123" then backspacing once should remove the last
    // digit, not just re-echo the same formatted string because the raw
    // value only lost a non-digit formatting character.
    const previous = formatPhoneAsYouType('2125550123', '', 'US');
    const afterBackspace = formatPhoneAsYouType(previous.slice(0, -1), previous, 'US');
    expect(afterBackspace).not.toBe(previous);
  });

  it('stops growing once the number is longer than the country allows', () => {
    const tooLong = '21255501234567890';
    const previousDisplay = formatPhoneAsYouType(tooLong.slice(0, -1), '', 'US');
    const result = formatPhoneAsYouType(tooLong, previousDisplay, 'US');
    expect(result).toBe(previousDisplay);
  });
});

describe('countryFlagEmoji', () => {
  it('converts a two-letter country code into its regional indicator flag emoji', () => {
    expect(countryFlagEmoji('US')).toBe('🇺🇸');
    expect(countryFlagEmoji('gb')).toBe('🇬🇧');
  });
});
