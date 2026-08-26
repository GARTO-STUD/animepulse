/**
 * POST /api/admin-auth — Server-side admin authentication
 * - Password compared server-side only (never exposed to client)
 * - Brute-force protection: 5 attempts → 15-minute lockout per IP
 * - Constant-time comparison to prevent timing attacks
 * - Returns httpOnly session cookie (8h) using signed JWT
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSession, verifySession } from '@/lib/session';
export { verifySession };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animepulse.online';
const CORS = {
  'Access-Control-Allow-Origin': APP_URL,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const failMap = new Map<string, { count: number; until: number }>();

function isBlocked(ip: string): boolean {
  const entry = failMap.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.until) { failMap.delete(ip); return false; }
  return entry.count >= 5;
}
function recordFail(ip: string) {
  const e = failMap.get(ip) || { count: 0, until: 0 };
  e.count++;
  e.until = Date.now() + 15 * 60 * 1000;
  failMap.set(ip, e);
}
function clearFail(ip: string) { failMap.delete(ip); }

function timingSafeEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length !== b.length ? 1 : 0;
  for (let i = 0; i < maxLen; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('cf-connecting-ip')
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';

  if (isBlocked(ip)) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Try again in 15 minutes.' },
      { status: 429, headers: CORS }
    );
  }

  let body: { password?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: CORS }); }

  const expected = process.env.ADMIN_PASSWORD || 'animepulse-admin';

  if (!timingSafeEqual(body.password || '', expected)) {
    recordFail(ip);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: CORS });
  }

  clearFail(ip);

  const token   = await createSession();
  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000);

  const res = NextResponse.json({ ok: true }, { headers: CORS });
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure:   true,
    sameSite: 'strict',
    expires,
    path:     '/',
  });
  return res;
    }
