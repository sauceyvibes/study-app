/**
 * The admin session: a signed expiry time in an HttpOnly cookie.
 *
 * There is one admin and no user table, so the cookie carries nothing but when
 * it expires and an HMAC over that. It uses Web Crypto so the same code runs in
 * the edge middleware and the Node route handlers. The key is derived from the
 * password as well as the secret, so changing the password signs everyone out.
 */

export const SESSION_COOKIE = 'atlas_admin';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

function signingKey(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return `${process.env.ADMIN_SESSION_SECRET ?? ''}:${password}`;
}

export function adminConfigured(): boolean {
  return signingKey() !== null;
}

async function hmac(message: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compare without leaking, through timing, how much of the string matched. */
export function safeEqual(a: string, b: string): boolean {
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export async function createSession(now = Date.now()): Promise<string> {
  const key = signingKey();
  if (!key) throw new Error('ADMIN_PASSWORD is not set');
  const expires = String(Math.floor(now / 1000) + SESSION_TTL_SECONDS);
  return `${expires}.${await hmac(expires, key)}`;
}

export async function verifySession(token: string | undefined, now = Date.now()): Promise<boolean> {
  const key = signingKey();
  if (!key || !token) return false;
  const [expires, signature] = token.split('.');
  if (!expires || !signature || Number(expires) * 1000 < now) return false;
  return safeEqual(signature, await hmac(expires, key));
}

export async function checkPassword(candidate: string): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  // Hash both sides so the comparison is over equal-length strings.
  return safeEqual(await hmac(candidate, 'pw'), await hmac(password, 'pw'));
}
