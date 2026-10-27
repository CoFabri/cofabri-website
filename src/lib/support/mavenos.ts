// Forwarding of the support form to the MavenOS intake endpoint
// (POST {MAVENOS_INTAKE_URL}/api/intake/v1/tickets). Used only when
// SUPPORT_BACKEND=mavenos; see docs/support-switch-to-mavenos.md.
// Reads MAVENOS_INTAKE_URL and MAVENOS_SUPPORT_INTAKE_KEY at request time, so a
// change to either needs a new deployment (the Ignored Build Step skips a build
// that only touches docs, so edit a source file to force one).

export type SupportBackend = 'mavenos' | 'core';

/** Anything other than exactly "mavenos" keeps the cofabri-api/Core path. */
export function getSupportBackend(value: string | undefined = process.env.SUPPORT_BACKEND): SupportBackend {
  return value?.trim().toLowerCase() === 'mavenos' ? 'mavenos' : 'core';
}

// The form sends the app's cofabri-api UUID. MavenOS wants a short slug. No
// id -> slug data exists on this site (the apps feed carries id and name
// only), so the table starts empty: an unmapped app sends no app_slug and
// the MavenOS ticket source is 'form'. Add entries here, or set the env var
// SUPPORT_APP_SLUGS to a JSON object ({"<app uuid>":"medoura"}) without a
// code change. The env var wins over this table.
export const APP_SLUGS: Record<string, string> = {};

export function resolveAppSlug(appId: string | undefined, envJson: string | undefined = process.env.SUPPORT_APP_SLUGS): string | undefined {
  if (!appId) return undefined;
  let fromEnv: Record<string, unknown> = {};
  if (envJson) {
    try {
      const parsed: unknown = JSON.parse(envJson);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) fromEnv = parsed as Record<string, unknown>;
    } catch {
      // A malformed override is ignored; the built-in table still applies.
    }
  }
  const raw = fromEnv[appId] ?? APP_SLUGS[appId];
  return typeof raw === 'string' && /^[a-z0-9][a-z0-9_-]{0,39}$/.test(raw) ? raw : undefined;
}

export const MAX_ATTACHMENTS = 5;
// The intake JSON body (base64 included) must stay under the host's ~4.5 MB
// request cap; base64 adds a third, so 2.5 MB of raw images is ~3.4 MB.
export const MAX_TOTAL_ATTACHMENT_BYTES = 2.5 * 1024 * 1024;
export const ATTACHMENT_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export const SUBMISSION_ID = /^[A-Za-z0-9-]{1,64}$/;

export interface IntakeAttachment {
  name: string;
  content_type: string;
  data: string;
}

export type AttachmentResult = { ok: true; attachments: IntakeAttachment[] } | { ok: false; error: string };

export async function filesToAttachments(files: File[]): Promise<AttachmentResult> {
  const real = files.filter((f) => f && typeof f.size === 'number' && f.size > 0);
  if (real.length === 0) return { ok: true, attachments: [] };
  if (real.length > MAX_ATTACHMENTS) {
    return { ok: false, error: `Please attach no more than ${MAX_ATTACHMENTS} screenshots.` };
  }
  if (real.some((f) => !ATTACHMENT_TYPES.includes(f.type))) {
    return { ok: false, error: 'Screenshots must be PNG, JPEG, WebP or GIF images.' };
  }
  const total = real.reduce((sum, f) => sum + f.size, 0);
  if (total > MAX_TOTAL_ATTACHMENT_BYTES) {
    return { ok: false, error: 'Your screenshots are too large. Please attach up to 2.5 MB in total, or fewer images.' };
  }
  const attachments: IntakeAttachment[] = [];
  for (const f of real) {
    attachments.push({
      name: f.name || 'screenshot',
      content_type: f.type,
      data: Buffer.from(await f.arrayBuffer()).toString('base64'),
    });
  }
  return { ok: true, attachments };
}

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();

export function buildSubject(categoryLabel: string, description: string): string {
  const snippet = oneLine(description).slice(0, 80).trim();
  return (snippet ? `${categoryLabel}: ${snippet}` : categoryLabel).slice(0, 200);
}

export interface BuildPayloadInput {
  submissionId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  categoryLabel: string;
  subjectType?: string;
  description: string;
  entryPoint: string;
  audience: 'staff' | 'patient';
  tenantName?: string;
  appId?: string;
  appNames?: string[];
  languagePreference?: string;
  preferredContactMethod?: string;
  companyOrganization?: string;
  website?: string;
  attachments?: IntakeAttachment[];
}

/** Fields with no intake counterpart ride along as a short block at the end of the message. */
export function buildDetailsBlock(input: BuildPayloadInput, hasSlug: boolean): string {
  const lines: string[] = [];
  if (input.subjectType) lines.push(`Request type: ${input.subjectType}`);
  if (input.languagePreference) lines.push(`Language: ${oneLine(input.languagePreference)}`);
  if (input.preferredContactMethod) lines.push(`Preferred contact: ${oneLine(input.preferredContactMethod)}`);
  if (input.companyOrganization) lines.push(`Company: ${oneLine(input.companyOrganization)}`);
  // Without a slug the app would otherwise be lost, so name it here.
  if (!hasSlug && input.appNames && input.appNames.length > 0) lines.push(`App: ${oneLine(input.appNames[0])}`);
  return lines.length ? `\n\n---\nDetails\n${lines.join('\n')}` : '';
}

export function buildIntakePayload(input: BuildPayloadInput): Record<string, unknown> {
  const slug = resolveAppSlug(input.appId);
  const payload: Record<string, unknown> = {
    submission_id: input.submissionId,
    email: input.email,
    // Digits are stripped from names server-side; sent as one string.
    name: `${input.firstName} ${input.lastName}`.trim(),
    subject: buildSubject(input.categoryLabel, input.description),
    message: input.description + buildDetailsBlock(input, Boolean(slug)),
    entry_point: input.entryPoint,
    audience: input.audience,
  };
  if (input.phone) payload.phone = input.phone;
  if (input.tenantName) payload.tenant_name = input.tenantName;
  if (slug) payload.app_slug = slug;
  if (input.website) payload.website = input.website;
  // Patient screenshots are ignored by MavenOS and never sent from here.
  if (input.audience !== 'patient' && input.attachments && input.attachments.length > 0) {
    payload.attachments = input.attachments;
  }
  return payload;
}

export type IntakeOutcome =
  | { ok: true; id?: string }
  | { ok: false; status: number; clientStatus: number; clientError: string };

const GENERIC_ERROR = 'Failed to save support ticket. Please try again later.';

/** Sends one ticket. Never throws and never returns upstream details to the caller. */
export async function submitToMavenos(payload: Record<string, unknown>): Promise<IntakeOutcome> {
  const base = process.env.MAVENOS_INTAKE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.MAVENOS_SUPPORT_INTAKE_KEY?.trim();
  if (!base || !key) {
    console.error('MavenOS support intake is not configured');
    return { ok: false, status: 0, clientStatus: 503, clientError: 'Support form service temporarily unavailable' };
  }
  let res: Response;
  try {
    res = await fetch(`${base}/api/intake/v1/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    });
  } catch {
    console.error('MavenOS support intake unreachable');
    return { ok: false, status: 0, clientStatus: 502, clientError: GENERIC_ERROR };
  }
  if (res.status === 202) {
    const body = (await res.json().catch(() => null)) as { id?: unknown } | null;
    return { ok: true, id: typeof body?.id === 'string' ? body.id : undefined };
  }
  // Status only is logged: 401 bad key, 415 content type, 429 rate limited, 5xx outage.
  console.error('MavenOS support intake failed:', res.status);
  if (res.status === 429) {
    return { ok: false, status: 429, clientStatus: 429, clientError: 'Too many requests. Please wait a minute and try again.' };
  }
  return { ok: false, status: res.status, clientStatus: 502, clientError: GENERIC_ERROR };
}
