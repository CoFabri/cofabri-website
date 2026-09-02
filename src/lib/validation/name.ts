// Strips characters that can't belong to a real name (digits, control chars,
// most punctuation) while allowing any Latin-script letter, combining marks,
// apostrophes, hyphens and periods (e.g. "O'Brien", "Mary-Jane", "St. John").
const DISALLOWED_NAME_CHARS = /[^\p{Script=Latin}\p{M}\s'’\-.]/gu;

/**
 * Removes characters that can't appear in a name and collapses/trims
 * whitespace. Intended for submit-time cleanup, not live typing (trimming
 * on every keystroke would eat a trailing space before a second word).
 */
export function sanitizeName(raw: string): string {
  const normalized = raw.normalize('NFKC');
  const stripped = normalized.replace(DISALLOWED_NAME_CHARS, '');
  return stripped.replace(/\s+/g, ' ').trim();
}

/**
 * Title-cases a name, treating whitespace, apostrophes and hyphens as word
 * boundaries so "o'brien" -> "O'Brien" and "mary-jane" -> "Mary-Jane". Safe
 * to run on every keystroke since it never trims.
 */
export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(^|[\s'’-])(\p{L})/gu, (_match, sep: string, letter: string) => sep + letter.toUpperCase());
}

/** Live onChange transform for a name input field. */
export function formatNameInput(raw: string): string {
  return toTitleCase(raw);
}

/** Submit/blur-time cleanup: strip disallowed characters, then title-case. */
export function normalizeName(raw: string): string {
  return toTitleCase(sanitizeName(raw));
}
