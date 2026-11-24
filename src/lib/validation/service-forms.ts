import { isValidEmail, normalizeEmail } from './email';
import { isValidPhone, DEFAULT_COUNTRY } from './phone';
import { FIELD_LIMITS } from './schemas';

// Client-side validation for the Book a Call dialog and the Notify Me field.
// The server (/api/contact, /api/coming-soon) re-validates everything; this is
// the UX layer that produces the inline messages.

export const EMAIL_HINT = 'Enter an email like name@business.com.';

export interface BookCallValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

export type BookCallField = keyof BookCallValues;
export type BookCallErrors = Partial<Record<BookCallField, string>>;

export const EMPTY_BOOK_CALL: BookCallValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  message: '',
};

/** Order the fields appear in the dialog, used to focus the first invalid one. */
export const BOOK_CALL_FIELD_ORDER: BookCallField[] = ['firstName', 'lastName', 'email', 'phone', 'company', 'message'];

export function validateBookCallField(field: BookCallField, values: BookCallValues): string | undefined {
  const value = values[field].trim();
  switch (field) {
    case 'firstName':
      if (!value) return 'Enter your first name.';
      if (value.length > FIELD_LIMITS.firstName) return `Use ${FIELD_LIMITS.firstName} characters or fewer.`;
      return undefined;
    case 'lastName':
      if (!value) return 'Enter your last name.';
      if (value.length > FIELD_LIMITS.lastName) return `Use ${FIELD_LIMITS.lastName} characters or fewer.`;
      return undefined;
    case 'email':
      if (!value || !isValidEmail(value)) return EMAIL_HINT;
      if (value.length > FIELD_LIMITS.email) return `Use ${FIELD_LIMITS.email} characters or fewer.`;
      return undefined;
    case 'phone':
      // Optional: only checked when something was typed.
      if (value && !isValidPhone(value, DEFAULT_COUNTRY)) return 'Enter a phone number like (555) 123-4567.';
      return undefined;
    case 'company':
      if (!value) return 'Enter your company or business name.';
      if (value.length > FIELD_LIMITS.companyName) return `Use ${FIELD_LIMITS.companyName} characters or fewer.`;
      return undefined;
    case 'message':
      if (value.length < 10) return 'Tell us a little more, at least a sentence.';
      if (value.length > MAX_BOOK_CALL_MESSAGE) return `Use ${MAX_BOOK_CALL_MESSAGE} characters or fewer.`;
      return undefined;
  }
}

// The company is sent as the first line of the message, so the message itself
// gets the remaining room under the API's limit.
const COMPANY_LINE_ALLOWANCE = FIELD_LIMITS.companyName + 'Company: '.length + 2;
export const MAX_BOOK_CALL_MESSAGE = FIELD_LIMITS.message - COMPANY_LINE_ALLOWANCE;

export function validateBookCall(values: BookCallValues): BookCallErrors {
  const errors: BookCallErrors = {};
  for (const field of BOOK_CALL_FIELD_ORDER) {
    const error = validateBookCallField(field, values);
    if (error) errors[field] = error;
  }
  return errors;
}

/** "Check 2 fields to continue." */
export function errorSummary(count: number): string {
  return `Check ${count} field${count === 1 ? '' : 's'} to continue.`;
}

export function validateNotifyEmail(raw: string): string | undefined {
  const value = raw.trim();
  if (!value || !isValidEmail(value) || value.length > FIELD_LIMITS.email) return EMAIL_HINT;
  return undefined;
}

/** The request body /api/contact expects for a Book a Call submission. */
export function buildBookCallPayload(
  values: BookCallValues,
  service: { id: string; name: string },
  turnstileToken: string
) {
  const phone = values.phone.trim();
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: normalizeEmail(values.email),
    phone: phone || undefined,
    // Reaching them by phone is only an option when they gave a number.
    preferredContactMethod: phone ? 'any' : 'email',
    subject: `Book a call: ${service.name}`.slice(0, FIELD_LIMITS.subject),
    message: `Company: ${values.company.trim()}\n\n${values.message.trim()}`,
    languagePreference: 'English',
    inquiryType: 'sales',
    relatedApp: service.id,
    turnstileToken,
  };
}
