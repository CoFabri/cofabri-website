'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Turnstile from './Turnstile';

interface FormData {
  firstName: string;
  lastName: string;
  languagePreference: string;
  companyOrganization: string;
  preferredContactMethod: string;
  email: string;
  phone: string;
  applications: string[];
  subject: string;
  description: string;
  screenshots: File[];
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  preferredContactMethod?: string;
  email?: string;
  phone?: string;
  subject?: string;
  description?: string;
  turnstile?: string;
}

// Character limits
const FIRST_NAME_MAX_LENGTH = 50;
const LAST_NAME_MAX_LENGTH = 50;
const EMAIL_MAX_LENGTH = 100;
const COMPANY_ORGANIZATION_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 2000;

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
// Multi-select dropdown component
function MultiSelectDropdown({ options, selectedValues, onChange, placeholder, disabled = false }: {
  options: { value: string; label: string; image?: string }[];
  selectedValues: string[];
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

  const selectedOptions = options.filter(option => selectedValues.includes(option.value));

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
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {selectedOptions.length > 0 ? (
            <div className="flex items-center space-x-2 min-w-0">
              {selectedOptions.slice(0, 2).map((option) => (
                <div key={option.value} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {option.image && (
                    <img 
                      src={option.image} 
                      alt={option.label}
                      className="w-4 h-4 rounded object-contain"
                    />
                  )}
                  <span className="truncate">{option.label}</span>
                </div>
              ))}
              {selectedOptions.length > 2 && (
                <span className="text-gray-500 text-sm">
                  +{selectedOptions.length - 2} more
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => onChange(option.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
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
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

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

export default function SupportForm() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    languagePreference: 'English',
    companyOrganization: '',
    preferredContactMethod: 'any',
    email: '',
    phone: '',
    applications: [],
    subject: 'support',
    description: '',
    screenshots: []
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [apps, setApps] = useState<App[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileError, setTurnstileError] = useState<string>('');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [urlAppsInitialized, setUrlAppsInitialized] = useState(false);

  // Debug environment variables on mount
  useEffect(() => {
    console.log('SupportForm mounted - Environment check:');
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

  // Update selectedApps when apps are loaded and we have URL parameters
  useEffect(() => {
    if (!isLoadingApps && apps.length > 0) {
      // Check if we have URL parameters for apps
      const urlApp = searchParams?.get('app') || '';
      const appNames = urlApp ? urlApp.split(',').map(name => name.trim()).filter(name => name) : [];
      
      if (appNames.length > 0) {
        // Find apps by name (case-insensitive)
        const validAppIds = appNames
          .map(appName => {
            const foundApp = apps.find(app => 
              app.name.toLowerCase() === appName.toLowerCase()
            );
            return foundApp?.id;
          })
          .filter(id => id) as string[];
        

        
        if (validAppIds.length > 0 && JSON.stringify(validAppIds) !== JSON.stringify(selectedApps)) {
          setSelectedApps(validAppIds);
          setFormData(prev => ({
            ...prev,
            applications: validAppIds
          }));
        }
      }
    }
  }, [isLoadingApps, apps, searchParams, selectedApps]);

  // Pre-fill form with URL parameters
  useEffect(() => {
    const firstName = searchParams?.get('firstName') || '';
    const lastName = searchParams?.get('lastName') || '';
    const email = searchParams?.get('email') || '';
    const rawPhone = searchParams?.get('phone') || '';
    const language = searchParams?.get('language') || 'English';
    const subject = searchParams?.get('subject') || 'support';

    // Format phone number if it comes from URL parameters
    const phone = rawPhone ? formatPhoneNumber(rawPhone) : '';

    setFormData(prev => ({
      ...prev,
      firstName,
      lastName,
      email,
      phone,
      languagePreference: language,
      subject
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

    if (!formData.preferredContactMethod) {
      newErrors.preferredContactMethod = 'Please select a preferred contact method';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.email.trim().length > EMAIL_MAX_LENGTH) {
      newErrors.email = `Email must be ${EMAIL_MAX_LENGTH} characters or less`;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      // Validate US phone number format (XXX) XXX-XXXX
      const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid US phone number: (555) 555-5555';
      }
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    } else if (formData.description.trim().length > DESCRIPTION_MAX_LENGTH) {
      newErrors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less`;
    }

    if (!turnstileToken) {
      newErrors.turnstile = 'Please complete the security verification';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Apply character limits
    let processedValue = value;
    if (name === 'firstName' && value.length > FIRST_NAME_MAX_LENGTH) {
      processedValue = value.slice(0, FIRST_NAME_MAX_LENGTH);
    } else if (name === 'lastName' && value.length > LAST_NAME_MAX_LENGTH) {
      processedValue = value.slice(0, LAST_NAME_MAX_LENGTH);
    } else if (name === 'email' && value.length > EMAIL_MAX_LENGTH) {
      processedValue = value.slice(0, EMAIL_MAX_LENGTH);
    } else if (name === 'companyOrganization' && value.length > COMPANY_ORGANIZATION_MAX_LENGTH) {
      processedValue = value.slice(0, COMPANY_ORGANIZATION_MAX_LENGTH);
    } else if (name === 'description' && value.length > DESCRIPTION_MAX_LENGTH) {
      processedValue = value.slice(0, DESCRIPTION_MAX_LENGTH);
    }
    
    // Special handling for phone number formatting
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(processedValue);
      setFormData(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Function to format phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const trimmed = phoneNumber.slice(0, 10);
    
    // Format based on length
    if (trimmed.length === 0) return '';
    if (trimmed.length <= 3) return `(${trimmed}`;
    if (trimmed.length <= 6) return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3)}`;
    return `(${trimmed.slice(0, 3)}) ${trimmed.slice(3, 6)}-${trimmed.slice(6)}`;
  };

  const handleLanguageChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      languagePreference: value
    }));
  };

  const handleContactMethodChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      preferredContactMethod: value
    }));
  };

  const handleSubjectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      subject: value
    }));
  };

  const handleAppSelection = (appId: string) => {
    setSelectedApps(prev => {
      const newSelection = prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId];
      
      setFormData(formData => ({
        ...formData,
        applications: newSelection
      }));
      
      return newSelection;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file sizes (10MB limit per file, 50MB total for Vercel Blob)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const maxTotalSize = 50 * 1024 * 1024; // 50MB
    
    const validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        alert(`File "${file.name}" is too large. Maximum file size is 10MB.`);
        return false;
      }
      return true;
    });
    
    const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > maxTotalSize) {
      alert(`Total file size is too large. Maximum total size is 50MB.`);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      screenshots: validFiles
    }));
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
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('languagePreference', formData.languagePreference);
      formDataToSend.append('companyOrganization', formData.companyOrganization);
      formDataToSend.append('preferredContactMethod', formData.preferredContactMethod);
      formDataToSend.append('email', formData.email);
      // Clean phone number for API (remove formatting)
      const cleanPhone = formData.phone.replace(/\D/g, '');
      formDataToSend.append('phone', cleanPhone);
      formDataToSend.append('applications', JSON.stringify(formData.applications));
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('turnstileToken', turnstileToken);

      // Append screenshots
      formData.screenshots.forEach((file, index) => {
        formDataToSend.append(`screenshots`, file);
      });

      const response = await fetch('/api/support', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        setSubmitStatus('success');
        // Reset form after successful submission
        setFormData({
          firstName: '',
          lastName: '',
          languagePreference: 'English',
          companyOrganization: '',
          preferredContactMethod: 'any',
          email: '',
          phone: '',
          applications: [],
          subject: 'support',
          description: '',
          screenshots: []
        });
        setSelectedApps([]);
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

  const clearForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      languagePreference: 'English',
      companyOrganization: '',
      preferredContactMethod: 'any',
      email: '',
      phone: '',
      applications: [],
      subject: 'support',
      description: '',
      screenshots: []
    });
    setSelectedApps([]);
    setErrors({});
    setTurnstileToken('');
    setTurnstileError('');
    setSubmitStatus('idle');
  };

  // Get Turnstile site key based on environment
  const getTurnstileSiteKey = () => {
    console.log('SupportForm - NODE_ENV:', process.env.NODE_ENV);
    console.log('SupportForm - NEXT_PUBLIC_TURNSTILE_SITE_KEY:', process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
    
    if (process.env.NODE_ENV === 'development') {
      return '1x00000000000000000000AA';
    }
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
    console.log('SupportForm - Turnstile site key:', siteKey ? 'SET' : 'NOT SET', 'Length:', siteKey.length);
    return siteKey;
  };

  // Prepare app options for the custom dropdown
  const appOptions = apps
    .filter(app => app.status === 'Active' || app.status === 'In Development')
    .map(app => ({
      value: app.id,
      label: app.name,
      image: app.faviconUrl
    }));

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm">
      {submitStatus === 'success' ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Support Ticket Submitted!</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Thank you for contacting us. We've received your support request and will get back to you as soon as possible.
          </p>
          <button
            type="button"
            onClick={clearForm}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Another Ticket
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
          <h2 className="text-2xl font-semibold mb-8">Submit a Support Ticket</h2>
          
          {/* Debug info - remove after fixing */}
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Debug Info:</strong> NODE_ENV: {process.env.NODE_ENV}, 
              TURNSTILE_KEY: {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? 'SET' : 'NOT SET'} 
              (Length: {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.length || 0})
            </p>
            <p className="text-sm text-yellow-800 mt-2">
              <strong>Raw Value:</strong> "{process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || 'undefined'}"
            </p>
            <p className="text-sm text-yellow-800">
              <strong>All NEXT_PUBLIC vars:</strong> {Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')).join(', ')}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Contact Information Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          
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

          <div>
            <label htmlFor="languagePreference" className="block text-sm font-medium text-gray-700 mb-2">
              Language Preference
            </label>
            <SimpleDropdown
              options={[
                { value: 'English', label: 'English' },
                { value: 'Spanish', label: 'Spanish' }
              ]}
              value={formData.languagePreference}
              onChange={handleLanguageChange}
              placeholder="Select a language"
            />
          </div>

          <div>
            <label htmlFor="companyOrganization" className="block text-sm font-medium text-gray-700 mb-2">
              Company/Organization
            </label>
            <input
              type="text"
              id="companyOrganization"
              name="companyOrganization"
              value={formData.companyOrganization}
              onChange={handleInputChange}
              maxLength={COMPANY_ORGANIZATION_MAX_LENGTH}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter your company or organization"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preferred Contact Method *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'email', label: 'Email', icon: '📧' },
                { value: 'phone', label: 'Phone', icon: '📞' },
                { value: 'any', label: 'Any', icon: '✅' }
              ].map((option) => (
                <label 
                  key={option.value} 
                  className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    formData.preferredContactMethod === option.value
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="preferredContactMethod"
                    value={option.value}
                    checked={formData.preferredContactMethod === option.value}
                    onChange={(e) => handleContactMethodChange(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.preferredContactMethod === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {formData.preferredContactMethod === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{option.icon}</span>
                      <span className="text-sm font-medium text-gray-900">{option.label}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.preferredContactMethod && (
              <p className="mt-2 text-sm text-red-600">
                {errors.preferredContactMethod}
              </p>
            )}
            <button
              type="button"
              onClick={() => handleContactMethodChange('')}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700 inline-flex items-center transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Selection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 pl-16 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="(555) 555-5555"
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  maxLength={14}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-gray-500">🇺🇸</span>
                    <span className="text-xs text-gray-400">+1</span>
                  </div>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                US phone number format: (555) 555-5555
              </p>
              {errors.phone && (
                <p id="phone-error" className="mt-1 text-sm text-red-600">
                  {errors.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Information Section */}
        <div className="space-y-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Ticket Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application(s)
            </label>
            <MultiSelectDropdown
              options={appOptions}
              selectedValues={selectedApps}
              onChange={handleAppSelection}
              placeholder="Select applications..."
              disabled={isLoadingApps}
            />
            {selectedApps.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600">
                  Selected: {selectedApps.length} application{selectedApps.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Subject *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'support', label: 'Support/Help', icon: '🆘', description: 'Get help with issues or questions' },
                { value: 'feature', label: 'Feature Request', icon: '💡', description: 'Suggest new features or improvements' }
              ].map((option) => (
                <label 
                  key={option.value} 
                  className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    formData.subject === option.value
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="subject"
                    value={option.value}
                    checked={formData.subject === option.value}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-start space-x-3 w-full">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                      formData.subject === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {formData.subject === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{option.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                      </div>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.subject && (
              <p className="mt-2 text-sm text-red-600">
                {errors.subject}
              </p>
            )}
            <button
              type="button"
              onClick={() => handleSubjectChange('')}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700 inline-flex items-center transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Selection
            </button>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={6}
              maxLength={DESCRIPTION_MAX_LENGTH}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Please describe your issue or request..."
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description && (
                <p id="description-error" className="text-sm text-red-600">
                  {errors.description}
                </p>
              )}
              <p className={`text-sm ml-auto ${
                formData.description.length > DESCRIPTION_MAX_LENGTH * 0.9 
                  ? 'text-orange-600' 
                  : formData.description.length > DESCRIPTION_MAX_LENGTH * 0.8 
                  ? 'text-yellow-600' 
                  : 'text-gray-500'
              }`}>
                {formData.description.length}/{DESCRIPTION_MAX_LENGTH}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="screenshots" className="block text-sm font-medium text-gray-700 mb-2">
              Screenshots
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Supported formats: JPG, PNG, GIF, WebP, BMP (max 10MB per file, 50MB total)
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="screenshots"
                name="screenshots"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="screenshots" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-600">Drop files here or browse</span>
                </div>
              </label>
            </div>
            {formData.screenshots.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-gray-600 mb-2">
                  {formData.screenshots.length} file(s) selected
                </p>
                {formData.screenshots.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <span className="text-sm font-medium text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500 block">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          screenshots: prev.screenshots.filter((_, i) => i !== index)
                        }));
                      }}
                      className="text-red-600 hover:text-red-800 p-1 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Turnstile Security Verification */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Verification *
          </label>
          <Turnstile
            key="support-form-turnstile"
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
            className="text-sm text-gray-600 hover:text-gray-800 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Clear form
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </div>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </form>
        </>
      )}


    </div>
  );
}
