/**
 * POST /api/autopilot  — Smart AutoPilot v2
 * GET  /api/autopilot  — Status check
 *
 * Improvements over v1:
 *  - News scoring system: only publishes articles scoring >= PUBLISH_THRESHOLD
 *  - Deduplication: URL, titleHash, and Jaccard similarity checks
 *  - Rate limiting: max MAX_DAILY_ARTICLES per run
 *  - Articles saved as 'draft' so admin can review before publishing
 *  - Groq AI (primary) + Gemini (fallback)
 *  - Structured content: hook, context, highlights, opinion, next steps
 */
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import {
  getFirebaseToken, fsQuery, fsSet, fsBatchWrite, genId, fsVal,
  type Article,
} from '@/lib/firebase-rest';
import {
  scoreArticle, deduplicateArticles, titleHash,
  PUBLISH_THRESHOLD, MAX_DAILY_ARTICLES,
} from '@/lib/scoring';
import { generateArticle } from '@/lib/articleGenerator';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animepulse.online';
const CORS = {
  'Access-Control-Allow-Origin': APP_URL,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-cron-secret',
  'Vary': 'Origin',
};

// ─── RSS Sources (scored by credibility) ─────────────────────────────────────

const RSS_SOURCES = [
  { name: 'Anime News Network', url: 'https://www.animenewsnetwork.com/news/rss.xml',              credibility: 30 },
  { name: 'Crunchyroll News',   url: 'https://feeds.feedburner.com/crunchyroll/animenews',          credibility: 28 },
  { name: 'MyAnimeList News',   url: 'https://myanimelist.net/rss/news.rss',                        credibility: 25 },
  { name: 'Otaku USA',          url: 'https://otakuusamagazine.com/feed/',                          credibility: 22 },
  { name: 'Anime Corner',       url: 'https://animecorner.me/feed/',                                credibility: 20 },
  { name: 'AniTrendz',          url: 'https://anitrendz.net/rss',                                   credibility: 18 },
  { name: 'Anime Senpai',       url: 'https://www.animesenpai.net/feed/',                           credibility: 20 },
  { name: 'Anime Collective',   url: 'https://animecollective.org/feed/',                           credibility: 16 },
  { name: 'Honey\'s Anime',     url: 'https://honeysanime.com/feed/',                               credibility: 18 },
  { name: 'Anime Trending',     url: 'https://anitrendz.com/news/feed/',                            credibility: 17 },
  { name: 'Comic Natalie',      url: 'https://natalie.mu/comic/feed/news',                          credibility: 22 },
  { name: 'Anime Balls Deep',   url: 'https://animeballs.com/feed/',                                credibility: 14 },
];

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  imageUrl?: string;
  source: string;
}

function parseRSS(xml: string, srcName: string): RSSItem[] {
  const items: RSSItem[] = [];
  for (const item of (xml.match(/<item>[\s\S]*?<\/item>/g) || []).slice(0, 8)) {
    const title = item
      .match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/title>/i)?.[1]
      ?.replace(/<!\[CDATA\[|\]\]>/g, '')
      .trim() || '';
    const link = item.match(/<link>([^<]*)<\/link>/i)?.[1]?.trim() || '';
    if (!title || !link) continue;

    const rawDesc = (
      item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/description>/i)?.[1] || ''
    )
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();

    const pubDate =
      item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() ||
      item.match(/<dc:date>([\s\S]*?)<\/dc:date>/i)?.[1]?.trim();

    const imgMatch =
      item.match(/<media:thumbnail[^>]+url="([^"]+)"/i) ||
      item.match(/<enclosure[^>]+url="([^"]+)"[^>]*type="image/i);

    items.push({
      title,
      link,
      description: rawDesc.length > 300 ? rawDesc.slice(0, 297) + '...' : rawDesc,
      pubDate,
      imageUrl: imgMatch?.[1],
      source: srcName,
    });
  }
  return items;
}

async function fetchAllRSS(): Promise<RSSItem[]> {
  const all: RSSItem[] = [];
  await Promise.allSettled(
    RSS_SOURCES.map(async src => {
      try {
        const r = await fetch(src.url, {
          headers: { 'User-Agent': 'AnimePulse/2.0 (+https://animepulse.online)' },
        });
        if (!r.ok) return;
        parseRSS(await r.text(), src.name).forEach(i => all.push(i));
      } catch { /* RSS source unreachable — skip silently */ }
    })
  );
  return all;
}

// ─── Fetch anime image from Jikan ────────────────────────────────────────────

async function fetchAnimeImage(title: string): Promise<string | null> {
  try {
    await new Promise(r => setTimeout(r, 400));
    // Clean title: remove season/year noise for better match
    const q = title
      .replace(/season\s*\d+|s\d+|part\s*\d+|\d{4}/gi, '')
      .replace(/[^\w\s]/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 5)
      .join(' ');

    const res = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=3&order_by=popularity&sort=asc`
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      data?: Array<{
        images?: {
          jpg?: { large_image_url?: string; image_url?: string };
          webp?: { large_image_url?: string };
        };
        score?: number;
      }>;
    };

    // Pick the entry with the best score (most relevant)
    const entries = data.data || [];
    const best = entries.find(e => e.score) || entries[0];
    if (!best) return null;

    // Prefer webp large, then jpg large, then jpg normal
    return (
      best.images?.webp?.large_image_url ||
      best.images?.jpg?.large_image_url ||
      best.images?.jpg?.image_url ||
      null
    );
  } catch {
    return null;
  }
}

// ─── Count today's published articles ────────────────────────────────────────

function countTodayArticles(articles: Record<string, unknown>[]): number {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return articles.filter(a => {
    const d = new Date(a.publishedAt as string);
    return d >= todayStart;
  }).length;
}

// ─── Main AutoPilot logic ─────────────────────────────────────────────────────

// ─── Blog Category Detection ──────────────────────────────────────────────────

function detectBlogCategory(tags: string[]): string {
  const lc = tags.map(t => t.toLowerCase()).join(' ');
  if (/review|verdict|rating/.test(lc))         return 'Reviews';
  if (/top|best|ranked|list/.test(lc))           return 'Top Lists';
  if (/guide|beginner|how to|tips/.test(lc))     return 'Guides';
  if (/season|sequel|announce|release/.test(lc)) return 'News';
  if (/analysis|deep dive|explained/.test(lc))   return 'Analysis';
  return 'News';
}

async function runAutoPilot(saJson: string, groqKey: string, geminiKey: string) {
  const sa = JSON.parse(saJson);
  const token = await getFirebaseToken(saJson);
  const pid = sa.project_id;

  const errors: string[] = [];
  let added = 0;
  let skippedScore = 0;
  let skippedDuplicate = 0;


  // 1. Load existing articles (for deduplication)
  const existing = await fsQuery(pid, token, 'articles', 300);

  // 2. Check daily limit
  const todayCount = countTodayArticles(existing);
  const canPublish = Math.max(0, MAX_DAILY_ARTICLES - todayCount);

  if (canPublish === 0) {
    return {
      ok: true,
      added: 0,
      message: `Daily limit reached (${MAX_DAILY_ARTICLES} articles/day)`,
      todayCount,
      errors: [],
    };
  }

  // 3. Fetch RSS items
  const rssItems = await fetchAllRSS();

  // 4. Deduplicate candidates
  const candidates = deduplicateArticles(rssItems, existing);
  skippedDuplicate = rssItems.length - candidates.length;

  // 5. Score all candidates
  const scored = candidates
    .map(item => ({
      item,
      score: scoreArticle({
        title: item.title,
        description: item.description,
        source: item.source,
        publishedAt: item.pubDate,
      }),
    }))
    .sort((a, b) => b.score.total - a.score.total); // Best scores first

  // 6. Process top-scoring articles up to daily limit
  const toProcess = scored.filter(s => s.score.total >= PUBLISH_THRESHOLD).slice(0, canPublish);
  skippedScore = scored.filter(s => s.score.total < PUBLISH_THRESHOLD).length;

  let blogAdded = 0;

  for (const { item, score } of toProcess) {
    try {
      const gen = await generateArticle(
        { title: item.title, description: item.description },
        groqKey,
        geminiKey
      );

      // Try to get an anime image
      let imageUrl = item.imageUrl;
      if (!imageUrl) {
        imageUrl = await fetchAnimeImage(item.title) || null;
      }

      const articleId = genId();

      const article: Article = {
        id: articleId,
        title: gen.title,
        content: gen.content,
        summary: gen.summary,
        editorialNote: gen.editorialNote,
        verdict: gen.verdict,
        source: item.source,
        sourceType: 'rss',
        url: item.link,
        imageUrl: imageUrl || null,
        publishedAt: new Date().toISOString(),
        tags: gen.tags,
        readTime: gen.readTime,
        status: 'draft',
        qualityScore: score.total,
        scoreBreakdown: score,
        titleHash: titleHash(item.title),
        views: 0,
        seoTitle: gen.seoTitle,
        metaDescription: gen.metaDescription,
        keywords: gen.keywords,
      };

      existing.unshift(article as unknown as Record<string, unknown>);
      added++;

      // ── Auto-publish top-scoring articles to Blog ─────────────────────────
      // Every 2nd article (score >= 65) gets a blog post too
      const shouldBlog = score.total >= 65 && blogAdded < 3 && added % 2 === 1;
      if (shouldBlog) {
        try {
          const blogSlug = `autopilot-${articleId.slice(0, 8)}`;
          const blogPost = {
            id: blogSlug,
            slug: blogSlug,
            title: gen.title,
            summary: gen.summary,
            content: gen.content,
            category: detectBlogCategory(gen.tags),
            date: new Date().toISOString().split('T')[0],
            readTime: gen.readTime,
            imageUrl: imageUrl || null,
            tags: gen.tags,
            source: item.source,
            sourceArticleId: articleId,
            verdict: gen.verdict,
            editorialNote: gen.editorialNote,
            status: 'draft',
            publishedAt: new Date().toISOString(),
            views: 0,
            seoTitle: gen.seoTitle,
            metaDescription: gen.metaDescription,
            keywords: gen.keywords,
          };
          await fsSet(pid, token, `blog/${blogSlug}`, blogPost as unknown as Record<string, unknown>);
          blogAdded++;
        } catch { /* blog write failed — non-critical */ }
      }


    } catch (e) {
      errors.push(`Error processing "${item.title}": ${String(e)}`);
    }
  }

  // 7. Save only the newly added articles to Firestore (don't overwrite all 300)
  const newArticles = existing.slice(0, added) as Record<string, unknown>[];
  if (newArticles.length > 0) {
    await fsBatchWrite(pid, token, 'articles', newArticles);
  }

  // 8. Update trending data from Jikan
  try {
    const tr = await fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10').then(
      r => r.ok ? r.json() : { data: [] }
    ).catch(() => ({ data: [] }));
    await fsSet(pid, token, 'meta/trending', {
      updatedAt: new Date().toISOString(),
      anime: (tr.data || []).map((a: { title: string; images?: { jpg?: { image_url?: string } }; score?: number }) => ({
        title: a.title,
        imageUrl: a.images?.jpg?.image_url || null,
        score: a.score || null,
      })),
    });
  } catch { /* Jikan trending fetch failed — non-critical */ }

  // 9. Update autopilot status
  await fsSet(pid, token, 'meta/autopilot-status', {
    lastRun: new Date().toISOString(),
    articlesAdded: added,
    blogPostsAdded: blogAdded,
    skippedScore,
    skippedDuplicate,
    todayCount: todayCount + added,
    dailyLimit: MAX_DAILY_ARTICLES,
    publishThreshold: PUBLISH_THRESHOLD,
    totalCandidates: candidates.length,
    errors,
  });

  return {
    ok: true,
    added,
    blogPostsAdded: blogAdded,
    skippedScore,
    skippedDuplicate,
    todayCount: todayCount + added,
    dailyLimit: MAX_DAILY_ARTICLES,
    errors,
  };
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

export async function GET() {
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saJson)
    return NextResponse.json({ error: 'FIREBASE_SERVICE_ACCOUNT_KEY not set' }, { status: 500, headers: CORS });
  try {
    const sa = JSON.parse(saJson);
    const token = await getFirebaseToken(saJson);
    const pid = sa.project_id;

    const statusDoc = await fetch(
      `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/meta/autopilot-status`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let status = null;
    if (statusDoc.ok) {
      const d = await statusDoc.json() as { fields?: Record<string, unknown> };
      if (d.fields) {
        status = Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, fsVal(v)]));
      }
    }

    const articles = await fsQuery(pid, token, 'articles', 5);

    return NextResponse.json(
      {
        ok: true,
        status,
        publishThreshold: PUBLISH_THRESHOLD,
        dailyLimit: MAX_DAILY_ARTICLES,
        latestArticles: articles.slice(0, 5).map(a => ({
          id: a.id, title: a.title, publishedAt: a.publishedAt, status: a.status, qualityScore: a.qualityScore,
        })),
      },
      { headers: CORS }
    );
  } catch (e) {
    console.error("[autopilot GET]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS });
  }
}

// Rate limiting now handled by shared lib/rateLimit.ts

export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  const secret = req.headers.get('x-cron-secret') || url.searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });

  // Max 10 autopilot runs per hour per caller IP
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`autopilot:${ip}`, { windowMs: 3600_000, max: 10 });
  if (!rl.allowed)
    return NextResponse.json(
      { error: 'Rate limit exceeded — max 10 autopilot runs/hour', retryAfter: rl.retryAfter },
      { status: 429, headers: { ...CORS, 'Retry-After': String(rl.retryAfter) } }
    );

  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saJson)
    return NextResponse.json({ error: 'FIREBASE_SERVICE_ACCOUNT_KEY not set' }, { status: 500, headers: CORS });

  try {
    const result = await runAutoPilot(
      saJson,
      process.env.GROQ_API_KEY || '',
      process.env.GEMINI_API_KEY || ''
    );
    return NextResponse.json(result, { headers: CORS });
  } catch (e) {
    console.error("[autopilot POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
