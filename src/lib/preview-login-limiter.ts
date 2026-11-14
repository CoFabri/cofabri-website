// Simple brute-force brake: at most MAX_FAILURES wrong passwords per client
// IP per window. Held in memory, so it is per server instance (the site has
// no shared store); it still slows a guessing script down considerably.
const MAX_FAILURES = 10;
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export function isLockedOut(ip: string, now: number): boolean {
  const entry = failures.get(ip);
  if (!entry) return false;
  if (entry.resetAt <= now) {
    failures.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordFailure(ip: string, now: number): void {
  const entry = failures.get(ip);
  if (!entry || entry.resetAt <= now) {
    failures.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
  // Keep the map bounded.
  if (failures.size > 10_000) {
    for (const [key, value] of failures) if (value.resetAt <= now) failures.delete(key);
  }
}

export function resetPreviewLoginLimiter(): void {
  failures.clear();
}

