import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anime Trailers — Watch Any Anime Trailer',
  description:
    'Watch official trailers for any anime — current season, all-time classics, upcoming titles. Search by name and watch instantly.',
  keywords: [
    'anime trailers', 'anime trailer 2026', 'watch anime trailer',
    'seasonal anime trailer', 'upcoming anime', 'anime PV',
    'anime promotional video', 'new anime trailer',
  ],
  alternates: { canonical: '/trailers' },
  openGraph: {
    title: 'Anime Trailers | AnimePulse',
    description: 'Official trailers for any anime — search, browse, and watch instantly.',
    type: 'website',
  },
};

export default function TrailersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
