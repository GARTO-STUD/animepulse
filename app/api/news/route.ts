/**
 * News API Route
 * Fetches news from Cloudflare Worker or KV
 */

import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Worker URL - update this after deploying
const WORKER_URL = process.env.WORKER_URL || 'https://animepulse.your-account.workers.dev';

export async function GET() {
  try {
    // Try to fetch from Worker first
    const response = await fetch(`${WORKER_URL}/news`, {
      cf: { cacheTtl: 300 }, // Cache for 5 minutes
    });
    
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.log('Worker fetch failed, using fallback:', error);
  }
  
  // Fallback: Return static news
  const fallbackNews = [
    {
      id: '1',
      title: 'Attack on Titan Final Season Part 4 Release Date Announced',
      content: 'The epic conclusion to the Attack on Titan saga finally has a confirmed release date for 2025.',
      summary: 'The epic conclusion to the Attack on Titan saga finally has a confirmed release date.',
      source: 'Crunchyroll News',
      url: 'https://animepulse.vercel.app/news',
      publishedAt: new Date().toISOString(),
      tags: ['anime', 'announcement'],
      postedToTelegram: true,
    },
    {
      id: '2',
      title: 'Jujutsu Kaisen Season 3 Confirmed',
      content: 'The adaptation of the Culling Game arc has been officially announced for 2026.',
      summary: 'The Culling Game arc will be adapted in 2026.',
      source: 'Anime News Network',
      url: 'https://animepulse.vercel.app/news',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      tags: ['anime', 'announcement'],
      postedToTelegram: true,
    },
  ];
  
  return NextResponse.json({ news: fallbackNews, total: fallbackNews.length });
}
