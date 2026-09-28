// Is cofabri-api answering at all? Used by middleware to decide whether to
// serve the backstop page. Deliberately conservative: only a network error,
// a timeout or a 5xx counts as down, and any other failure (including a bug
// in this module) counts as up, so it can never take down a healthy site.
//
// The root route returns static JSON without touching the database, so this
// detects host/network/process outages, not a database-only failure. To probe
// something deeper, change PROBE_PATH.

export type ApiHealth = 'up' | 'down';

const PROBE_PATH = '/';
const PROBE_TIMEOUT_MS = 3_000;
const UP_TTL_MS = 15_000;
// Short, so the backstop clears quickly once the API recovers.
const DOWN_TTL_MS = 5_000;

let cached: { health: ApiHealth; expiresAt: number } | null = null;
let inFlight: Promise<ApiHealth> | null = null;
// Last state written to the log, so an outage shows up in logs once per change
// instead of once per probe. A first result of 'up' is the normal case: silent.
let lastLogged: ApiHealth | null = null;

function logStateChange(health: ApiHealth): void {
  if (health === lastLogged || (lastLogged === null && health === 'up')) {
    lastLogged = health;
    return;
  }
  lastLogged = health;
  try {
    console.warn('cofabri-api health:', health);
  } catch {
    // Logging must never affect the health result.
  }
}

function isTypeErrorLike(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  // Cross-realm safety: a TypeError from another realm fails instanceof.
  return typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'TypeError';
}

function isAbortLike(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const name = (error as { name?: unknown }).name;
  return name === 'TimeoutError' || name === 'AbortError';
}

async function probe(baseUrl: string): Promise<ApiHealth> {
  // Built outside the try so a bug here propagates to getApiHealth's outer
  // catch, which fails open, instead of being mistaken for an outage.
  const url = `${baseUrl}${PROBE_PATH}`;
  const signal = AbortSignal.timeout(PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal,
    });
    return response.status >= 500 ? 'down' : 'up';
  } catch (error) {
    // Only a fetch network failure (TypeError) or a timeout/abort is an outage.
    if (isTypeErrorLike(error) || isAbortLike(error)) return 'down';
    throw error;
  }
}

export async function getApiHealth(): Promise<ApiHealth> {
  try {
    const rawBaseUrl = process.env.COFABRI_API_BASE_URL;
    if (!rawBaseUrl) return 'up';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');

    const now = Date.now();
    if (cached && now < cached.expiresAt) return cached.health;

    if (!inFlight) {
      inFlight = probe(baseUrl)
        .then((health) => {
          logStateChange(health);
          cached = { health, expiresAt: Date.now() + (health === 'up' ? UP_TTL_MS : DOWN_TTL_MS) };
          return health;
        })
        .finally(() => {
          inFlight = null;
        });
    }
    return await inFlight;
  } catch (error) {
    console.error('api-health check failed internally; treating API as up:', error);
    return 'up';
  }
}
