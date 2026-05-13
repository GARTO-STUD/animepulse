/**
 * GET /api/articles — Articles listing with pagination, filtering, caching
 * Edge Runtime (Cloudflare Pages compatible)
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseToken, fsQuery, fsVal } from '@/lib/firebase-rest';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Cache TTL: 2 minutes for article lists
const CACHE_TTL = 120;

// Rate limit configs
// Search hits Firebase harder (fetches 300 docs) — stricter limit
const RATE_SEARCH  = { windowMs: 60_000, max: 15 };  // 15 searches/min per IP
const RATE_LISTING = { windowMs: 60_000, max: 60 };  // 60 requests/min per IP

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // ── Rate Limiting ──────────────────────────────────────────────────────────
  const ip = getClientIp(req.headers);
  const isSearch = !!searchParams.get('q')?.trim();
  const rlConfig = isSearch ? RATE_SEARCH : RATE_LISTING;
  const rl = rateLimit(`articles:${ip}:${isSearch ? 'search' : 'list'}`, rlConfig);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.', retryAfter: rl.retryAfter },
      {
        status: 429,
        headers: {
          ...CORS,
          'Retry-After':           String(rl.retryAfter),
          'X-RateLimit-Limit':     String(rlConfig.max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset':     String(rl.resetAt),
        },
      }
    );
  }

  // Add rate limit info to successful responses too
  const rlHeaders = {
    'X-RateLimit-Limit':     String(rlConfig.max),
    'X-RateLimit-Remaining': String(rl.remaining),
    'X-RateLimit-Reset':     String(rl.resetAt),
  };

  const limit  = Math.min(parseInt(searchParams.get('limit')  || '20'), 100);
  const page   = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const source = searchParams.get('source');
  const tag    = searchParams.get('tag');
  const type   = searchParams.get('type');
  const q      = searchParams.get('q')?.toLowerCase().trim() || '';
  const status = searchParams.get('status') || 'published';

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saJson)
    return NextResponse.json({ error: 'FIREBASE_SERVICE_ACCOUNT_KEY not set' }, { status: 500 });

  try {
    const sa = JSON.parse(saJson);
    const token = await getFirebaseToken(saJson);
    const pid = sa.project_id;
    const base = `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents`;

    // ── Trending endpoint ────────────────────────────────────────────────────
    if (type === 'trending') {
      const r = await fetch(`${base}/meta/trending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const d = await r.json() as { fields?: Record<string, unknown> };
        const data = d.fields
          ? Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, fsVal(v)]))
          : { anime: [], updatedAt: null };
        return NextResponse.json(data, {
          headers: { ...CORS, ...rlHeaders, 'Cache-Control': `public, max-age=${CACHE_TTL}` },
        });
      }
      return NextResponse.json({ anime: [], updatedAt: null }, { headers: { ...CORS, ...rlHeaders } });
    }

    // ── Autopilot status endpoint ────────────────────────────────────────────
    if (type === 'autopilot-status') {
      const r = await fetch(`${base}/meta/autopilot-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const d = await r.json() as { fields?: Record<string, unknown> };
        const data = d.fields
          ? Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, fsVal(v)]))
          : null;
        return NextResponse.json({ status: data }, { headers: { ...CORS, ...rlHeaders } });
      }
      return NextResponse.json({ status: null }, { headers: { ...CORS, ...rlHeaders } });
    }

    // ── Article listing ──────────────────────────────────────────────────────
    const fetchLimit = (source || tag || q || status !== 'published') ? 300 : limit * page + limit;
    const rows = await fsQuery(pid, token, 'articles', fetchLimit);

    let articles = rows;

    if (status === 'published') {
      articles = articles.filter(a => !a.status || a.status === 'published');
    } else if (status !== 'all') {
      articles = articles.filter(a => a.status === status);
    }

    if (source) articles = articles.filter(a => a.sourceType === source);
    if (tag)    articles = articles.filter(a => Array.isArray(a.tags) && (a.tags as string[]).includes(tag));

    if (q) {
      articles = articles.filter(a => {
        const text = `${a.title} ${a.summary} ${(a.tags as string[] || []).join(' ')}`.toLowerCase();
        return q.split(' ').filter(Boolean).every(word => text.includes(word));
      });
    }

    const total  = articles.length;
    const offset = (page - 1) * limit;
    const paginated = articles.slice(offset, offset + limit);

    return NextResponse.json(
      { articles: paginated, total, page, limit, pages: Math.ceil(total / limit), hasMore: offset + limit < total },
      {
        headers: {
          ...CORS,
          ...rlHeaders,
          'Cache-Control': `public, max-age=${CACHE_TTL}, stale-while-revalidate=60`,
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
