import { describe, expect, it } from 'vitest';
import {
  contactSchema,
  supportSchema,
  partnerSchema,
  checkContactMethodRequirement,
  zodIssuesToFieldErrors,
} from './schemas';

const validContact = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  preferredContactMethod: 'any',
  subject: 'Hello',
  message: 'This is a long enough message.',
  inquiryType: 'general',
};

describe('contactSchema', () => {
  it('accepts a fully valid submission and normalizes name/email casing', () => {
    const parsed = contactSchema.safeParse({ ...validContact, firstName: 'jane', email: 'JANE@Example.com' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.firstName).toBe('Jane');
      expect(parsed.data.email).toBe('jane@example.com');
    }
  });

  it('defaults a missing inquiryType to "general"', () => {
    const rest: Record<string, unknown> = { ...validContact };
    delete rest.inquiryType;
    const parsed = contactSchema.safeParse(rest);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.inquiryType).toBe('general');
  });

  it('rejects an inquiryType present but not one of the two valid values', () => {
    const parsed = contactSchema.safeParse({ ...validContact, inquiryType: '' });
    expect(parsed.success).toBe(false);
  });

  it('treats email as optional — a phone-only submission is not an email error', () => {
    const parsed = contactSchema.safeParse({ ...validContact, email: '' });
    expect(parsed.success).toBe(true);
  });

  it('rejects a malformed email when one is provided', () => {
    const parsed = contactSchema.safeParse({ ...validContact, email: 'not-an-email' });
    expect(parsed.success).toBe(false);
  });

  it('rejects a message under the 10-character minimum', () => {
    const parsed = contactSchema.safeParse({ ...validContact, message: 'short' });
    expect(parsed.success).toBe(false);
  });

  it('rejects a missing first name', () => {
    const parsed = contactSchema.safeParse({ ...validContact, firstName: '  ' });
    expect(parsed.success).toBe(false);
  });
});

describe('supportSchema', () => {
  const validSupport = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    preferredContactMethod: 'email',
    subject: 'support',
    description: 'Something is broken on the dashboard.',
  };

  it('requires a valid email (unlike contactSchema, it is not optional)', () => {
    expect(supportSchema.safeParse({ ...validSupport, email: '' }).success).toBe(false);
    expect(supportSchema.safeParse(validSupport).success).toBe(true);
  });
});

describe('partnerSchema', () => {
  const validPartner = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    preferredContactMethod: 'any',
    industry: 'Healthcare',
    message: 'Tell us about your business and the idea in enough detail.',
  };

  it('requires industry', () => {
    expect(partnerSchema.safeParse({ ...validPartner, industry: '' }).success).toBe(false);
  });

  it('accepts a valid partner submission', () => {
    expect(partnerSchema.safeParse(validPartner).success).toBe(true);
  });
});

describe('checkContactMethodRequirement', () => {
  it('requires at least one of email or phone', () => {
    const errors = checkContactMethodRequirement({
      email: '',
      phone: '',
      isPhoneValid: false,
      preferredContactMethod: 'any',
    });
    expect(errors.email).toBeTruthy();
    expect(errors.phone).toBeTruthy();
  });

  it('flags an invalid phone even when an email is present', () => {
    const errors = checkContactMethodRequirement({
      email: 'jane@example.com',
      phone: '123',
      isPhoneValid: false,
      preferredContactMethod: 'any',
    });
    expect(errors.phone).toBeTruthy();
    expect(errors.email).toBeUndefined();
  });

  it('requires the chosen preferred method to actually be reachable', () => {
    const errors = checkContactMethodRequirement({
      email: '',
      phone: '+12125550123',
      isPhoneValid: true,
      preferredContactMethod: 'email',
    });
    expect(errors.preferredContactMethod).toBeTruthy();
  });

  it('is satisfied by phone alone when preferred method is "any"', () => {
    const errors = checkContactMethodRequirement({
      email: '',
      phone: '+12125550123',
      isPhoneValid: true,
      preferredContactMethod: 'any',
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe('zodIssuesToFieldErrors', () => {
  it('keeps only the first issue per field', () => {
    const result = contactSchema.safeParse({ ...validContact, firstName: '', lastName: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = zodIssuesToFieldErrors(result.error);
      expect(Object.keys(fieldErrors)).toEqual(expect.arrayContaining(['firstName', 'lastName']));
      expect(typeof fieldErrors.firstName).toBe('string');
    }
  });
});
