import { z } from 'zod';
import { isValidEmail, normalizeEmail } from './email';
import { normalizeName } from './name';

// Shared across client (maxLength attrs / counters) and server (Zod schemas)
// so the two never drift apart.
export const FIELD_LIMITS = {
  firstName: 50,
  lastName: 50,
  email: 100,
  subject: 100,
  message: 2000,
  description: 2000,
  companyOrganization: 100,
  companyName: 100,
  industry: 100,
  phone: 30,
} as const;

function nameField(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(FIELD_LIMITS.firstName, `${label} must be ${FIELD_LIMITS.firstName} characters or less`)
    .transform((value) => normalizeName(value));
}

const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(FIELD_LIMITS.email, `Email must be ${FIELD_LIMITS.email} characters or less`)
  .refine((value) => isValidEmail(value), 'Please enter a valid email address')
  .transform((value) => normalizeEmail(value));

// For forms where email is optional (e.g. a phone number can stand in for
// it) — accepts '', missing, or null as "not provided" (a request simply
// omitting the key should never surface as a confusing "Required" error),
// but still validates format/length when a value is present.
const optionalEmailField = z.preprocess(
  (value) => (value === undefined || value === null ? '' : value),
  z
    .string()
    .trim()
    .max(FIELD_LIMITS.email, `Email must be ${FIELD_LIMITS.email} characters or less`)
    .refine((value) => value === '' || isValidEmail(value), 'Please enter a valid email address')
    .transform((value) => (value ? normalizeEmail(value) : ''))
);

const preferredContactMethodField = z.string().trim().min(1, 'Please select a preferred contact method');

export const CONTACT_METHOD_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'any', label: 'Any' },
] as const;

function optionalCapped(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or less`)
    .optional()
    .or(z.literal(''));
}

function longTextField(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(10, `${label} must be at least 10 characters long`)
    .max(max, `${label} must be ${max} characters or less`);
}

export const contactSchema = z.object({
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  email: optionalEmailField,
  preferredContactMethod: preferredContactMethodField,
  subject: z
    .string()
    .trim()
    .min(1, 'Subject is required')
    .max(FIELD_LIMITS.subject, `Subject must be ${FIELD_LIMITS.subject} characters or less`),
  message: longTextField('Message', FIELD_LIMITS.message),
  languagePreference: z.string().trim().optional(),
  relatedApp: z.string().trim().optional(),
  // Missing entirely (e.g. a direct API call) defaults to 'general'; present
  // but not one of the two valid values (including '') is a validation error.
  inquiryType: z
    .string()
    .optional()
    .transform((value) => value ?? 'general')
    .refine(
      (value) => value === 'sales' || value === 'general',
      'Please select what this is about, then try again.'
    ),
});

export const supportSchema = z.object({
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  email: emailField,
  languagePreference: z.string().trim().optional(),
  companyOrganization: optionalCapped('Company/Organization', FIELD_LIMITS.companyOrganization),
  preferredContactMethod: z.string().trim().min(1, 'Please select a preferred contact method'),
  subject: z.string().trim().min(1, 'Please select a subject'),
  description: longTextField('Description', FIELD_LIMITS.description),
});

export const partnerSchema = z.object({
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  email: optionalEmailField,
  preferredContactMethod: preferredContactMethodField,
  companyName: optionalCapped('Company name', FIELD_LIMITS.companyName),
  industry: z
    .string()
    .trim()
    .min(1, 'Industry is required')
    .max(FIELD_LIMITS.industry, `Industry must be ${FIELD_LIMITS.industry} characters or less`),
  message: longTextField('Tell us about your business and the idea', FIELD_LIMITS.message),
  // Partnership inquiries are about partnering with CoFabri as a company, not
  // about a specific app — the form has no natural app picker, so this isn't
  // exposed in the UI today. It's kept optional here so /api/partners is
  // ready to forward `app_id` to cofabri-api the moment a caller (or a future
  // UI) does supply one.
  relatedApp: z.string().trim().optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
export type SupportFormValues = z.infer<typeof supportSchema>;
export type PartnerFormValues = z.infer<typeof partnerSchema>;

export interface ContactMethodErrors {
  email?: string;
  phone?: string;
  preferredContactMethod?: string;
}

/**
 * Cross-field check for forms where email and phone are each individually
 * optional but at least one must be provided, and the chosen preferred
 * contact method must actually be reachable. `phone` is the raw (unnormalized)
 * display value; `isPhoneValid` should already reflect format validation
 * (e.g. via `isValidPhone`) so this function only handles the "is it
 * present/required" logic, not phone number format itself.
 */
export function checkContactMethodRequirement(input: {
  email: string;
  phone: string;
  isPhoneValid: boolean;
  preferredContactMethod: string;
}): ContactMethodErrors {
  const errors: ContactMethodErrors = {};
  const hasEmail = Boolean(input.email.trim());
  const hasPhone = Boolean(input.phone.trim());

  if (!hasEmail && !hasPhone) {
    const message = 'Please provide an email address or phone number';
    errors.email = message;
    errors.phone = message;
  } else if (hasPhone && !input.isPhoneValid) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (!input.preferredContactMethod) {
    errors.preferredContactMethod = 'Please select a preferred contact method';
  } else if (input.preferredContactMethod === 'email' && !hasEmail) {
    errors.preferredContactMethod = 'Add an email address, or choose a different contact method';
  } else if (input.preferredContactMethod === 'phone' && !hasPhone) {
    errors.preferredContactMethod = 'Add a phone number, or choose a different contact method';
  }

  return errors;
}

/** Maps the first Zod issue per field path into a flat {field: message} object. */
export function zodIssuesToFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}
