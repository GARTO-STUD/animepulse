import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trending Anime 2026',
  description: 'Discover the hottest trending anime of 2026. Real-time rankings from MyAnimeList including currently airing, all-time top, and most popular anime series.',
  keywords: ['trending anime 2026', 'airing anime 2026', 'most popular anime', 'anime rankings live', 'what anime to watch 2026'],
  alternates: { canonical: '/trending' },
  openGraph: {
    title: 'Trending Anime 2026 | AnimePulse',
    description: 'Real-time anime rankings — currently airing, all-time top, and most popular.',
    type: 'website',
  },
};

export default function TrendingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
