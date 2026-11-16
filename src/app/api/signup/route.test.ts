import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const verifyTurnstile = vi.fn(async (token: string) => token === 'good-token')
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: (token: string) => verifyTurnstile(token) }))

const ORIGINAL_ENV = { ...process.env }

function tlsReset() {
  return Object.assign(new TypeError('fetch failed'), {
    cause: Object.assign(new Error('Client network socket disconnected before secure TLS connection was established'), { code: 'ECONNRESET' }),
  })
}

describe('POST /api/signup', () => {
  beforeEach(() => {
    process.env.COFABRI_API_BASE_URL = 'https://api.test.cofabri.com'
    process.env.COFABRI_API_KEY = 'test-key'
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  // Each call gets its own client IP unless one is given, so the per-IP
  // limiter only comes into play in the tests that are about it.
  let ipCounter = 0
  function request(overrides: Record<string, unknown> = {}, ip = `203.0.113.${++ipCounter}`) {
    return new Request('http://localhost/api/signup', {
      method: 'POST',
      headers: { 'x-real-ip': ip },
      body: JSON.stringify({
        firstName: 'A', lastName: 'B', email: 'a@b.com', appId: 'medoura', interestLevel: 3, quote: 10,
        turnstileToken: 'good-token', ...overrides,
      }),
    })
  }

  it('rejects a submission without a valid Turnstile token before calling cofabri-api', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const { POST } = await import('./route')
    for (const token of [undefined, 'development-mode', 'bad']) {
      const res = await POST(request({ turnstileToken: token }))
      expect(res.status).toBe(400)
    }
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects invalid or oversized fields', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const { POST } = await import('./route')
    for (const bad of [
      { email: 'not-an-email' },
      { firstName: 'x'.repeat(51) },
      { statement: 'x'.repeat(1001) },
      { interestLevel: 9 },
      { quote: -1 },
      { appId: '<script>' },
    ]) {
      const res = await POST(request(bad))
      expect(res.status).toBe(400)
    }
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns only success, not the upstream record', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1, email: 'a@b.com' }), { status: 200 })))
    const { POST } = await import('./route')
    const res = await POST(request())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it('does not echo internal error messages', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('secret internal detail')))
    const { POST } = await import('./route')
    const res = await POST(request())
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('secret internal detail')
  })

  it('retries once when the connection dies before TLS completes', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn()
      .mockRejectedValueOnce(tlsReset())
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 200 })))
    const { POST } = await import('./route')
    const res = await POST(request())
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('returns 502 with a warning, not an error, when the retry also cannot connect', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(tlsReset()))
    const { POST } = await import('./route')
    const res = await POST(request())
    expect(res.status).toBe(502)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(warn).toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  it('does not retry an error that may have reached the server', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    const { POST } = await import('./route')
    const res = await POST(request())
    expect(res.status).toBe(500)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('rate-limits a single IP before calling cofabri-api', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
    const { POST } = await import('./route')
    const statuses: number[] = []
    for (let i = 0; i < 7; i++) statuses.push((await POST(request({}, '198.51.100.7'))).status)
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429, 429])
    expect(fetch).toHaveBeenCalledTimes(5)
    // Another visitor is unaffected.
    expect((await POST(request({}, '198.51.100.8'))).status).toBe(200)
  })

  it('does not let invalid or unverified submissions consume slots', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
    const { POST } = await import('./route')
    for (let i = 0; i < 10; i++) expect((await POST(request({ email: 'bad' }, '198.51.100.9'))).status).toBe(400)
    for (let i = 0; i < 10; i++) expect((await POST(request({ turnstileToken: 'bad' }, '198.51.100.9'))).status).toBe(400)
    expect((await POST(request({}, '198.51.100.9'))).status).toBe(200)
  })

  it('treats two IPv6 addresses in the same /64 as one client', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
    const { POST } = await import('./route')
    const statuses: number[] = []
    for (let i = 1; i <= 6; i++) statuses.push((await POST(request({}, `2001:db8:1:2::${i}`))).status)
    expect(statuses.at(-1)).toBe(429)
    expect((await POST(request({}, '2001:db8:1:3::1'))).status).toBe(200)
  })

  it('ignores a spoofed x-forwarded-for when limiting', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
    const { POST } = await import('./route')
    const spoofed = (n: number) =>
      new Request('http://localhost/api/signup', {
        method: 'POST',
        headers: { 'x-real-ip': '198.51.100.10', 'x-forwarded-for': `10.0.0.${n}` },
        body: JSON.stringify({ firstName: 'A', lastName: 'B', email: 'a@b.com', turnstileToken: 'good-token' }),
      })
    const statuses: number[] = []
    for (let i = 0; i < 6; i++) statuses.push((await POST(spoofed(i))).status)
    expect(statuses.at(-1)).toBe(429)
  })
})
