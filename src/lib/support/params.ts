import { FIELD_LIMITS } from '@/lib/validation/schemas';

export const ENTRY_POINTS = [
  'website',
  'help-menu',
  'error-page',
  'settings',
  'patient-account',
  'help-center',
  'landing',
  'chat',
  'other',
] as const;
export type EntryPoint = (typeof ENTRY_POINTS)[number];
export type Audience = 'staff' | 'patient';

export interface SupportParams {
  appNames: string[];
  subject: 'support' | 'feature';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  language: 'English' | 'Spanish';
  from: EntryPoint;
  tenant: string;
  audience: Audience;
}

type ParamReader = { get(name: string): string | null };

const TENANT_MAX = 100;
const PHONE_MAX = 30;

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(CONTROL_CHARS, ' ').trim().slice(0, max);
}

export function sanitizeEntryPoint(value: unknown): EntryPoint {
  if (typeof value !== 'string' || value.trim() === '') return 'website';
  return (ENTRY_POINTS as readonly string[]).includes(value) ? (value as EntryPoint) : 'other';
}

export function sanitizeAudience(value: unknown): Audience {
  return value === 'patient' ? 'patient' : 'staff';
}

export function sanitizeTenant(value: unknown): string {
  return clean(value, TENANT_MAX);
}

export function parseSupportParams(params: ParamReader | null | undefined): SupportParams {
  const get = (name: string) => params?.get(name) ?? '';
  const audience = sanitizeAudience(get('audience'));
  const isPatient = audience === 'patient';

  const appNames = get('app')
    .split(',')
    .map((name) => clean(name, 100))
    .filter(Boolean);

  return {
    appNames,
    subject: get('subject') === 'feature' ? 'feature' : 'support',
    // Patients never get prefilled identity: the form asks for it fresh.
    firstName: isPatient ? '' : clean(get('firstName'), FIELD_LIMITS.firstName),
    lastName: isPatient ? '' : clean(get('lastName'), FIELD_LIMITS.lastName),
    email: isPatient ? '' : clean(get('email'), FIELD_LIMITS.email),
    phone: isPatient ? '' : clean(get('phone'), PHONE_MAX),
    language: get('language') === 'Spanish' ? 'Spanish' : 'English',
    from: sanitizeEntryPoint(get('from')),
    tenant: sanitizeTenant(get('tenant')),
    audience,
  };
}
