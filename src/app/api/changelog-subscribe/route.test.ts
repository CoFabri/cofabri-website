import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

describe('POST /api/changelog-subscribe', () => {
  beforeEach(() => {
    process.env.COFABRI_API_BASE_URL = 'https://api.test.cofabri.com'
    process.env.COFABRI_API_KEY = 'test-key'
    process.env.TURNSTILE_SECRET_KEY = 'test-secret'
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.resetModules()
  })

  function request(body: Record<string, unknown>) {
    // Mock NextRequest for testing
    return {
      json: async () => body,
      headers: new Map<string, string>([
        ['x-forwarded-for', '127.0.0.1'],
      ]),
    } as any
  }

  it('verifies Turnstile, then forwards to cofabri-api and returns success', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 })) // turnstile
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 })) // cofabri-api

    const { POST } = await import('./route')
    const res = await POST(request({ appId: 'medoura', email: 'a@b.com', turnstileToken: 'dev-token' }))

    expect(res.status).toBe(200)
    const [, forwardInit] = (global.fetch as any).mock.calls[1]
    expect((global.fetch as any).mock.calls[1][0]).toBe('https://api.test.cofabri.com/web/forms/changelog-subscribe')
    expect(forwardInit.headers.Authorization).toBe('Bearer test-key')
    expect(JSON.parse(forwardInit.body)).toEqual({ app_id: 'medoura', email: 'a@b.com' })
  })

  it('rejects a failed Turnstile verification with 400', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false }), { status: 200 }))

    const { POST } = await import('./route')
    const res = await POST(request({ appId: 'medoura', email: 'a@b.com', turnstileToken: 'bad-token' }))
    expect(res.status).toBe(400)
  })

  it('rejects an invalid email with 400 before ever calling fetch', async () => {
    global.fetch = vi.fn()

    const { POST } = await import('./route')
    const res = await POST(request({ appId: 'medoura', email: 'not-an-email', turnstileToken: 'dev-token' }))
    expect(res.status).toBe(400)
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
