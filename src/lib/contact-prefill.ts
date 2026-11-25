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
