import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
} from 'libphonenumber-js';

export type { CountryCode };

export const DEFAULT_COUNTRY: CountryCode = 'US';

export interface CountryOption {
  code: CountryCode;
  name: string;
  callingCode: string;
  flag: string;
}

export function countryFlagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

export const COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    name: regionNames?.of(code) ?? code,
    callingCode: getCountryCallingCode(code),
    flag: countryFlagEmoji(code),
  }))
  .sort((a, b) => {
    if (a.code === DEFAULT_COUNTRY) return -1;
    if (b.code === DEFAULT_COUNTRY) return 1;
    return a.name.localeCompare(b.name);
  });

export function isValidPhone(raw: string, country: CountryCode = DEFAULT_COUNTRY): boolean {
  if (!raw.trim()) return false;
  try {
    return isValidPhoneNumber(raw, country);
  } catch {
    return false;
  }
}

/** Normalizes a phone number to E.164 (e.g. "+15555555555"), or null if invalid. */
export function normalizePhone(raw: string, country: CountryCode = DEFAULT_COUNTRY): string | null {
  const parsed = parsePhoneNumberFromString(raw, country);
  return parsed?.isValid() ? parsed.number : null;
}

/**
 * Live as-you-type formatting. `previousDisplay` is the field's current
 * display value before this keystroke, used to detect backspacing through a
 * formatting character (like the ")" in "(555)") so the digit actually gets
 * removed instead of the formatter re-inserting it.
 */
export function formatPhoneAsYouType(
  raw: string,
  previousDisplay: string,
  country: CountryCode = DEFAULT_COUNTRY
): string {
  let toFormat = raw;
  if (raw.length < previousDisplay.length) {
    const oldDigits = previousDisplay.replace(/\D/g, '');
    const newDigits = raw.replace(/\D/g, '');
    if (newDigits.length === oldDigits.length) {
      toFormat = newDigits.slice(0, -1);
    }
  }

  const formatted = new AsYouType(country).input(toFormat);

  // Once a number is longer than the country's max valid length, AsYouType
  // gives up formatting and just echoes back the raw digits, which lets the
  // field grow unbounded. Reject the extra keystroke instead.
  if (validatePhoneNumberLength(formatted, country) === 'TOO_LONG') {
    return previousDisplay;
  }

  return formatted;
}
