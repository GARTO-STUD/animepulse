/**
 * app/sitemap.ts — Dynamic XML sitemap
 * Includes static pages + all published articles + top anime pages
 */
import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animepulse.online';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL,                    lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${APP_URL}/news`,          lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${APP_URL}/trending`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${APP_URL}/anime`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${APP_URL}/calendar`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${APP_URL}/merch`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${APP_URL}/reviews`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${APP_URL}/top-10`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${APP_URL}/about-us`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${APP_URL}/contact-us`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${APP_URL}/privacy-policy`,lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  ];

  const results = await Promise.allSettled([
    // Fetch published articles
    fetch(`${APP_URL}/api/articles?limit=200&status=published`, { next: { revalidate: 3600 } })
      .then(r => r.ok ? r.json() : { articles: [] })
      .then(data =>
        (data.articles || []).map((a: { id: string; publishedAt: string; updatedAt?: string }) => ({
          url: `${APP_URL}/news/${a.id}`,
          lastModified: new Date(a.updatedAt || a.publishedAt),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
      ),

    // Static merch pages for top anime — high-value SEO long-tail keywords
    Promise.resolve(
      ['demon-slayer','one-piece','jujutsu-kaisen','attack-on-titan','my-hero-academia',
       'naruto','chainsaw-man','spy-x-family','dragon-ball','frieren','blue-lock','solo-leveling']
        .map(slug => ({
          url: `${APP_URL}/merch/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.65,
        }))
    ),
    fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=25', { next: { revalidate: 86400 } })
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d =>
        (d.data || []).map((a: { mal_id: number }) => ({
          url: `${APP_URL}/anime/${a.mal_id}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.6,
        }))
      ),
  ]);

  const extraRoutes = results
    .filter((r): r is PromiseFulfilledResult<MetadataRoute.Sitemap> => r.status === 'fulfilled')
    .flatMap(r => r.value);

  return [...staticRoutes, ...extraRoutes];
}

