import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

function form(extra: Record<string, string | Blob> = {}) {
  const fd = new FormData();
  const base: Record<string, string> = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    preferredContactMethod: 'email',
    subject: 'support',
    description: 'The schedule page will not load.',
    turnstileToken: 'development-mode',
    entryPoint: 'help-menu',
    audience: 'staff',
    applications: JSON.stringify(['app-uuid-1']),
    submissionId: 'sub-1',
  };
  for (const [k, v] of Object.entries({ ...base, ...extra })) fd.set(k, v);
  return new Request('http://localhost/api/support', { method: 'POST', body: fd });
}

describe('POST /api/support', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('COFABRI_API_BASE_URL', 'https://core.example.com');
    vi.stubEnv('COFABRI_API_KEY', 'core-key');
    vi.stubEnv('MAVENOS_INTAKE_URL', 'https://os.example.com');
    vi.stubEnv('MAVENOS_SUPPORT_INTAKE_KEY', 'most_abcdefgh_key');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('defaults to cofabri-api and never calls MavenOS', async () => {
    const f = vi.fn().mockResolvedValue(new Response('{"id":"CS-1"}', { status: 200 }));
    vi.stubGlobal('fetch', f);
    const res = await POST(form());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ recordId: 'CS-1' });
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0][0]).toBe('https://core.example.com/web/forms/support');
  });

  it('with SUPPORT_BACKEND=mavenos posts JSON to the intake and never calls cofabri-api', async () => {
    vi.stubEnv('SUPPORT_BACKEND', 'mavenos');
    const f = vi.fn().mockResolvedValue(new Response('{"ok":true,"id":"T9"}', { status: 202 }));
    vi.stubGlobal('fetch', f);
    const shot = new File([new Uint8Array([1, 2, 3])], 's.png', { type: 'image/png' });
    const req = form();
    const fd = await req.formData();
    fd.append('screenshots', shot);
    const res = await POST(new Request('http://localhost/api/support', { method: 'POST', body: fd }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ recordId: 'T9' });
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://os.example.com/api/intake/v1/tickets');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ submission_id: 'sub-1', name: 'Jane Doe', audience: 'staff', entry_point: 'help-menu' });
    expect(body.subject).toBe('Support/Help: The schedule page will not load.');
    expect(body.attachments).toEqual([{ name: 's.png', content_type: 'image/png', data: 'AQID' }]);
  });

  it('succeeds on a duplicate (202 without id) and surfaces a generic error on 401', async () => {
    vi.stubEnv('SUPPORT_BACKEND', 'mavenos');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{"ok":true}', { status: 202 })));
    expect((await POST(form())).status).toBe(200);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{"error":"invalid_key"}', { status: 401 })));
    const res = await POST(form());
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toMatch(/invalid_key|most_/);
  });

  it('rejects non-image screenshots with a friendly 400 before calling MavenOS', async () => {
    vi.stubEnv('SUPPORT_BACKEND', 'mavenos');
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    const fd = await form().formData();
    fd.append('screenshots', new File(['x'], 'a.pdf', { type: 'application/pdf' }));
    const res = await POST(new Request('http://localhost/api/support', { method: 'POST', body: fd }));
    expect(res.status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
});
