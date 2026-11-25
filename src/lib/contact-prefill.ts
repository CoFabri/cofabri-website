import { FIELD_LIMITS, INQUIRY_TYPES } from './validation/schemas';

// Prefill for /contact from a link: /contact?topic=sales&subject=...&message=...
// Everything comes from a URL anyone can write, so it is cleaned before it goes
// into the form: control characters are stripped, the subject is one line, and
// both are cut to the same limits the form and API enforce. A visitor still has
// to read it and press send; nothing is submitted from a link.

export type InquiryTopic = (typeof INQUIRY_TYPES)[number]['value'];

export interface ContactLinkPrefill {
  topic?: InquiryTopic;
  subject?: string;
  message?: string;
}

// Keeps tab and newline (messages are multi-line); drops the other control characters.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function clean(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\r\n?/g, '\n').replace(CONTROL_CHARS, '').trim();
}

export function parseContactPrefill(get: (name: string) => string | null | undefined): ContactLinkPrefill {
  const out: ContactLinkPrefill = {};

  const topic = clean(get('topic'));
  if (INQUIRY_TYPES.some((t) => t.value === topic)) out.topic = topic as InquiryTopic;

  // One line: newlines in a subject become spaces.
  const subject = clean(get('subject')).replace(/\s*\n\s*/g, ' ').slice(0, FIELD_LIMITS.subject).trim();
  if (subject) out.subject = subject;

  const message = clean(get('message')).slice(0, FIELD_LIMITS.message).trim();
  if (message) out.message = message;

  return out;
}

// ---- The contact form's "related app or service" list ----

export interface RelatedChoice {
  id: string;
  name: string;
  faviconUrl?: string;
}

export interface RelatedOption {
  value: string;
  label: string;
  image?: string;
}

/** Apps first, then services marked "(service)". A service never shadows an app with the same id. */
export function buildRelatedOptions(apps: RelatedChoice[], services: RelatedChoice[]): RelatedOption[] {
  const appIds = new Set(apps.map((a) => a.id));
  return [
    ...apps.map((a) => ({ value: a.id, label: a.name, image: a.faviconUrl })),
    ...services.filter((s) => !appIds.has(s.id)).map((s) => ({ value: s.id, label: `${s.name} (service)`, image: s.faviconUrl })),
  ];
}

/** Finds the app or service a link names, by id or by name, ignoring case. A service ID wins over nothing, an app over a service. */
export function findRelated(apps: RelatedChoice[], services: RelatedChoice[], wanted: string | null | undefined): RelatedChoice | undefined {
  const w = clean(wanted).toLowerCase();
  if (!w) return undefined;
  const match = (x: RelatedChoice) => x.id.toLowerCase() === w || x.name.toLowerCase() === w;
  return apps.find(match) ?? services.find(match);
}
