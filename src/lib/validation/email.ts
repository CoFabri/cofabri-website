const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(raw: string): boolean {
  return EMAIL_PATTERN.test(raw.trim());
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Live onChange transform for an email input field. */
export function formatEmailInput(raw: string): string {
  return raw.toLowerCase();
}
