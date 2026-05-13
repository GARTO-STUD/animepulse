/**
 * GET /feed.xml — RSS 2.0 feed for AnimePulse articles
 */
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { getFirebaseToken, fsQuery, fsVal } from '@/lib/firebase-rest';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animepulse.online';

function escapeXml(str: string): string {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

export async function GET() {
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  let articles: Record<string, unknown>[] = [];

  if (saJson) {
    try {
      const sa = JSON.parse(saJson);
      const token = await getFirebaseToken(saJson);
      const rows = await fsQuery(sa.project_id, token, 'articles', 50);
      articles = rows
        .filter(a => !a.status || a.status === 'published')
        .slice(0, 20);
    } catch { /* fallback to empty */ }
  }

  const items = articles.map(a => {
    const title   = escapeXml(String(a.title   || ''));
    const summary = escapeXml(String(a.summary  || ''));
    const url     = `${APP_URL}/news/${a.id}`;
    const date    = new Date(String(a.publishedAt || Date.now())).toUTCString();
    const image   = a.imageUrl
      ? `<media:content url="${escapeXml(String(a.imageUrl))}" medium="image"/>`
      : '';
    const tags    = (Array.isArray(a.tags) ? a.tags as string[] : [])
      .map(t => `<category>${escapeXml(t)}</category>`).join('');

    return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <description>${summary}</description>
      <pubDate>${date}</pubDate>
      <guid isPermaLink="true">${url}</guid>
      ${tags}
      ${image}
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>AnimePulse — Anime News &amp; Rankings</title>
    <link>${APP_URL}</link>
    <description>AI-powered anime news, trending rankings, and reviews updated daily.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${APP_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${APP_URL}/og-image.jpg</url>
      <title>AnimePulse</title>
      <link>${APP_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, stale-while-revalidate=600',
    },
  });
}
