import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { isAcceptedStatus, postUrlBatch, readIndexNowKey, urlsFromSitemap } from '../../.github/scripts/indexnow.mjs';

const HOST = 'cofabri.com';

describe('IndexNow key file', () => {
  it('serves one 32-char lowercase hex key as the exact body of public/<key>.txt', () => {
    const key = readIndexNowKey(join(process.cwd(), 'public'));
    expect(key).toMatch(/^[0-9a-f]{32}$/);
    const body = readFileSync(join(process.cwd(), 'public', `${key}.txt`));
    expect(body.equals(Buffer.from(key))).toBe(true);
  });

  it('rejects a trailing newline or a second key file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'indexnow-'));
    const key = '0123456789abcdef0123456789abcdef';
    try {
      writeFileSync(join(dir, `${key}.txt`), `${key}\n`);
      expect(() => readIndexNowKey(dir)).toThrow(/exactly the key/);
      writeFileSync(join(dir, `${key}.txt`), key);
      writeFileSync(join(dir, 'abcdef0123456789abcdef0123456789.txt'), 'abcdef0123456789abcdef0123456789');
      expect(() => readIndexNowKey(dir)).toThrow(/found 2/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('urlsFromSitemap', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset>
<url><loc>https://cofabri.com</loc></url>
<url><loc>https://cofabri.com/apps</loc></url>
<url><loc>https://cofabri.com/apps</loc></url>
<url><loc>https://www.cofabri.com/about</loc></url>
<url><loc>https://other.example/page</loc></url>
<url><loc>http://cofabri.com/insecure</loc></url>
<url><loc>https://cofabri.com/sitemap.xml</loc></url>
<url><loc>https://cofabri.com/knowledge-base/a&amp;b</loc></url>
</urlset>`;

  it('keeps https URLs on the apex host and drops the rest', () => {
    expect(urlsFromSitemap(xml, HOST)).toEqual([
      'https://cofabri.com',
      'https://cofabri.com/apps',
      'https://cofabri.com/knowledge-base/a&b',
    ]);
  });
});

describe('postUrlBatch', () => {
  it('POSTs host, key, keyLocation, and urlList, and treats 200 and 202 as success', async () => {
    const key = '0123456789abcdef0123456789abcdef';
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response('', { status: 202 }));
    const result = await postUrlBatch({
      endpoint: 'https://api.indexnow.org/indexnow',
      host: HOST,
      key,
      urlList: ['https://cofabri.com', 'https://cofabri.com/apps'],
      fetchImpl,
    });

    expect(isAcceptedStatus(result.status)).toBe(true);
    expect(isAcceptedStatus(200)).toBe(true);
    expect(isAcceptedStatus(403)).toBe(false);
    expect(result.keyLocation).toBe(`https://cofabri.com/${key}.txt`);

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.indexnow.org/indexnow');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({
      host: HOST,
      key,
      keyLocation: `https://cofabri.com/${key}.txt`,
      urlList: ['https://cofabri.com', 'https://cofabri.com/apps'],
    });
  });
});

describe('IndexNow workflow', () => {
  const workflow = readFileSync(join(process.cwd(), '.github/workflows/indexnow.yml'), 'utf8');

  it('runs only on a successful Vercel production deployment', () => {
    expect(workflow).toContain('deployment_status:');
    expect(workflow).toContain("github.event.deployment_status.state == 'success'");
    expect(workflow).toContain("github.event.deployment.creator.login == 'vercel[bot]'");
    expect(workflow).toContain("startsWith(github.event.deployment_status.environment, 'Production')");
    expect(workflow).toContain("endsWith(github.event.deployment_status.environment, 'cofabri-website')");
    expect(workflow).not.toContain('pull_request:');
    expect(workflow).toContain('node .github/scripts/indexnow.mjs');
  });
});
