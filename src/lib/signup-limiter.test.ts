import { beforeEach, describe, expect, it } from 'vitest'
import { limiterKey, resetSignupLimiter, SIGNUP_LIMITER_CAPACITY, tryConsumeSignup } from './signup-limiter'

describe('signup limiter', () => {
  beforeEach(() => resetSignupLimiter())

  it('keys IPv6 on the /64 prefix and IPv4 as-is', () => {
    expect(limiterKey('2001:db8:1:2::1')).toBe(limiterKey('2001:0db8:0001:0002:ffff:ffff:ffff:ffff'))
    expect(limiterKey('2001:db8:1:2::1')).not.toBe(limiterKey('2001:db8:1:3::1'))
    expect(limiterKey('[2001:db8::1]')).toBe('2001:db8:0:0::/64')
    expect(limiterKey('203.0.113.5')).toBe('203.0.113.5')
    expect(limiterKey('unknown')).toBe('unknown')
  })

  it('still admits a new IP when the map is full of live entries, evicting the oldest', () => {
    const now = 1_000_000
    for (let i = 0; i < SIGNUP_LIMITER_CAPACITY; i++) expect(tryConsumeSignup(`10.${i >> 16}.${(i >> 8) & 255}.${i & 255}`, now)).toBe(true)
    // Exhaust the most recent entry's budget so we can tell it survived.
    const last = SIGNUP_LIMITER_CAPACITY - 1
    const lastIp = `10.${last >> 16}.${(last >> 8) & 255}.${last & 255}`
    for (let i = 0; i < 4; i++) tryConsumeSignup(lastIp, now)
    expect(tryConsumeSignup(lastIp, now)).toBe(false)

    expect(tryConsumeSignup('192.0.2.1', now)).toBe(true)
    // The oldest entry (10.0.0.0) was evicted, so it starts a fresh window.
    for (let i = 0; i < 5; i++) expect(tryConsumeSignup('10.0.0.0', now)).toBe(true)
    // The newest entry is still tracked and still over budget.
    expect(tryConsumeSignup(lastIp, now)).toBe(false)
  })

  it('resets an IP after its window expires', () => {
    for (let i = 0; i < 5; i++) tryConsumeSignup('203.0.113.9', 0)
    expect(tryConsumeSignup('203.0.113.9', 1)).toBe(false)
    expect(tryConsumeSignup('203.0.113.9', 10 * 60 * 1000 + 1)).toBe(true)
  })
})
