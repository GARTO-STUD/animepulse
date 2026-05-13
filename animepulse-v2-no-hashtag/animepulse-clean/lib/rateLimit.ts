/**
 * lib/rateLimit.ts
 * Lightweight in-memory rate limiter for Next.js Edge Runtime.
 *
 * Resets on cold start — acceptable for edge functions.
 * For persistent rate limiting across instances, use KV (Cloudflare) or Upstash Redis.
 *
 * Usage:
 *   const result = rateLimit(ip, { windowMs: 60_000, max: 30 });
 *   if (!result.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Global map — shared within a single edge isolate
const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  /** Time window in ms (default: 60 000 = 1 minute) */
  windowMs?: number;
  /** Max requests per window (default: 60) */
  max?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  /** Seconds until window resets */
  retryAfter: number;
}

/**
 * Check and increment the rate limit counter for a given key.
 * Key is typically an IP address, but can be any string identifier.
 */
export function rateLimit(
  key: string,
  { windowMs = 60_000, max = 60 }: RateLimitOptions = {}
): RateLimitResult {
  const now = Date.now();

  let entry = store.get(key);

  // Expired window → reset
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;

  const allowed = entry.count <= max;
  const remaining = Math.max(0, max - entry.count);
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

  return { allowed, remaining, resetAt: entry.resetAt, retryAfter };
}

/**
 * Extract the best available IP from a Next.js edge request.
 * Prefers Cloudflare's header, then X-Forwarded-For, then falls back to 'unknown'.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}
