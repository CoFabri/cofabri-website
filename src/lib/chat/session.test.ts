import { describe, expect, it } from 'vitest';
import {
  CHAT_COOKIE,
  CHAT_TTL_SECONDS,
  chatCookieHeader,
  readChatCookie,
  signChatToken,
  verifyChatToken,
} from './session';

const SECRET = 'test-secret-value';

describe('chat session token', () => {
  it('verifies a fresh token', () => {
    const now = 1_000_000;
    expect(verifyChatToken(SECRET, signChatToken(SECRET, now), now + 1000)).toBe(true);
  });
  it('expires after the ttl', () => {
    const now = 1_000_000;
    const token = signChatToken(SECRET, now);
    expect(verifyChatToken(SECRET, token, now + CHAT_TTL_SECONDS * 1000 - 1)).toBe(true);
    expect(verifyChatToken(SECRET, token, now + CHAT_TTL_SECONDS * 1000 + 1)).toBe(false);
  });
  it('rejects a different secret, a tampered payload and a tampered signature', () => {
    const now = 1_000_000;
    const token = signChatToken(SECRET, now);
    const [payload, sig] = token.split('.');
    expect(verifyChatToken('other-secret', token, now)).toBe(false);
    expect(verifyChatToken(SECRET, `${Number(payload) + 99999999}.${sig}`, now)).toBe(false);
    expect(verifyChatToken(SECRET, `${payload}.${sig.slice(0, -2)}xx`, now)).toBe(false);
  });
  it('rejects malformed, empty and missing tokens', () => {
    for (const token of ['', 'abc', 'a.b.c', '123.', '.abc', 'notnumber.abc', null, undefined]) {
      expect(verifyChatToken(SECRET, token as string | null | undefined, 1)).toBe(false);
    }
    expect(verifyChatToken('', signChatToken(SECRET, 1), 1)).toBe(false);
  });
});

describe('cookie helpers', () => {
  it('builds an httpOnly cookie scoped to the chat route', () => {
    const header = chatCookieHeader('tok', true);
    expect(header).toContain(`${CHAT_COOKIE}=tok`);
    expect(header).toContain(`Max-Age=${CHAT_TTL_SECONDS}`);
    expect(header).toContain('Path=/api/chat');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('Secure');
    expect(chatCookieHeader('tok', false)).not.toContain('Secure');
  });
  it('reads the chat cookie from a cookie header', () => {
    expect(readChatCookie(`a=1; ${CHAT_COOKIE}=tok.sig; b=2`)).toBe('tok.sig');
    expect(readChatCookie('a=1')).toBeNull();
    expect(readChatCookie(null)).toBeNull();
  });
});
