/**
 * lib/session.ts
 * JWT-based session for edge runtime.
 * Uses HMAC-SHA256 signed tokens — no in-memory state needed.
 * Works correctly across all Cloudflare edge nodes.
 */

const SECRET_KEY = () => process.env.ADMIN_PASSWORD || 'animepulse-admin';

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSession(): Promise<string> {
  const expires = Date.now() + 8 * 60 * 60 * 1000; // 8 hours
  const payload = `expires=${expires}`;
  const key = await getKey(SECRET_KEY());
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${payload}.${sigHex}`;
}

export async function verifySession(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const lastDot = token.lastIndexOf('.');
    if (lastDot === -1) return false;
    const payload = token.slice(0, lastDot);
    const sigHex = token.slice(lastDot + 1);
    const key = await getKey(SECRET_KEY());
    const sigBytes = new Uint8Array(sigHex.match(/.{2}/g)!.map(h => parseInt(h, 16)));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payload));
    if (!valid) return false;
    const expires = parseInt(payload.replace('expires=', ''));
    return Date.now() < expires;
  } catch {
    return false;
  }
}

// Keep sessionStore export for backward compatibility (unused but prevents import errors)
export const sessionStore = new Map<string, { expires: number }>();
