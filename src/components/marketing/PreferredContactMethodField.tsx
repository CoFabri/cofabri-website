'use client';

import { Mail, Phone, CircleCheck, type LucideIcon } from 'lucide-react';
import { CONTACT_METHOD_OPTIONS } from '@/lib/validation/schemas';

const CONTACT_METHOD_ICONS: Record<string, LucideIcon> = {
  email: Mail,
  phone: Phone,
  any: CircleCheck,
};

interface PreferredContactMethodFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function PreferredContactMethodField({ value, onChange, error }: PreferredContactMethodFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">
        Preferred Contact Method *
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CONTACT_METHOD_OPTIONS.map((option) => {
          const Icon = CONTACT_METHOD_ICONS[option.value];
          return (
            <label
              key={option.value}
              className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                value === option.value
                  ? 'border-primary bg-accent'
                  : 'border-border bg-card hover:border-ink-faint hover:bg-muted'
              }`}
            >
              <input
                type="radio"
                name="preferredContactMethod"
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
              />
              <div className="flex items-center space-x-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    value === option.value ? 'border-primary bg-primary' : 'border-border bg-card'
                  }`}
                >
                  {value === option.value && <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>}
                </div>
                <div className="flex items-center space-x-2">
                  <Icon className="w-5 h-5 text-ink-faint" />
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                </div>
              </div>
            </label>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={() => onChange('')}
        className="mt-3 text-sm text-muted-foreground hover:text-foreground inline-flex items-center transition-colors"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Clear Selection
      </button>
    </div>
  );
}
