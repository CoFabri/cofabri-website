import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const KEY_FILE = /^[0-9a-f]{32}\.txt$/;
const BATCH_SIZE = 10_000;
const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';

function decodeXml(text) {
  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

/** HTTPS URLs on `host` from a sitemap urlset. Sitemap documents themselves are left out. */
export function urlsFromSitemap(xml, host) {
  const seen = new Set();
  const urls = [];
  for (const match of xml.matchAll(/<loc>([^<]*)<\/loc>/gi)) {
    const loc = decodeXml(match[1].trim());
    let parsed;
    try {
      parsed = new URL(loc);
    } catch {
      continue;
    }
    if (parsed.protocol !== 'https:') continue;
    if (parsed.hostname !== host) continue;
    if (parsed.username || parsed.password) continue;
    if (parsed.pathname === '/sitemap.xml' || parsed.pathname.endsWith('/sitemap.xml')) continue;
    if (seen.has(loc)) continue;
    seen.add(loc);
    urls.push(loc);
  }
  return urls;
}

/** The single `public/<32 lowercase hex>.txt` file. Body must be exactly the key. */
export function readIndexNowKey(dir) {
  const names = readdirSync(dir)
    .filter((name) => KEY_FILE.test(name))
    .sort();
  if (names.length !== 1) {
    throw new Error(`expected one IndexNow key file in ${dir}, found ${names.length}`);
  }
  const name = names[0];
  const key = name.slice(0, -'.txt'.length);
  const body = readFileSync(join(dir, name));
  if (!body.equals(Buffer.from(key, 'utf8'))) {
    throw new Error(`IndexNow key file ${name} body is not exactly the key`);
  }
  return key;
}

export function isAcceptedStatus(status) {
  return status === 200 || status === 202;
}

export async function postUrlBatch({ endpoint, host, key, urlList, fetchImpl = globalThis.fetch }) {
  const keyLocation = `https://${host}/${key}.txt`;
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'user-agent': 'CofabriIndexNow/1.0',
    },
    body: JSON.stringify({ host, key, keyLocation, urlList }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await response.text();
  return { status: response.status, body, keyLocation };
}

export async function pingIndexNow({ host, key, urlList, endpoint = DEFAULT_ENDPOINT, fetchImpl = globalThis.fetch }) {
  const results = [];
  for (let offset = 0; offset < urlList.length; offset += BATCH_SIZE) {
    const batch = urlList.slice(offset, offset + BATCH_SIZE);
    try {
      const result = await postUrlBatch({ endpoint, host, key, urlList: batch, fetchImpl });
      const outcome = isAcceptedStatus(result.status) ? 'success' : 'not accepted';
      const detail = result.body ? ` body=${result.body.slice(0, 300)}` : '';
      console.log(
        `IndexNow: ${outcome} status=${result.status} host=${host} urls=${batch.length} keyLocation=${result.keyLocation}${detail}`,
      );
      results.push(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`IndexNow: ping error: ${message}`);
    }
  }
  return results;
}

async function main() {
  const host = process.env.INDEXNOW_HOST || 'cofabri.com';
  const keyDir = process.env.INDEXNOW_KEY_DIR || 'public';
  const sitemapUrl = process.env.INDEXNOW_SITEMAP_URL || `https://${host}/sitemap.xml`;
  const endpoint = process.env.INDEXNOW_ENDPOINT || DEFAULT_ENDPOINT;

  let key;
  try {
    key = readIndexNowKey(keyDir);
  } catch (error) {
    console.log(`IndexNow: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  let xml;
  try {
    const response = await fetch(sitemapUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(30_000),
      headers: { accept: 'application/xml, text/xml, */*' },
    });
    if (!response.ok) {
      console.log(`IndexNow: sitemap fetch status=${response.status} url=${sitemapUrl}`);
      return;
    }
    xml = await response.text();
  } catch (error) {
    console.log(`IndexNow: sitemap fetch error: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  const urlList = urlsFromSitemap(xml, host);
  if (urlList.length === 0) {
    console.log(`IndexNow: no URLs for host ${host} in ${sitemapUrl}`);
    return;
  }

  console.log(`IndexNow: submitting ${urlList.length} URL(s) for ${host}`);
  await pingIndexNow({ host, key, urlList, endpoint });
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

if (isDirectRun()) {
  main()
    .catch((error) => {
      console.log(`IndexNow: ping error: ${error instanceof Error ? error.message : String(error)}`);
    })
    .then(() => {
      process.exit(0);
    });
}
