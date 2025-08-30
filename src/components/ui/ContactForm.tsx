'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { EnvelopeIcon, PhoneIcon, ClockIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Turnstile from './Turnstile';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  languagePreference: string;
  relatedApp: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  subject?: string;
  message?: string;
  turnstile?: string;
}

// Character limits
const FIRST_NAME_MAX_LENGTH = 50;
const LAST_NAME_MAX_LENGTH = 50;
const EMAIL_MAX_LENGTH = 100;
const SUBJECT_MAX_LENGTH = 100;
const MESSAGE_MAX_LENGTH = 2000;

interface App {
  id: string;
  name: string;
  status: string;
  faviconUrl?: string;
}

interface CustomDropdownProps {
  options: { value: string; label: string; image?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

function CustomDropdown({ options, value, onChange, placeholder, disabled = false }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-left flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
        }`}
      >
        <div className="flex items-center space-x-3">
          {selectedOption?.image ? (
            <img 
              src={selectedOption.image} 
              alt={selectedOption.label}
              className="w-6 h-6 rounded object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
            >
              {option.image ? (
                <img 
                  src={option.image} 
                  alt={option.label}
                  className="w-6 h-6 rounded object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <span className="text-gray-900">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple dropdown component for text-only options (no images)
function SimpleDropdown({ options, value, onChange, placeholder, disabled = false }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white text-left flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-900">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContactForm() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
    languagePreference: 'English',
    relatedApp: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [apps, setApps] = useState<App[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileError, setTurnstileError] = useState<string>('');

  // Debug environment variables on mount
  useEffect(() => {
    console.log('ContactForm mounted - Environment check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('NEXT_PUBLIC_TURNSTILE_SITE_KEY:', process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
    console.log('NEXT_PUBLIC_TURNSTILE_SITE_KEY length:', process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.length);
  }, []);

  // Fetch available apps
  useEffect(() => {
    const fetchApps = async () => {
      try {
        const response = await fetch('/api/apps');
        if (response.ok) {
          const appsData = await response.json();
          setApps(appsData);
        }
      } catch (error) {
        console.error('Failed to fetch apps:', error);
      } finally {
        setIsLoadingApps(false);
      }
    };

    fetchApps();
  }, []);

  // Update relatedApp when apps are loaded and we have URL parameters
  useEffect(() => {
    if (!isLoadingApps && apps.length > 0) {
      // Check if we have URL parameters for apps
      const urlApp = searchParams?.get('app') || '';
      
      if (urlApp) {
        // Find app by name (case-insensitive)
        const foundApp = apps.find(app => 
          app.name.toLowerCase() === urlApp.toLowerCase()
        );
        
        if (foundApp) {
          setFormData(prev => ({
            ...prev,
            relatedApp: foundApp.id
          }));
        }
      }
    }
  }, [isLoadingApps, apps, searchParams]);

  // Pre-fill form with URL parameters
  useEffect(() => {
    const firstName = searchParams?.get('firstName') || '';
    const lastName = searchParams?.get('lastName') || '';
    const email = searchParams?.get('email') || '';
    const language = searchParams?.get('language') || 'English';

    setFormData(prev => ({
      ...prev,
      firstName,
      lastName,
      email,
      languagePreference: language
    }));
  }, [searchParams]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length > FIRST_NAME_MAX_LENGTH) {
      newErrors.firstName = `First name must be ${FIRST_NAME_MAX_LENGTH} characters or less`;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length > LAST_NAME_MAX_LENGTH) {
      newErrors.lastName = `Last name must be ${LAST_NAME_MAX_LENGTH} characters or less`;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.trim().length > EMAIL_MAX_LENGTH) {
      newErrors.email = `Email must be ${EMAIL_MAX_LENGTH} characters or less`;
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length > SUBJECT_MAX_LENGTH) {
      newErrors.subject = `Subject must be ${SUBJECT_MAX_LENGTH} characters or less`;
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    } else if (formData.message.trim().length > MESSAGE_MAX_LENGTH) {
      newErrors.message = `Message must be ${MESSAGE_MAX_LENGTH} characters or less`;
    }

    if (!turnstileToken) {
      newErrors.turnstile = 'Please complete the security verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Apply character limits
    let processedValue = value;
    if (name === 'firstName' && value.length > FIRST_NAME_MAX_LENGTH) {
      processedValue = value.slice(0, FIRST_NAME_MAX_LENGTH);
    } else if (name === 'lastName' && value.length > LAST_NAME_MAX_LENGTH) {
      processedValue = value.slice(0, LAST_NAME_MAX_LENGTH);
    } else if (name === 'email' && value.length > EMAIL_MAX_LENGTH) {
      processedValue = value.slice(0, EMAIL_MAX_LENGTH);
    } else if (name === 'subject' && value.length > SUBJECT_MAX_LENGTH) {
      processedValue = value.slice(0, SUBJECT_MAX_LENGTH);
    } else if (name === 'message' && value.length > MESSAGE_MAX_LENGTH) {
      processedValue = value.slice(0, MESSAGE_MAX_LENGTH);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleLanguageChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      languagePreference: value
    }));
  };

  const handleAppChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      relatedApp: value
    }));
  };

  const clearForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      subject: '',
      message: '',
      languagePreference: 'English',
      relatedApp: ''
    });
    setErrors({});
    setTurnstileToken('');
    setTurnstileError('');
  };

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setTurnstileError('');
    if (errors.turnstile) {
      setErrors(prev => ({
        ...prev,
        turnstile: undefined
      }));
    }
  }, [errors.turnstile]);

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
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          turnstileToken
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        // Reset form after successful submission
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          subject: '',
          message: '',
          languagePreference: 'English',
          relatedApp: ''
        });
        setErrors({});
        setTurnstileToken('');
        setTurnstileError('');
      } else {
        const errorData = await response.json();
        setSubmitStatus('error');
        setErrorMessage(errorData.error || 'Failed to submit form. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get Turnstile site key based on environment
  const getTurnstileSiteKey = () => {
    console.log('ContactForm - NODE_ENV:', process.env.NODE_ENV);
    console.log('ContactForm - NEXT_PUBLIC_TURNSTILE_SITE_KEY:', process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
    
    if (process.env.NODE_ENV === 'development') {
      // Use Cloudflare's test keys for development
      return '1x00000000000000000000AA';
    }
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
    console.log('ContactForm - Turnstile site key:', siteKey ? 'SET' : 'NOT SET', 'Length:', siteKey.length);
    return siteKey;
  };

  // Prepare app options for the custom dropdown
  const appOptions = [
    { value: '', label: 'Select an app (optional)', image: undefined },
    ...apps
      .filter(app => app.status === 'Active' || app.status === 'In Development')
      .map(app => ({
        value: app.id, // Use record ID instead of app name
        label: app.name,
        image: app.faviconUrl
      }))
  ];

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm">
      {submitStatus === 'success' ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Message Sent Successfully!</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Thank you for contacting us. We've received your message and will get back to you as soon as possible.
          </p>
          <button
            type="button"
            onClick={clearForm}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Send Another Message
          </button>
        </div>
      ) : submitStatus === 'error' ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Submission Failed</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => setSubmitStatus('idle')}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-semibold mb-8">Send us a Message</h2>
          
          {/* Debug info - remove after fixing */}
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Debug Info:</strong> NODE_ENV: {process.env.NODE_ENV}, 
              TURNSTILE_KEY: {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? 'SET' : 'NOT SET'} 
              (Length: {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.length || 0})
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              maxLength={FIRST_NAME_MAX_LENGTH}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.firstName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your first name"
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            />
            {errors.firstName && (
              <p id="firstName-error" className="mt-1 text-sm text-red-600">
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              maxLength={LAST_NAME_MAX_LENGTH}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.lastName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your last name"
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
            {errors.lastName && (
              <p id="lastName-error" className="mt-1 text-sm text-red-600">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              maxLength={EMAIL_MAX_LENGTH}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your email address"
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="languagePreference" className="block text-sm font-medium text-gray-700 mb-2">
              Language Preference
            </label>
            <SimpleDropdown
              options={[
                { value: 'English', label: 'English' },
                { value: 'Spanish', label: 'Spanish' },
                { value: 'French', label: 'French' },
                { value: 'German', label: 'German' },
                { value: 'Italian', label: 'Italian' },
                { value: 'Portuguese', label: 'Portuguese' },
                { value: 'Chinese', label: 'Chinese' },
                { value: 'Japanese', label: 'Japanese' },
                { value: 'Korean', label: 'Korean' },
                { value: 'Arabic', label: 'Arabic' },
                { value: 'Russian', label: 'Russian' },
                { value: 'Other', label: 'Other' }
              ]}
              value={formData.languagePreference}
              onChange={handleLanguageChange}
              placeholder="Select a language"
            />
          </div>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            required
            maxLength={SUBJECT_MAX_LENGTH}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              errors.subject ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="What is this regarding?"
            aria-describedby={errors.subject ? 'subject-error' : undefined}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.subject && (
              <p id="subject-error" className="text-sm text-red-600">
                {errors.subject}
              </p>
            )}
            <p className={`text-sm ml-auto ${
              formData.subject.length > SUBJECT_MAX_LENGTH * 0.9 
                ? 'text-orange-600' 
                : formData.subject.length > SUBJECT_MAX_LENGTH * 0.8 
                ? 'text-yellow-600' 
                : 'text-gray-500'
            }`}>
              {formData.subject.length}/{SUBJECT_MAX_LENGTH}
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="relatedApp" className="block text-sm font-medium text-gray-700 mb-2">
            Application (Optional)
          </label>
          {isLoadingApps ? (
            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
              Loading apps...
            </div>
          ) : (
            <CustomDropdown
              options={appOptions}
              value={formData.relatedApp}
              onChange={handleAppChange}
              placeholder="Select an app (optional)"
              disabled={isLoadingApps}
            />
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            required
            rows={6}
            maxLength={MESSAGE_MAX_LENGTH}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
              errors.message ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Tell us more about your inquiry..."
            aria-describedby={errors.message ? 'message-error' : undefined}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.message && (
              <p id="message-error" className="text-sm text-red-600">
                {errors.message}
              </p>
            )}
            <p className={`text-sm ml-auto ${
              formData.message.length > MESSAGE_MAX_LENGTH * 0.9 
                ? 'text-orange-600' 
                : formData.message.length > MESSAGE_MAX_LENGTH * 0.8 
                ? 'text-yellow-600' 
                : 'text-gray-500'
            }`}>
              {formData.message.length}/{MESSAGE_MAX_LENGTH}
            </p>
          </div>
        </div>

        {/* Turnstile Security Verification */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Verification *
          </label>
          <Turnstile
            key="contact-form-turnstile"
            siteKey={getTurnstileSiteKey()}
            onVerify={handleTurnstileVerify}
            onError={handleTurnstileError}
            onExpire={handleTurnstileExpire}
            theme="light"
            size="normal"
            className="flex justify-start"
          />
          {(errors.turnstile || turnstileError) && (
            <p className="mt-1 text-sm text-red-600">
              {errors.turnstile || turnstileError}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={clearForm}
            className="text-sm text-gray-600 hover:text-gray-800 inline-flex items-center transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Clear form
          </button>
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-600">
              * Required fields
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </div>
              ) : (
                'Send Message'
              )}
            </button>
          </div>
        </div>
      </form>
        </>
      )}
    </div>
  );
} 