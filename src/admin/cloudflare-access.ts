/**
 * Checking that a request came through Cloudflare Access.
 *
 * The admin site has no login of its own: Cloudflare Zero Trust stands in front
 * of its domain. But Vercel also serves the same deployment on its own
 * `*.vercel.app` addresses, which Cloudflare never sees. So every request must
 * carry the JWT that Access attaches (`Cf-Access-Jwt-Assertion`), signed by the
 * team's keys and issued for this application. Without that check, anyone who
 * found the Vercel address could commit to main with the site's GitHub token.
 *
 * Web Crypto only, so it runs in the edge middleware without a dependency.
 */

interface AccessConfig {
  /** e.g. `yourteam.cloudflareaccess.com` */
  teamDomain: string;
  /** The Application Audience (AUD) tag from the Access application. */
  audience: string;
}

export function accessConfig(): AccessConfig | null {
  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const audience = process.env.CF_ACCESS_AUD;
  return teamDomain && audience ? { teamDomain, audience } : null;
}

type Jwk = JsonWebKey & { kid?: string };
let cachedKeys: { teamDomain: string; keys: Jwk[]; fetchedAt: number } | null = null;
const KEY_TTL_MS = 60 * 60 * 1000;

async function signingKeys(teamDomain: string, refresh = false): Promise<Jwk[]> {
  if (!refresh && cachedKeys?.teamDomain === teamDomain && Date.now() - cachedKeys.fetchedAt < KEY_TTL_MS) {
    return cachedKeys.keys;
  }
  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error(`Could not fetch Cloudflare Access keys (${response.status})`);
  const { keys } = (await response.json()) as { keys: Jwk[] };
  cachedKeys = { teamDomain, keys, fetchedAt: Date.now() };
  return keys;
}

function base64UrlDecode(part: string): Uint8Array<ArrayBuffer> {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

const decodeJson = (part: string) => JSON.parse(new TextDecoder().decode(base64UrlDecode(part))) as Record<string, unknown>;

export async function verifyAccessToken(
  token: string | null | undefined,
  config: AccessConfig,
  now = Date.now(),
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [rawHeader = '', rawPayload = '', rawSignature = ''] = parts;

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = decodeJson(rawHeader);
    payload = decodeJson(rawPayload);
  } catch {
    return false;
  }
  if (header.alg !== 'RS256') return false;

  const seconds = now / 1000;
  if (typeof payload.exp !== 'number' || payload.exp < seconds) return false;
  if (typeof payload.nbf === 'number' && payload.nbf > seconds + 60) return false;
  if (payload.iss !== `https://${config.teamDomain}`) return false;
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(config.audience)) return false;

  // Access rotates its keys; one refetch covers a token signed by a new one.
  for (const refresh of [false, true]) {
    const jwk = (await signingKeys(config.teamDomain, refresh)).find((k) => k.kid === header.kid);
    if (!jwk) continue;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    return crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlDecode(rawSignature),
      new TextEncoder().encode(`${rawHeader}.${rawPayload}`),
    );
  }
  return false;
}
