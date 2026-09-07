import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

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
    vi.unstubAllGlobals()
  })

  function request(body: Record<string, unknown>) {
    return new NextRequest('http://localhost/api/changelog-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
      body: JSON.stringify(body),
    })
  }

  it('verifies Turnstile, then forwards to cofabri-api and returns success', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 })) // turnstile
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }))) // cofabri-api

    const { POST } = await import('./route')
    const res = await POST(request({ appIds: ['medoura'], email: 'a@b.com', notifyUpdates: true, notifyIncidents: false, turnstileToken: 'dev-token' }))

    expect(res.status).toBe(200)
    const [, forwardInit] = vi.mocked(fetch).mock.calls[1] as [string, { headers: Record<string, string>; body: string }]
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe('https://api.test.cofabri.com/web/forms/changelog-subscribe')
    expect(forwardInit.headers.Authorization).toBe('Bearer test-key')
    expect(JSON.parse(forwardInit.body)).toEqual({ app_ids: ['medoura'], email: 'a@b.com', notify_updates: true, notify_incidents: false })
  })

  it('rejects a failed Turnstile verification with 400', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false }), { status: 200 })))

    const { POST } = await import('./route')
    const res = await POST(request({ appIds: ['medoura'], email: 'a@b.com', notifyUpdates: true, notifyIncidents: false, turnstileToken: 'bad-token' }))
    expect(res.status).toBe(400)
  })

  it('rejects an invalid email with 400 and a specific message, before ever calling fetch', async () => {
    vi.stubGlobal('fetch', vi.fn())

    const { POST } = await import('./route')
    const res = await POST(request({ appIds: ['medoura'], email: 'not-an-email', notifyUpdates: true, notifyIncidents: false, turnstileToken: 'dev-token' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).not.toBe('Invalid request')
    expect(body.error.length).toBeGreaterThan(0)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects an empty appIds array with a specific message', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const { POST } = await import('./route')
    const res = await POST(request({ appIds: [], email: 'a@b.com', notifyUpdates: true, notifyIncidents: false, turnstileToken: 'dev-token' }))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects when neither notifyUpdates nor notifyIncidents is true', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const { POST } = await import('./route')
    const res = await POST(request({ appIds: ['medoura'], email: 'a@b.com', notifyUpdates: false, notifyIncidents: false, turnstileToken: 'dev-token' }))
    expect(res.status).toBe(400)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('forwards multiple app ids in one request', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 })))
    const { POST } = await import('./route')
    const res = await POST(request({ appIds: ['medoura', 'rx-bridge'], email: 'a@b.com', notifyUpdates: true, notifyIncidents: true, turnstileToken: 'dev-token' }))
    expect(res.status).toBe(200)
    const [, forwardInit] = vi.mocked(fetch).mock.calls[1] as [string, { body: string }]
    expect(JSON.parse(forwardInit.body)).toEqual({ app_ids: ['medoura', 'rx-bridge'], email: 'a@b.com', notify_updates: true, notify_incidents: true })
  })

  it('does NOT bypass Turnstile verification for the "development-mode" token when NODE_ENV is not development', async () => {
    // Regression test for a critical bypass: the literal string 'development-mode' must
    // only skip verification when the server is actually running in development. Outside
    // of that, it must be treated like any other (invalid) token and rejected.
    expect(process.env.NODE_ENV).not.toBe('development')
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false }), { status: 200 }))) // turnstile

    const { POST } = await import('./route')
    const res = await POST(request({ appIds: ['medoura'], email: 'attacker@example.com', notifyUpdates: true, notifyIncidents: false, turnstileToken: 'development-mode' }))

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    expect(res.status).toBe(400)
  })

  it('returns 503 without attempting verification when TURNSTILE_SECRET_KEY is unset outside development', async () => {
    delete process.env.TURNSTILE_SECRET_KEY
    vi.stubGlobal('fetch', vi.fn())

    const { POST } = await import('./route')
    const res = await POST(request({ appIds: ['medoura'], email: 'a@b.com', notifyUpdates: true, notifyIncidents: false, turnstileToken: 'some-token' }))

    expect(res.status).toBe(503)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('passes through a 429 from cofabri-api distinctly, instead of flattening it to 502', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 })) // turnstile
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false }), { status: 429 }))) // cofabri-api rate limited

    const { POST } = await import('./route')
    const res = await POST(request({ appIds: ['medoura'], email: 'a@b.com', notifyUpdates: true, notifyIncidents: false, turnstileToken: 'dev-token' }))
    const body = await res.json()

    expect(res.status).toBe(429)
    expect(body.error).toMatch(/too many|try again/i)
  })

  it('still returns 502 for a non-429 non-ok response from cofabri-api', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 })) // turnstile
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: false }), { status: 500 })))

    const { POST } = await import('./route')
    const res = await POST(request({ appIds: ['medoura'], email: 'a@b.com', notifyUpdates: true, notifyIncidents: false, turnstileToken: 'dev-token' }))
    expect(res.status).toBe(502)
  })
})
