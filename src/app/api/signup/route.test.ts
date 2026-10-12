import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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

  function request() {
    return new Request('http://localhost/api/signup', {
      method: 'POST',
      body: JSON.stringify({ firstName: 'A', lastName: 'B', email: 'a@b.com', appId: 'medoura', interestLevel: 3 }),
    })
  }

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
})
