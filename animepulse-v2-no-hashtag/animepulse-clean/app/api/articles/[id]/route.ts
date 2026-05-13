/**
 * GET /api/articles/[id] — Fetch single article + increment view counter
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseToken, fsGet, fsPatch } from '@/lib/firebase-rest';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saJson)
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });

  try {
    const sa    = JSON.parse(saJson);
    const token = await getFirebaseToken(saJson);
    const pid   = sa.project_id;

    const article = await fsGet(pid, token, `articles/${id}`);
    if (!article)
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS });

    // View counter throttle: only count once per visitor per hour
    // Uses a simple cookie check to avoid hammering Firestore
    const viewedCookie = req.cookies.get(`viewed_${id}`)?.value;
    const currentViews = (article.views as number) || 0;
    const newViews = currentViews + (viewedCookie ? 0 : 1);

    const res = NextResponse.json(
      { article: { ...article, views: newViews } },
      {
        headers: {
          ...CORS,
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      }
    );

    // Increment asynchronously only if not already counted this hour
    if (!viewedCookie) {
      fsPatch(pid, token, `articles/${id}`, { views: newViews }).catch(() => {});
      // Set a 1-hour cookie so we don't double-count
      res.cookies.set(`viewed_${id}`, '1', {
        maxAge: 3600,
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
      });
    }

    return res;
  } catch (e) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
