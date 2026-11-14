import { timingSafeEqual } from '@/lib/backstop';

// /preview/* gate. A successful login (the login form, or a legacy
// ?password= link from the CMS) is turned into an HttpOnly cookie holding a
// hash of the password, so the password itself does not stay in URLs,
// history or logs. Changing PREVIEW_PASSWORD invalidates every cookie.
export const PREVIEW_COOKIE = 'cofabri_preview';
export const PREVIEW_COOKIE_MAX_AGE = 8 * 60 * 60; // 8 hours

export const previewCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: PREVIEW_COOKIE_MAX_AGE,
};

export type PreviewGateEnv = { vercelEnv?: string; nodeEnv?: string; previewPassword?: string };

export function readPreviewGateEnv(): PreviewGateEnv {
  return {
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
    previewPassword: process.env.PREVIEW_PASSWORD,
  };
}

// Without a password: open on dev servers and Vercel preview deployments,
// closed in production (Vercel production, or a production build hosted
// anywhere that does not set VERCEL_ENV).
export function previewGateState(env: PreviewGateEnv): 'open' | 'closed' | 'password' {
  if (env.previewPassword) return 'password';
  const production = env.vercelEnv ? env.vercelEnv === 'production' : env.nodeEnv === 'production';
  return production ? 'closed' : 'open';
}

export async function previewCookieValue(password: string): Promise<string> {
  const data = new TextEncoder().encode(`cofabri-preview-v1:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function passwordMatches(candidate: string | null | undefined, expected: string): boolean {
  return timingSafeEqual(candidate ?? null, expected);
}

export async function cookieMatches(cookie: string | null | undefined, expected: string): Promise<boolean> {
  if (!cookie) return false;
  return timingSafeEqual(cookie, await previewCookieValue(expected));
}
