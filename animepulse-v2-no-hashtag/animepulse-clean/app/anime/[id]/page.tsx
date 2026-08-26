// Server component wrapper for /anime/[id]
import type { Metadata } from 'next';
import AnimeDetailClient from './AnimeDetailClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animepulse.online';

interface JikanAnime {
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  synopsis: string | null;
  score: number | null;
  scored_by: number | null;
  images: { jpg: { large_image_url: string } };
  genres: { name: string }[];
  studios: { name: string }[];
  episodes: number | null;
  status: string;
  aired: { from: string | null; to: string | null };
  trailer: { youtube_id: string | null };
  type: string;
  rating: string | null;
}

async function fetchAnime(id: string): Promise<JikanAnime | null> {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const anime = await fetchAnime(id);
  if (!anime) return { title: 'Anime | AnimePulse' };

  const title = `${anime.title_english || anime.title} | AnimePulse`;
  const description = anime.synopsis?.slice(0, 160) || `Watch ${anime.title} on AnimePulse`;
  const image = anime.images?.jpg?.large_image_url || `${BASE_URL}/og-image.jpg`;
  const genres: string[] = (anime.genres || []).map((g: { name: string }) => g.name);
  const keywords = [
    anime.title,
    anime.title_english,
    anime.title_japanese,
    ...genres,
    'anime', 'watch anime', 'AnimePulse',
    anime.status === 'Currently Airing' ? `airing anime ${new Date().getFullYear()}` : null,
  ].filter(Boolean).join(', ');

  return {
    title,
    description,
    keywords,
    openGraph: {
      title, description,
      url: `${BASE_URL}/anime/${id}`,
      siteName: 'AnimePulse',
      images: [{ url: image, width: 1200, height: 630, alt: anime.title }],
      type: 'video.tv_show',
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    alternates: { canonical: `${BASE_URL}/anime/${id}` },
  };
}

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const anime = await fetchAnime(id);

  // TVSeries JSON-LD — unlocks Google Knowledge Panel & rich results
  const tvSeriesSchema = anime ? {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: anime.title_english || anime.title,
    alternateName: [anime.title, anime.title_japanese].filter(Boolean),
    description: anime.synopsis?.slice(0, 300) || '',
    image: anime.images?.jpg?.large_image_url,
    url: `${BASE_URL}/anime/${id}`,
    genre: anime.genres?.map((g: { name: string }) => g.name) || [],
    numberOfEpisodes: anime.episodes || undefined,
    productionCompany: (anime.studios || []).map((s: { name: string }) => ({
      '@type': 'Organization',
      name: s.name,
    })),
    aggregateRating: anime.score
      ? {
          '@type': 'AggregateRating',
          ratingValue: anime.score,
          bestRating: 10,
          ratingCount: anime.scored_by || 1,
        }
      : undefined,
    datePublished: anime.aired?.from || undefined,
    dateModified: anime.aired?.to || undefined,
    inLanguage: 'ja',
    contentRating: anime.rating || undefined,
    // Trailer embed if available
    ...(anime.trailer?.youtube_id
      ? {
          trailer: {
            '@type': 'VideoObject',
            name: `${anime.title_english || anime.title} Official Trailer`,
            embedUrl: `https://www.youtube.com/embed/${anime.trailer.youtube_id}`,
            thumbnailUrl: `https://img.youtube.com/vi/${anime.trailer.youtube_id}/maxresdefault.jpg`,
          },
        }
      : {}),
  } : null;

  // BreadcrumbList for richer SERP display
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',  item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Anime', item: `${BASE_URL}/anime` },
      { '@type': 'ListItem', position: 3, name: anime?.title_english || anime?.title || 'Anime Detail', item: `${BASE_URL}/anime/${id}` },
    ],
  };

  return (
    <>
      {tvSeriesSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(tvSeriesSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <AnimeDetailClient />
    </>
  );
}

