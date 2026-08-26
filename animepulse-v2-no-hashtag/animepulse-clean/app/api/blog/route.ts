/**
 * GET /api/blog — Fetch autopilot-generated blog posts from Firestore
 * Falls back to static posts if Firestore not configured
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseToken, fsVal } from '@/lib/firebase-rest';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit  = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const cat    = searchParams.get('category') || '';
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!saJson) {
    return NextResponse.json({ posts: [], source: 'static' }, { headers: CORS });
  }

  try {
    const sa    = JSON.parse(saJson);
    const token = await getFirebaseToken(saJson);
    const pid   = sa.project_id;

    // Fetch blog posts from Firestore
    const url = `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/blog?pageSize=${limit}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (!res.ok) return NextResponse.json({ posts: [], source: 'empty' }, { headers: CORS });

    const data = await res.json() as { documents?: Array<{ fields?: Record<string, unknown>; name?: string }> };
    const docs = data.documents || [];

    let posts = docs
      .filter(d => d.fields)
      .map(d => {
        const f = d.fields!;
        return Object.fromEntries(Object.entries(f).map(([k, v]) => [k, fsVal(v)]));
      })
      .filter(p => p.status !== 'rejected')
      .sort((a, b) => new Date(String(b.publishedAt || b.date || 0)).getTime() - new Date(String(a.publishedAt || a.date || 0)).getTime());

    if (cat) posts = posts.filter(p => p.category === cat);

    return NextResponse.json(
      { posts: posts.slice(0, limit), total: posts.length, source: 'firestore' },
      { headers: { ...CORS, 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } }
    );
  } catch (e) {
    console.error('[blog GET]', e);
    return NextResponse.json({ posts: [], source: 'error' }, { headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
