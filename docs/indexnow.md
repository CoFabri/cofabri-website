# IndexNow

A successful production deploy of this site tells [IndexNow](https://www.indexnow.org/) which pages changed. Bing, Yandex, Seznam, and Naver pick that up through `https://api.indexnow.org`. The key is public on purpose. Nothing about it is a secret.

## How it works

The key is a 32-character lowercase hex string. It is the file `public/<key>.txt`, and the file's entire body is that same key (no newline, no spaces). Production serves it at `https://cofabri.com/<key>.txt`.

`.github/workflows/indexnow.yml` runs on GitHub `deployment_status`. It pings only when all of these are true:

- the status is `success`
- the deployment was created by `vercel[bot]`
- the environment is production for the project that serves this site (`Production`, or Vercel's `Production – cofabri-website`)

Preview deployments are skipped. The separate Vercel project `co-fabri-website` does not serve cofabri.com, so its production deployments are skipped too.

The job checks out the deployed commit, reads the key file, fetches `https://cofabri.com/sitemap.xml`, and POSTs those URLs to IndexNow as `{ host, key, keyLocation, urlList }`. HTTP 200 and 202 are success. Any other status, or a network error, is written to the job log. The job still succeeds.

`www.cofabri.com` redirects to the apex, so only `cofabri.com` is submitted.

## Rotate the key

1. Generate a key: `openssl rand -hex 16`.
2. Delete `public/<old-key>.txt`.
3. Add `public/<new-key>.txt`. The file name is `<new-key>.txt` and the body is the new key alone, with no newline.
4. Merge to `main` and let the production deploy finish.

The workflow uses whichever single key file is in `public/`. There is no secret to update. IndexNow checks the new URL after that deploy. Leave exactly one key file; two files make the unit test fail, and the ping logs the problem and skips.
