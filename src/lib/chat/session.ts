import { createHmac, timingSafeEqual } from 'node:crypto';

export const CHAT_COOKIE = 'cofabri_chat';
export const CHAT_TTL_SECONDS = 30 * 60;

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/** A short-lived proof that this browser passed Turnstile: "<expiresAtMs>.<hmac>". */
export function signChatToken(secret: string, nowMs: number = Date.now()): string {
  const payload = String(nowMs + CHAT_TTL_SECONDS * 1000);
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyChatToken(secret: string, token: string | null | undefined, nowMs: number = Date.now()): boolean {
  if (!secret || !token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!payload || !signature || !/^\d+$/.test(payload)) return false;
  if (Number(payload) < nowMs) return false;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function chatCookieHeader(token: string, secure: boolean): string {
  return `${CHAT_COOKIE}=${token}; Max-Age=${CHAT_TTL_SECONDS}; Path=/api/chat; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export function readChatCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === CHAT_COOKIE) return rest.join('=') || null;
  }
  return null;
}
