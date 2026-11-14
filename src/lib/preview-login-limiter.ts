// Simple brute-force brake: at most MAX_FAILURES wrong passwords per client
// IP per window. Held in memory, so it is per server instance (the site has
// no shared store); it still slows a guessing script down considerably.
const MAX_FAILURES = 10;
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

// Reserve an attempt synchronously, before the handler awaits anything, so
// a parallel burst cannot all pass the check. Returns false when locked out.
// The caller refunds the attempt when the password turns out to be right.
export function tryConsumeAttempt(ip: string, now: number): boolean {
  let entry = failures.get(ip);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    failures.set(ip, entry);
  }
  if (entry.count >= MAX_FAILURES) return false;
  entry.count += 1;
  // Keep the map bounded.
  if (failures.size > 10_000) {
    for (const [key, value] of failures) if (value.resetAt <= now) failures.delete(key);
  }
  return true;
}

export function refundAttempt(ip: string): void {
  const entry = failures.get(ip);
  if (!entry) return;
  entry.count -= 1;
  if (entry.count <= 0) failures.delete(ip);
}

export function resetPreviewLoginLimiter(): void {
  failures.clear();
}

