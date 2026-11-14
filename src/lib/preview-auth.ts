import { isProductionEnv, timingSafeEqual } from '@/lib/backstop';

// /preview/* gate. Logging in at /preview/login (the only way in) sets an
// HttpOnly cookie holding a signed token: `v2.<expiry>.<hmac>`. The HMAC key
// is derived server-side from PREVIEW_PASSWORD (plus PREVIEW_COOKIE_SECRET
// when set), so the cookie is not password-equivalent, expires after 8 hours
// (checked on the server, not just by the browser), and changing the
// password invalidates every token.
export const PREVIEW_COOKIE = 'cofabri_preview';
export const PREVIEW_COOKIE_MAX_AGE = 8 * 60 * 60; // 8 hours

export const previewCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: PREVIEW_COOKIE_MAX_AGE,
};

export type PreviewGateEnv = {
  vercelEnv?: string;
  nodeEnv?: string;
  previewPassword?: string;
  cookieSecret?: string;
};

export function readPreviewGateEnv(): PreviewGateEnv {
  return {
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
    previewPassword: process.env.PREVIEW_PASSWORD,
    cookieSecret: process.env.PREVIEW_COOKIE_SECRET,
  };
}

// Without a password: open on dev servers and Vercel preview deployments,
// closed in production (Vercel production, or a production build hosted
// anywhere that does not set VERCEL_ENV).
export function previewGateState(env: PreviewGateEnv): 'open' | 'closed' | 'password' {
  if (env.previewPassword) return 'password';
  return isProductionEnv(env) ? 'closed' : 'open';
}

const encoder = new TextEncoder();
const TOKEN_VERSION = 'v2';

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(key: BufferSource, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
}

// Signing key: HMAC(secret-or-label, "cofabri-preview-cookie-key-v2:" + password).
// Distinct label from anything else the password is used for.
async function signingKey(password: string, secret?: string): Promise<ArrayBuffer> {
  const base: BufferSource = encoder.encode(secret ? `cofabri-preview-secret:${secret}` : 'cofabri-preview-no-secret');
  return hmac(base, `cofabri-preview-cookie-key-v2:${password}`);
}

export async function issuePreviewToken(
  password: string,
  secret?: string,
  nowMs: number = Date.now(),
): Promise<string> {
  const expires = Math.floor(nowMs / 1000) + PREVIEW_COOKIE_MAX_AGE;
  const payload = `${TOKEN_VERSION}.${expires}`;
  const sig = toHex(await hmac(await signingKey(password, secret), payload));
  return `${payload}.${sig}`;
}

export async function verifyPreviewToken(
  token: string | null | undefined,
  password: string,
  secret?: string,
  nowMs: number = Date.now(),
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION || !/^\d{1,12}$/.test(parts[1])) return false;
  const expires = Number(parts[1]);
  const nowSec = Math.floor(nowMs / 1000);
  // Reject expired tokens and ones claiming more than the normal lifetime.
  if (expires <= nowSec || expires > nowSec + PREVIEW_COOKIE_MAX_AGE) return false;
  const expected = toHex(await hmac(await signingKey(password, secret), `${parts[0]}.${parts[1]}`));
  return timingSafeEqual(parts[2], expected);
}

export function passwordMatches(candidate: string | null | undefined, expected: string): boolean {
  return timingSafeEqual(candidate ?? null, expected);
}

export async function cookieMatches(cookie: string | null | undefined, env: PreviewGateEnv): Promise<boolean> {
  if (!env.previewPassword) return false;
  return verifyPreviewToken(cookie, env.previewPassword, env.cookieSecret);
}
