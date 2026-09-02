'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY, formatPhoneAsYouType, type CountryCode } from '@/lib/validation/phone';

interface PhoneFieldProps {
  id: string;
  value: string;
  country: CountryCode;
  onValueChange: (value: string) => void;
  onCountryChange: (country: CountryCode) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function PhoneField({
  id,
  value,
  country,
  onValueChange,
  onCountryChange,
  error,
  required = false,
  disabled = false,
  placeholder = '(555) 555-5555',
}: PhoneFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  const selected = useMemo(
    () => COUNTRY_OPTIONS.find((option) => option.code === country) ?? COUNTRY_OPTIONS.find((option) => option.code === DEFAULT_COUNTRY)!,
    [country]
  );

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter(
      (option) =>
        option.name.toLowerCase().includes(query) ||
        option.callingCode.includes(query) ||
        option.code.toLowerCase().includes(query)
    );
  }, [search]);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(formatPhoneAsYouType(e.target.value, value, country));
  };

  const handleCountrySelect = (code: CountryCode) => {
    onCountryChange(code);
    onValueChange(formatPhoneAsYouType(value, '', code));
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            disabled={disabled}
            aria-label="Select country calling code"
            aria-expanded={isOpen}
            className={`flex h-full items-center gap-1.5 rounded-lg border px-3 py-3 bg-background transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-ink-faint'
            } ${error ? 'border-danger' : 'border-border-strong'}`}
          >
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="text-sm text-muted-foreground">+{selected.callingCode}</span>
            <ChevronDown className={`w-4 h-4 text-ink-faint transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute z-20 mt-1 w-72 rounded-lg border border-border bg-popover shadow-lg">
              <div className="border-b border-border p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search country or code"
                    className="w-full rounded-md border border-border-strong bg-background py-2 pl-8 pr-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-auto">
                {filteredOptions.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">No matches</p>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => handleCountrySelect(option.code)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <span className="text-base leading-none">{option.flag}</span>
                      <span className="flex-1 truncate text-foreground">{option.name}</span>
                      <span className="text-muted-foreground">+{option.callingCode}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <input
          type="tel"
          id={id}
          name={id}
          value={value}
          onChange={handleNumberChange}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full flex-1 rounded-lg border px-4 py-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 hover:border-ink-faint ${
            error ? 'border-danger' : 'border-border-strong'
          }`}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
