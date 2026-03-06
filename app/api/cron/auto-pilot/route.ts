/**
 * Auto-Pilot API Route for Cloudflare Pages
 * 
 * This route handles:
 * 1. Fetching anime news from RSS
 * 2. Generating AI content with Gemini
 * 3. Saving to Cloudflare KV (or returning for frontend)
 * 4. Posting to Telegram
 * 
 * Usage: GET /api/cron/auto-pilot?secret=YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';

// Import the logic from scripts
import { fetchAnimeRSS } from '@/lib/rssParser';
import { generateArticle } from '@/lib/gemini';
import { sendToTelegram } from '@/lib/telegram';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  tags: string[];
  postedToTelegram: boolean;
}

// For Cloudflare Pages, we'll store in a global variable
// In production, use Cloudflare KV or D1 Database
declare global {
  // eslint-disable-next-line no-var
  var newsCache: NewsItem[];
}

// Initialize cache
if (!globalThis.newsCache) {
  globalThis.newsCache = [];
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = {
      newsFetched: 0,
      articlesGenerated: 0,
      telegramPosted: 0,
      errors: [] as string[],
    };

    // 1️⃣ Fetch News from RSS
    console.log('📡 Fetching anime news...');
    const newsItems = await fetchNewsWithFallback();
    results.newsFetched = newsItems.length;

    // 2️⃣ Process each news item
    const existingTitles = new Set(
      globalThis.newsCache.map(n => n.title.toLowerCase())
    );

    for (const item of newsItems.slice(0, 3)) {
      // Skip duplicates
      if (existingTitles.has(item.title.toLowerCase())) {
        console.log(`⏭️ Skipping duplicate: ${item.title}`);
        continue;
      }

      try {
        // 2️⃣ Generate AI Article
        console.log(`🤖 Generating article: ${item.title}`);
        const article = await generateArticle({
          title: item.title,
          description: item.description,
        });

        const newsItem: NewsItem = {
          id: generateId(),
          title: article.title,
          content: article.content,
          summary: article.summary,
          source: item.source,
          url: item.link,
          publishedAt: new Date().toISOString(),
          tags: article.tags,
          postedToTelegram: false,
        };

        // 3️⃣ Save to Cache (simulating database)
        globalThis.newsCache.unshift(newsItem);
        existingTitles.add(item.title.toLowerCase());
        results.articlesGenerated++;

        // Keep only last 50
        if (globalThis.newsCache.length > 50) {
          globalThis.newsCache = globalThis.newsCache.slice(0, 50);
        }

        // 4️⃣ Post to Telegram
        if (process.env.TELEGRAM_BOT_TOKEN) {
          console.log('📱 Posting to Telegram...');
          const telegramSuccess = await sendToTelegram({
            title: newsItem.title,
            content: newsItem.summary,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/news`,
          });

          newsItem.postedToTelegram = telegramSuccess;
          if (telegramSuccess) {
            results.telegramPosted++;
            console.log('✅ Posted to Telegram');
          }
        }
      } catch (error) {
        const errorMsg = `Failed to process "${item.title}": ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      totalNews: globalThis.newsCache.length,
    });

  } catch (error) {
    console.error('❌ Auto-pilot failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET News API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'getNews':
        return NextResponse.json({
          news: globalThis.newsCache,
          total: globalThis.newsCache.length,
        });

      case 'addNews':
        const { newsItem } = body;
        if (newsItem) {
          globalThis.newsCache.unshift({
            ...newsItem,
            id: generateId(),
            publishedAt: new Date().toISOString(),
          });
        }
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// Helper: Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Helper: Fetch news with fallback
async function fetchNewsWithFallback() {
  try {
    // Try RSS first
    const rss = await import('@/lib/rssParser');
    const items = await rss.fetchAnimeRSS();
    if (items.length > 0) return items;
  } catch {
    console.log('RSS fetch failed, using fallback');
  }

  // Fallback: Return sample data
  return [
    {
      title: 'Attack onitan Final Season Part 4 Release Date Announced',
      description: 'The epic conclu:',
      link: 'https://example.com/aot',
      source: 'Sample Source',
    },
    {
      title: 'New Anime Series Announced for Summer 2025',
      description: 'Multiple studios have announced exciting new projects.',
      link: 'https://example.com/summer2025',
      source: 'Sample Source',
    },
    {
      title: 'Popular Manga Gets Anime Adaptation',
      description: 'A beloved manga series will be adapted into anime format.',
      link: 'https://example.com/manga-anime',
      source: 'Sample Source',
    },
  ];
}
