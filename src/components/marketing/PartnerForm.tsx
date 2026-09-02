'use client';

import { useState, useCallback } from 'react';
import Turnstile from './Turnstile';
import PhoneField from './PhoneField';
import PreferredContactMethodField from './PreferredContactMethodField';
import { partnerSchema, zodIssuesToFieldErrors, checkContactMethodRequirement, FIELD_LIMITS } from '@/lib/validation/schemas';
import { formatNameInput } from '@/lib/validation/name';
import { formatEmailInput } from '@/lib/validation/email';
import { DEFAULT_COUNTRY, isValidPhone, normalizePhone, type CountryCode } from '@/lib/validation/phone';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContactMethod: string;
  companyName: string;
  industry: string;
  message: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  preferredContactMethod?: string;
  industry?: string;
  message?: string;
  turnstile?: string;
}

const FIRST_NAME_MAX_LENGTH = FIELD_LIMITS.firstName;
const LAST_NAME_MAX_LENGTH = FIELD_LIMITS.lastName;
const EMAIL_MAX_LENGTH = FIELD_LIMITS.email;
const COMPANY_NAME_MAX_LENGTH = FIELD_LIMITS.companyName;
const INDUSTRY_MAX_LENGTH = FIELD_LIMITS.industry;
const MESSAGE_MAX_LENGTH = FIELD_LIMITS.message;

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  preferredContactMethod: 'any',
  companyName: '',
  industry: '',
  message: '',
};

export default function PartnerForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileError, setTurnstileError] = useState<string>('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(DEFAULT_COUNTRY);

  const maxLengths: Partial<Record<keyof FormData, number>> = {
    firstName: FIRST_NAME_MAX_LENGTH,
    lastName: LAST_NAME_MAX_LENGTH,
    email: EMAIL_MAX_LENGTH,
    companyName: COMPANY_NAME_MAX_LENGTH,
    industry: INDUSTRY_MAX_LENGTH,
    message: MESSAGE_MAX_LENGTH,
  };

  const validateForm = (): boolean => {
    const parsed = partnerSchema.safeParse(formData);
    const newErrors: FormErrors = parsed.success ? {} : (zodIssuesToFieldErrors(parsed.error) as FormErrors);

    const isPhoneValid = formData.phone.trim() ? isValidPhone(formData.phone, phoneCountry) : true;
    Object.assign(newErrors, checkContactMethodRequirement({
      email: formData.email,
      phone: formData.phone,
      isPhoneValid,
      preferredContactMethod: formData.preferredContactMethod,
    }));

    if (!turnstileToken) {
      newErrors.turnstile = 'Please complete the security verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as { name: keyof FormData; value: string };
    const max = maxLengths[name];
    let processedValue = max && value.length > max ? value.slice(0, max) : value;

    if (name === 'firstName' || name === 'lastName') {
      processedValue = formatNameInput(processedValue);
    } else if (name === 'email') {
      processedValue = formatEmailInput(processedValue);
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, phone: value }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const handleContactMethodChange = (value: string) => {
    setFormData((prev) => ({ ...prev, preferredContactMethod: value }));
    if (errors.preferredContactMethod) {
      setErrors((prev) => ({ ...prev, preferredContactMethod: undefined }));
    }
  };

  const clearForm = () => {
    setFormData(initialFormData);
    setErrors({});
    setTurnstileToken('');
    setTurnstileError('');
    setPhoneCountry(DEFAULT_COUNTRY);
  };

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileError('');
    setErrors((prev) => ({ ...prev, turnstile: undefined }));
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileError('Security verification failed. Please try again.');
    setTurnstileToken('');
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileError('Security verification expired. Please complete it again.');
    setTurnstileToken('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = partnerSchema.safeParse(formData);
    if (!validateForm() || !parsed.success) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const normalizedPhone = formData.phone.trim() ? normalizePhone(formData.phone, phoneCountry) ?? undefined : undefined;

      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, phone: normalizedPhone, turnstileToken }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        clearForm();
      } else {
        const errorData = await response.json();
        setSubmitStatus('error');
        setErrorMessage(errorData.error || 'Failed to submit form. Please try again.');
      }
    } catch {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTurnstileSiteKey = () => {
    if (process.env.NODE_ENV === 'development') {
      return '1x00000000000000000000AA';
    }
    return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  };

  if (submitStatus === 'success') {
    return (
      <div className="rounded-2xl border border-border p-9 text-center">
        <h2 className="text-2xl font-semibold text-foreground">Got it.</h2>
        <p className="mt-3 text-muted-foreground">
          We&apos;ll read every word of this ourselves and get back to you.
        </p>
        <button
          type="button"
          onClick={() => setSubmitStatus('idle')}
          className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent-hover"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border p-9">
      <h2 className="text-2xl font-semibold text-foreground">Propose a partnership</h2>
      <p className="mt-2 text-muted-foreground">
        Tell us about your industry and what you&apos;d want to build. We read every one of these ourselves.
      </p>

      {submitStatus === 'error' && (
        <div className="mt-6 rounded-lg border border-danger bg-danger/10 p-4 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-foreground">First Name *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              maxLength={FIRST_NAME_MAX_LENGTH}
              className={`w-full rounded-lg border px-4 py-3 transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 ${errors.firstName ? 'border-danger' : 'border-border-strong'}`}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            />
            {errors.firstName && <p id="firstName-error" className="mt-1 text-sm text-danger">{errors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-foreground">Last Name *</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              maxLength={LAST_NAME_MAX_LENGTH}
              className={`w-full rounded-lg border px-4 py-3 transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 ${errors.lastName ? 'border-danger' : 'border-border-strong'}`}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
            {errors.lastName && <p id="lastName-error" className="mt-1 text-sm text-danger">{errors.lastName}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              maxLength={EMAIL_MAX_LENGTH}
              className={`w-full rounded-lg border px-4 py-3 transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 ${errors.email ? 'border-danger' : 'border-border-strong'}`}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && <p id="email-error" className="mt-1 text-sm text-danger">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium text-foreground">Phone</label>
            <PhoneField
              id="phone"
              value={formData.phone}
              country={phoneCountry}
              onValueChange={handlePhoneChange}
              onCountryChange={setPhoneCountry}
              error={errors.phone}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Provide an email address or phone number so we can get back to you.
        </p>

        <PreferredContactMethodField
          value={formData.preferredContactMethod}
          onChange={handleContactMethodChange}
          error={errors.preferredContactMethod}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="companyName" className="mb-2 block text-sm font-medium text-foreground">Company (optional)</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              maxLength={COMPANY_NAME_MAX_LENGTH}
              className="w-full rounded-lg border border-border-strong px-4 py-3 transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <div>
            <label htmlFor="industry" className="mb-2 block text-sm font-medium text-foreground">Industry *</label>
            <input
              type="text"
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              maxLength={INDUSTRY_MAX_LENGTH}
              placeholder="e.g. Veterinary clinics"
              className={`w-full rounded-lg border px-4 py-3 transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 ${errors.industry ? 'border-danger' : 'border-border-strong'}`}
              aria-describedby={errors.industry ? 'industry-error' : undefined}
            />
            {errors.industry && <p id="industry-error" className="mt-1 text-sm text-danger">{errors.industry}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">Tell us about your business and the idea *</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            rows={6}
            maxLength={MESSAGE_MAX_LENGTH}
            className={`w-full resize-none rounded-lg border px-4 py-3 transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20 ${errors.message ? 'border-danger' : 'border-border-strong'}`}
            aria-describedby={errors.message ? 'message-error' : undefined}
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.message && <p id="message-error" className="text-sm text-danger">{errors.message}</p>}
            <p className="ml-auto text-sm text-muted-foreground">{formData.message.length}/{MESSAGE_MAX_LENGTH}</p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Security Verification *</label>
          {getTurnstileSiteKey() ? (
            <Turnstile
              key="partner-form-turnstile"
              siteKey={getTurnstileSiteKey()!}
              onVerify={handleTurnstileVerify}
              onError={handleTurnstileError}
              onExpire={handleTurnstileExpire}
              theme="light"
              size="normal"
              className="flex justify-start"
            />
          ) : (
            <div className="rounded-lg border border-danger bg-danger/10 p-3 text-sm text-danger">
              Security verification is not configured. Please contact the administrator.
            </div>
          )}
          {(errors.turnstile || turnstileError) && (
            <p className="mt-1 text-sm text-danger">{errors.turnstile || turnstileError}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <button type="button" onClick={clearForm} className="text-sm text-muted-foreground hover:text-foreground">
            Clear form
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
