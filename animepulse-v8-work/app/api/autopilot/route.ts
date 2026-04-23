/**
 * AnimePulse Auto-Pilot API Route — Firebase Edition
 * POST /api/autopilot  — run the full pipeline
 * GET  /api/autopilot  — check status / last run info
 *
 * Protect with CRON_SECRET env var.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { fetchAllSources } from '@/lib/rssParser';
import { generateArticle, generateTrendingAnalysis } from '@/lib/gemini';

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  sourceType: 'rss' | 'mal' | 'reddit';
  url: string;
  imageUrl?: string;
  youtubeId?: string;
  publishedAt: string;
  tags: string[];
  readTime: number;
  upvotes?: number;
}

interface RunStatus {
  lastRun: string;
  articlesAdded: number;
  trendingUpdated: boolean;
  sources: { rss: number; mal: number; reddit: number };
  errors: string[];
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function loadArticles(): Promise<Article[]> {
  try {
    const snap = await adminDb
      .collection('articles')
      .orderBy('publishedAt', 'desc')
      .limit(200)
      .get();
    return snap.docs.map(d => d.data() as Article);
  } catch {
    return [];
  }
}

async function saveArticles(articles: Article[]) {
  for (let i = 0; i < articles.length; i += 400) {
    const batch = adminDb.batch();
    const chunk = articles.slice(i, i + 400);
    for (const article of chunk) {
      const ref = adminDb.collection('articles').doc(article.id);
      batch.set(ref, article);
    }
    await batch.commit();
  }
}

async function loadStatus(): Promise<RunStatus | null> {
  try {
    const doc = await adminDb.collection('meta').doc('autopilot-status').get();
    return doc.exists ? (doc.data() as RunStatus) : null;
  } catch {
    return null;
  }
}

async function saveStatus(status: RunStatus) {
  await adminDb.collection('meta').doc('autopilot-status').set(status);
}

async function saveTrending(data: object) {
  await adminDb.collection('meta').doc('trending').set(data);
}

async function enrichWithJikan(
  title: string,
  existingImage?: string
): Promise<{ imageUrl?: string; youtubeId?: string }> {
  try {
    const searchTitle = title.replace(/[^\w\s]/g, ' ').trim().split(' ').slice(0, 4).join(' ');
    await new Promise(r => setTimeout(r, 400));
    const res = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchTitle)}&limit=1`,
      { headers: { 'User-Agent': 'AnimePulse/2.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      const anime = data.data?.[0];
      if (anime) {
        return {
          imageUrl: existingImage || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
          youtubeId: anime.trailer?.youtube_id || undefined,
        };
      }
    }
  } catch { /* skip */ }
  return { imageUrl: existingImage };
}

export async function GET() {
  const [status, articles] = await Promise.all([loadStatus(), loadArticles()]);
  return NextResponse.json({
    ok: true,
    lastRun: status?.lastRun ?? null,
    totalArticles: articles.length,
    latestArticles: articles.slice(0, 5).map(a => ({ id: a.id, title: a.title, publishedAt: a.publishedAt })),
    status,
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const errors: string[] = [];
  const existing = await loadArticles();
  const existingUrls = new Set(existing.map(a => a.url));
  let added = 0;

  let sources = { rss: 0, mal: 0, reddit: 0 };
  let allItems: { title: string; description: string; link: string; source: string; sourceType: 'rss' | 'mal' | 'reddit'; imageUrl?: string; upvotes?: number }[] = [];

  try {
    const { rss, mal, reddit, trending } = await fetchAllSources();
    sources = { rss: rss.length, mal: mal.length, reddit: reddit.length };
    allItems = [
      ...rss.map(i => ({ ...i, link: i.link, sourceType: 'rss' as const })),
      ...mal.map(i => ({ ...i, link: i.link, sourceType: 'mal' as const })),
      ...reddit.map(i => ({ ...i, link: i.link, sourceType: 'reddit' as const, upvotes: i.upvotes })),
    ];
    if (trending.length > 0) {
      const trendingTitles = trending.map(a => a.title);
      const analysis = await generateTrendingAnalysis(trendingTitles).catch(() => '');
      await saveTrending({ updatedAt: new Date().toISOString(), anime: trending, analysis });
    }
  } catch (e) {
    errors.push(`Fetch error: ${e}`);
  }

  const newItems = allItems.filter(i => !existingUrls.has(i.link)).slice(0, 15);

  for (const item of newItems) {
    try {
      const generated = await generateArticle({ title: item.title, description: item.description });
      const { imageUrl, youtubeId } = await enrichWithJikan(item.title, item.imageUrl);

      const article: Article = {
        id: genId(),
        title: generated.title || item.title,
        content: generated.content,
        summary: generated.summary || item.description,
        source: item.source,
        sourceType: item.sourceType,
        url: item.link,
        imageUrl,
        youtubeId,
        publishedAt: new Date().toISOString(),
        tags: generated.tags,
        readTime: generated.readTime,
        upvotes: item.upvotes,
      };

      existing.unshift(article);
      added++;
    } catch (e) {
      errors.push(`Article error for "${item.title}": ${e}`);
    }
  }

  await saveArticles(existing.slice(0, 200));

  const status: RunStatus = {
    lastRun: new Date().toISOString(),
    articlesAdded: added,
    trendingUpdated: true,
    sources,
    errors,
  };
  await saveStatus(status);

  return NextResponse.json({ ok: true, added, sources, errors });
}
