import { describe, it, expect } from 'vitest';
import {
  EMAIL_HINT,
  EMPTY_BOOK_CALL,
  MAX_BOOK_CALL_MESSAGE,
  buildBookCallPayload,
  errorSummary,
  validateBookCall,
  validateBookCallField,
  validateNotifyEmail,
  type BookCallValues,
} from './service-forms';
import { FIELD_LIMITS } from './schemas';

const valid: BookCallValues = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@business.com',
  phone: '',
  company: 'Doe Plumbing',
  message: 'We want more leads for our plumbing business.',
};

describe('validateBookCall', () => {
  it('accepts a complete form, with phone left blank', () => {
    expect(validateBookCall(valid)).toEqual({});
  });

  it('flags every required field on an empty form, but never the optional phone', () => {
    const errors = validateBookCall(EMPTY_BOOK_CALL);
    expect(Object.keys(errors).sort()).toEqual(['company', 'email', 'firstName', 'lastName', 'message']);
    expect(errors.phone).toBeUndefined();
  });

  it('uses the email hint for a malformed email', () => {
    expect(validateBookCallField('email', { ...valid, email: 'nope' })).toBe(EMAIL_HINT);
    expect(validateBookCallField('email', { ...valid, email: 'a@b' })).toBe(EMAIL_HINT);
  });

  it('only checks the phone when one was typed', () => {
    expect(validateBookCallField('phone', { ...valid, phone: '' })).toBeUndefined();
    expect(validateBookCallField('phone', { ...valid, phone: '12' })).toMatch(/phone number/i);
    expect(validateBookCallField('phone', { ...valid, phone: '(212) 555-0123' })).toBeUndefined();
  });

  it('treats whitespace-only as empty', () => {
    expect(validateBookCallField('firstName', { ...valid, firstName: '   ' })).toBeTruthy();
    expect(validateBookCallField('company', { ...valid, company: '  ' })).toBeTruthy();
  });

  it('needs a message of at least 10 characters and keeps room for the company line', () => {
    expect(validateBookCallField('message', { ...valid, message: 'short' })).toBeTruthy();
    expect(validateBookCallField('message', { ...valid, message: 'x'.repeat(MAX_BOOK_CALL_MESSAGE + 1) })).toBeTruthy();
    expect(validateBookCallField('message', { ...valid, message: 'x'.repeat(MAX_BOOK_CALL_MESSAGE) })).toBeUndefined();
  });

  it('clears an error as soon as its field becomes valid', () => {
    const bad = { ...valid, email: '' };
    expect(validateBookCall(bad).email).toBe(EMAIL_HINT);
    expect(validateBookCall({ ...bad, email: 'jane@business.com' }).email).toBeUndefined();
  });
});

describe('errorSummary', () => {
  it('pluralises', () => {
    expect(errorSummary(1)).toBe('Check 1 field to continue.');
    expect(errorSummary(3)).toBe('Check 3 fields to continue.');
  });
});

describe('validateNotifyEmail', () => {
  it('accepts a normal email and rejects empty or malformed ones', () => {
    expect(validateNotifyEmail('name@business.com')).toBeUndefined();
    expect(validateNotifyEmail('  name@business.com  ')).toBeUndefined();
    expect(validateNotifyEmail('')).toBe(EMAIL_HINT);
    expect(validateNotifyEmail('name@')).toBe(EMAIL_HINT);
    expect(validateNotifyEmail('a'.repeat(FIELD_LIMITS.email) + '@b.co')).toBe(EMAIL_HINT);
  });
});

describe('buildBookCallPayload', () => {
  const service = { id: 'cofabri-marketing', name: 'CoFabri Marketing' };

  it('sends a sales inquiry tagged with the service app id', () => {
    const payload = buildBookCallPayload(valid, service, 'tok');
    expect(payload.inquiryType).toBe('sales');
    expect(payload.relatedApp).toBe('cofabri-marketing');
    expect(payload.subject).toBe('Book a call: CoFabri Marketing');
    expect(payload.turnstileToken).toBe('tok');
  });

  it('carries the company in the message and normalises the email', () => {
    const payload = buildBookCallPayload({ ...valid, email: ' Jane@Business.COM ' }, service, 't');
    expect(payload.message.startsWith('Company: Doe Plumbing\n\n')).toBe(true);
    expect(payload.email).toBe('jane@business.com');
  });

  it('prefers email contact without a phone, and any method with one', () => {
    expect(buildBookCallPayload(valid, service, 't').preferredContactMethod).toBe('email');
    expect(buildBookCallPayload({ ...valid, phone: '(212) 555-0123' }, service, 't').preferredContactMethod).toBe('any');
  });

  it('never exceeds the API limits for the longest allowed input', () => {
    const payload = buildBookCallPayload(
      { ...valid, company: 'c'.repeat(FIELD_LIMITS.companyName), message: 'm'.repeat(MAX_BOOK_CALL_MESSAGE) },
      { id: 'x', name: 'n'.repeat(200) },
      't'
    );
    expect(payload.message.length).toBeLessThanOrEqual(FIELD_LIMITS.message);
    expect(payload.subject.length).toBeLessThanOrEqual(FIELD_LIMITS.subject);
  });

  it('never includes a price', () => {
    expect(JSON.stringify(buildBookCallPayload(valid, service, 't'))).not.toMatch(/\$\s?\d/);
  });
});
