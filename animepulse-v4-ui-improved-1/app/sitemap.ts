/**
 * app/sitemap.ts — Dynamic XML sitemap
 * Auto-updates with every new article, blog post, anime page, and seasonal content.
 * Revalidated by Next.js ISR (1-hour cache on article/seasonal lists).
 */
import { MetadataRoute } from 'next';

export const revalidate = 3600; // rebuild sitemap at most once per hour

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animepulse.online';

/** Static blog posts (matches the POSTS map in app/blog/[slug]/page.tsx) */
const BLOG_SLUGS = [
  'best-anime-2024',
  'beginner-anime-guide',
  'top-isekai-anime-all-time',
  'shonen-vs-seinen',
  'one-piece-explained',
  'anime-streaming-guide-2025',
];

/** Top merch pages — high-value SEO long-tail keywords */
const MERCH_SLUGS = [
  'demon-slayer','one-piece','jujutsu-kaisen','attack-on-titan','my-hero-academia',
  'naruto','chainsaw-man','spy-x-family','dragon-ball','frieren','blue-lock','solo-leveling',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* ── Static core pages ─────────────────────────────────────────────── */
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL,                       lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${APP_URL}/news`,             lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${APP_URL}/seasonal`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${APP_URL}/trailers`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.85 },
    { url: `${APP_URL}/trending`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${APP_URL}/anime`,            lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${APP_URL}/calendar`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${APP_URL}/blog`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.75 },
    { url: `${APP_URL}/merch`,            lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${APP_URL}/reviews`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${APP_URL}/top-10`,           lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${APP_URL}/about-us`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${APP_URL}/contact-us`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${APP_URL}/privacy-policy`,   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${APP_URL}/terms-of-service`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  ];

  /* ── Static blog post pages ─────────────────────────────────────────── */
  const blogRoutes: MetadataRoute.Sitemap = BLOG_SLUGS.map(slug => ({
    url:             `${APP_URL}/blog/${slug}`,
    lastModified:    new Date(),
    changeFrequency: 'monthly' as const,
    priority:        0.65,
  }));

  /* ── Static merch pages ─────────────────────────────────────────────── */
  const merchRoutes: MetadataRoute.Sitemap = MERCH_SLUGS.map(slug => ({
    url:             `${APP_URL}/merch/${slug}`,
    lastModified:    new Date(),
    changeFrequency: 'weekly' as const,
    priority:        0.65,
  }));

  /* ── Dynamic routes (fetched in parallel, failures tolerated) ────────── */
  const results = await Promise.allSettled([

    /* Published news articles from Firestore */
    fetch(`${APP_URL}/api/articles?limit=500&status=published`, {
      next: { revalidate: 3600 },
    })
      .then(r => r.ok ? r.json() : { articles: [] })
      .then((data: { articles?: Array<{ id: string; publishedAt: string; updatedAt?: string }> }) =>
        (data.articles || []).map(a => ({
          url:             `${APP_URL}/news/${a.id}`,
          lastModified:    new Date(a.updatedAt || a.publishedAt),
          changeFrequency: 'weekly' as const,
          priority:        0.75,
        }))
      ),

    /* Currently airing anime from Jikan — /anime/[id] detail pages */
    fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=25', {
      next: { revalidate: 86400 },
    })
      .then(r => r.ok ? r.json() : { data: [] })
      .then((d: { data?: Array<{ mal_id: number }> }) =>
        (d.data || []).map(a => ({
          url:             `${APP_URL}/anime/${a.mal_id}`,
          lastModified:    new Date(),
          changeFrequency: 'daily' as const,
          priority:        0.65,
        }))
      ),

    /* Seasonal anime — current season from Jikan */
    fetch('https://api.jikan.moe/v4/seasons/now?limit=25', {
      next: { revalidate: 86400 },
    })
      .then(r => r.ok ? r.json() : { data: [] })
      .then((d: { data?: Array<{ mal_id: number }> }) =>
        (d.data || []).map(a => ({
          url:             `${APP_URL}/anime/${a.mal_id}`,
          lastModified:    new Date(),
          changeFrequency: 'weekly' as const,
          priority:        0.6,
        }))
      ),

  ]);

  const dynamicRoutes = results
    .filter((r): r is PromiseFulfilledResult<MetadataRoute.Sitemap> => r.status === 'fulfilled')
    .flatMap(r => r.value);

  /* Deduplicate by URL (seasonal + airing lists can overlap) */
  const seen   = new Set<string>();
  const deduped: MetadataRoute.Sitemap = [];
  for (const entry of [...staticRoutes, ...blogRoutes, ...merchRoutes, ...dynamicRoutes]) {
    if (!seen.has(entry.url)) {
      seen.add(entry.url);
      deduped.push(entry);
    }
  }

  return deduped;
}

