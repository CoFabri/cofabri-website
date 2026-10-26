import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildIntakePayload,
  buildSubject,
  filesToAttachments,
  getSupportBackend,
  resolveAppSlug,
  submitToMavenos,
  type BuildPayloadInput,
} from './mavenos';

const base: BuildPayloadInput = {
  submissionId: 'abc-123',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  categoryLabel: 'Support/Help',
  description: 'The  schedule page\nwon\'t load for me at all, it spins forever and never shows anything useful.',
  entryPoint: 'help-menu',
  audience: 'staff',
};

describe('getSupportBackend', () => {
  it('defaults to core', () => {
    expect(getSupportBackend(undefined)).toBe('core');
    expect(getSupportBackend('')).toBe('core');
    expect(getSupportBackend('bogus')).toBe('core');
  });
  it('only mavenos switches', () => {
    expect(getSupportBackend('mavenos')).toBe('mavenos');
    expect(getSupportBackend(' MavenOS ')).toBe('mavenos');
  });
});

describe('buildSubject', () => {
  it('prefixes the category and cuts the message to 80 chars on one line', () => {
    const s = buildSubject('Support/Help', base.description);
    expect(s.startsWith("Support/Help: The schedule page won't load")).toBe(true);
    expect(s.length).toBeLessThanOrEqual('Support/Help: '.length + 80);
    expect(s).not.toContain('\n');
  });
});

describe('resolveAppSlug', () => {
  it('returns nothing when unmapped', () => {
    expect(resolveAppSlug('some-uuid', undefined)).toBeUndefined();
    expect(resolveAppSlug(undefined, '{"a":"b"}')).toBeUndefined();
  });
  it('uses the env override and rejects bad slugs or bad JSON', () => {
    expect(resolveAppSlug('u1', '{"u1":"medoura"}')).toBe('medoura');
    expect(resolveAppSlug('u1', '{"u1":"Bad Slug!"}')).toBeUndefined();
    expect(resolveAppSlug('u1', 'not json')).toBeUndefined();
  });
});

describe('buildIntakePayload', () => {
  it('maps the form fields', () => {
    const p = buildIntakePayload({ ...base, phone: '+15551234567', tenantName: 'Acme', subjectType: 'support_help' });
    expect(p).toMatchObject({
      submission_id: 'abc-123',
      email: 'jane@example.com',
      name: 'Jane Doe',
      entry_point: 'help-menu',
      audience: 'staff',
      phone: '+15551234567',
      tenant_name: 'Acme',
    });
    expect(p.app_slug).toBeUndefined();
    expect(p.message as string).toContain(base.description);
    expect(p.message as string).toContain('Request type: support_help');
  });
  it('appends Details only for fields without a payload counterpart, naming the app when unmapped', () => {
    const p = buildIntakePayload({
      ...base,
      languagePreference: 'Spanish',
      preferredContactMethod: 'phone',
      companyOrganization: 'Acme Clinic',
      appNames: ['Medoura'],
    });
    const m = p.message as string;
    expect(m.endsWith('App: Medoura')).toBe(true);
    expect(m).toContain('Language: Spanish');
    expect(m).toContain('Preferred contact: phone');
    expect(m).toContain('Company: Acme Clinic');
  });
  it('has no Details block when nothing extra is given', () => {
    expect(buildIntakePayload(base).message).toBe(base.description);
  });
  it('drops attachments for patients and keeps them for staff', () => {
    const attachments = [{ name: 'a.png', content_type: 'image/png', data: 'AAAA' }];
    expect(buildIntakePayload({ ...base, attachments }).attachments).toEqual(attachments);
    expect(buildIntakePayload({ ...base, audience: 'patient', attachments }).attachments).toBeUndefined();
  });
  it('passes the honeypot only when filled', () => {
    expect(buildIntakePayload(base).website).toBeUndefined();
    expect(buildIntakePayload({ ...base, website: 'x' }).website).toBe('x');
  });
});

const img = (name: string, type: string, size: number) => new File([new Uint8Array(size)], name, { type });

describe('filesToAttachments', () => {
  it('base64-encodes images', async () => {
    const r = await filesToAttachments([img('a.png', 'image/png', 3)]);
    expect(r).toEqual({ ok: true, attachments: [{ name: 'a.png', content_type: 'image/png', data: 'AAAA' }] });
  });
  it('rejects more than five, non-images and oversize totals', async () => {
    const six = Array.from({ length: 6 }, (_, i) => img(`${i}.png`, 'image/png', 1));
    expect((await filesToAttachments(six)).ok).toBe(false);
    expect((await filesToAttachments([img('a.pdf', 'application/pdf', 1)])).ok).toBe(false);
    expect((await filesToAttachments([img('a.png', 'image/png', 2 * 1024 * 1024), img('b.png', 'image/png', 1024 * 1024)])).ok).toBe(false);
  });
});

describe('submitToMavenos', () => {
  beforeEach(() => {
    vi.stubEnv('MAVENOS_INTAKE_URL', 'https://os.example.com/');
    vi.stubEnv('MAVENOS_SUPPORT_INTAKE_KEY', 'most_abcdefgh_key');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('posts JSON with the bearer key and returns the id', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{"ok":true,"id":"T1"}', { status: 202 }));
    vi.stubGlobal('fetch', f);
    const r = await submitToMavenos({ a: 1 });
    expect(r).toEqual({ ok: true, id: 'T1' });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://os.example.com/api/intake/v1/tickets');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json', Authorization: 'Bearer most_abcdefgh_key' });
  });
  it('tolerates a missing id on duplicates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 202 })));
    expect(await submitToMavenos({})).toEqual({ ok: true, id: undefined });
  });
  it.each([401, 415, 500, 503])('maps %i to a generic 502', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":"secret detail"}', { status })));
    const r = await submitToMavenos({});
    expect(r).toMatchObject({ ok: false, clientStatus: 502, clientError: 'Failed to save support ticket. Please try again later.' });
  });
  it('maps 429 to a friendly 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 429 })));
    expect(await submitToMavenos({})).toMatchObject({ ok: false, clientStatus: 429 });
  });
  it('maps a network failure to 502 and missing config to 503', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    expect(await submitToMavenos({})).toMatchObject({ clientStatus: 502 });
    vi.stubEnv('MAVENOS_INTAKE_URL', '');
    expect(await submitToMavenos({})).toMatchObject({ clientStatus: 503 });
  });
});
