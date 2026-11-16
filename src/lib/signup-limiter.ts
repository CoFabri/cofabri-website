// Per-IP brake on waitlist signups (/api/signup). Held in memory, so it is
// per server instance (the site has no shared store, same as the preview
// login and CSP report limiters); the Vercel Firewall "Rate limit form posts"
// rule is the cross-instance backstop. A real visitor signs up for one or two
// betas, so 5 per 10 minutes per IP leaves room for typos and retries.
//
// The route only calls this after a submission has passed validation and
// Turnstile, so junk requests never take a slot.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_IP = 5;
const MAX_TRACKED_IPS = 5_000;
const windows = new Map<string, { count: number; resetAt: number }>();

// IPv6 clients usually control a whole /64, so key them on that prefix;
// otherwise one host could rotate through addresses for a fresh budget each
// time. IPv4 (and anything unparseable) is keyed as-is.
export function limiterKey(ip: string): string {
  const addr = ip.trim().toLowerCase().replace(/^\[|\]$/g, '').split('%')[0];
  if (!addr.includes(':') || /^::ffff:\d+\.\d+\.\d+\.\d+$/.test(addr)) return addr;
  const [head, tail] = addr.split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail !== undefined && tail !== '' ? tail.split(':') : [];
  const groups =
    tail === undefined
      ? headParts
      : [...headParts, ...Array(Math.max(0, 8 - headParts.length - tailParts.length)).fill('0'), ...tailParts];
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return addr;
  return `${groups.slice(0, 4).map((g) => parseInt(g, 16).toString(16)).join(':')}::/64`;
}

// Never fails closed on capacity: when the map is full, expired entries go
// first, then the oldest-inserted live ones, so an attacker rotating
// addresses cannot lock real visitors out. Synchronous, so a parallel burst
// cannot all pass the check. Returns false when this IP is over budget.
export function tryConsumeSignup(ip: string, now: number): boolean {
  const key = limiterKey(ip);
  const entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    if (entry) windows.delete(key);
    if (windows.size >= MAX_TRACKED_IPS) {
      for (const [k, value] of windows) if (value.resetAt <= now) windows.delete(k);
      for (const k of windows.keys()) {
        if (windows.size < MAX_TRACKED_IPS) break;
        windows.delete(k);
      }
    }
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_PER_IP) return false;
  entry.count += 1;
  return true;
}

export const SIGNUP_LIMITER_CAPACITY = MAX_TRACKED_IPS;

/** Test hook. */
export function resetSignupLimiter(): void {
  windows.clear();
}
