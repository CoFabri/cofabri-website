// Is cofabri-api answering at all? Used by middleware to decide whether to
// serve the backstop page. Deliberately conservative: only a network error,
// a timeout or a 5xx counts as down, and any unexpected failure inside this
// module counts as up, so a bug here can never take down a healthy site.
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

async function probe(baseUrl: string): Promise<ApiHealth> {
  try {
    const response = await fetch(`${baseUrl}${PROBE_PATH}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return response.status >= 500 ? 'down' : 'up';
  } catch {
    return 'down';
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
