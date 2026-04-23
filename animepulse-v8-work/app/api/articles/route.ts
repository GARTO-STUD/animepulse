/**
 * GET /api/articles — Firebase Edition
 * Returns articles from Firestore
 * Query params:
 *   ?limit=20        — number of articles (default 20, max 100)
 *   ?source=reddit   — filter by sourceType (rss | mal | reddit)
 *   ?tag=action      — filter by tag
 *   ?type=trending   — return trending data instead
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit  = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const source = searchParams.get('source');
  const tag    = searchParams.get('tag');
  const type   = searchParams.get('type');

  // ── Return trending data ───────────────────────────────────────────────────
  if (type === 'trending') {
    try {
      const doc = await adminDb.collection('meta').doc('trending').get();
      if (doc.exists) {
        return NextResponse.json(doc.data());
      }
    } catch { /* ignore */ }
    return NextResponse.json({ anime: [], analysis: '', updatedAt: null });
  }

  // ── Return articles ────────────────────────────────────────────────────────
  try {
    // Build query
    // Firestore doesn't support multiple where filters on different fields
    // without a composite index, so we filter in JS after the main query.
    const snap = await adminDb
      .collection('articles')
      .orderBy('publishedAt', 'desc')
      .limit(source || tag ? 200 : limit) // fetch more if we need to filter
      .get();

    let articles = snap.docs.map(d => d.data());

    if (source) articles = articles.filter((a: { sourceType: string }) => a.sourceType === source);
    if (tag)    articles = articles.filter((a: { tags: string[] }) => Array.isArray(a.tags) && a.tags.includes(tag));

    return NextResponse.json({
      articles: articles.slice(0, limit),
      total: articles.length,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
