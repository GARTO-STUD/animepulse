/**
 * app/merch/[anime]/layout.tsx — SEO metadata for merch pages
 */
import type { Metadata } from 'next';

export const runtime = 'edge';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animepulse.online';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ anime: string }>;
}): Promise<Metadata> {
  const { anime } = await params;
  const title = decodeURIComponent(anime).replace(/-/g, ' ');
  const displayTitle = title
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    title: `${displayTitle} Merch, Manga & Blu-ray | AnimePulse Shop`,
    description: `Buy official ${displayTitle} merchandise, manga volumes, Blu-ray sets, and collectible figures. Best deals on Amazon and RightStuf.`,
    keywords: [
      `${displayTitle} merchandise`, `${displayTitle} manga buy`, `${displayTitle} blu-ray`,
      `${displayTitle} figures`, `${displayTitle} nendoroid`, `${displayTitle} merch`,
      `buy ${displayTitle} anime`, `${displayTitle} official shop`, 'anime merchandise',
    ],
    alternates: { canonical: `${BASE_URL}/merch/${anime}` },
    openGraph: {
      title: `${displayTitle} — Merch, Manga & Collectibles`,
      description: `Find the best deals on ${displayTitle} manga, Blu-ray, figures, and official merchandise.`,
      url: `${BASE_URL}/merch/${anime}`,
      siteName: 'AnimePulse',
      images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayTitle} — Merch, Manga & Collectibles | AnimePulse`,
      description: `Find the best deals on ${displayTitle} manga, Blu-ray, figures, and official merchandise.`,
    },
  };
}

export default function MerchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
