import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://animepulse.online';

export const metadata: Metadata = {
  title: `Anime Calendar ${new Date().getFullYear()} — Episode Schedule & Release Dates | AnimePulse`,
  description:
    `Full anime airing calendar for ${new Date().getFullYear()}. Track episode release dates, new seasons, premieres, and finales. Updated daily from MyAnimeList.`,
  keywords: [
    `anime calendar ${new Date().getFullYear()}`, `anime schedule ${new Date().getFullYear()}`, 'anime release dates',
    'new anime episodes', 'anime premiere dates', 'seasonal anime calendar',
    `spring ${new Date().getFullYear()} anime`, `summer ${new Date().getFullYear()} anime`,
    `fall ${new Date().getFullYear()} anime`, `winter ${new Date().getFullYear()} anime`,
    'animepulse calendar', 'anime airing schedule', 'when does anime air',
  ],
  alternates: { canonical: `${APP_URL}/calendar` },
  openGraph: {
    title: 'Anime Calendar 2026 — Episode Schedule & Release Dates',
    description: 'Track every anime premiere, episode release, and season finale. Updated daily.',
    url: `${APP_URL}/calendar`,
    siteName: 'AnimePulse',
    images: [{ url: `${APP_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'AnimePulse Anime Calendar 2026' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anime Calendar 2026 — Episode Schedule & Release Dates',
    description: 'Track every anime premiere, episode release, and season finale. Updated daily.',
    images: [`${APP_URL}/og-image.jpg`],
  },
};

// JSON-LD: Event series schema for Google rich results
const calendarSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Anime Calendar 2026',
  description: 'Full anime airing schedule and episode release dates for 2026.',
  url: `${APP_URL}/calendar`,
  publisher: {
    '@type': 'Organization',
    name: 'AnimePulse',
    url: APP_URL,
    logo: { '@type': 'ImageObject', url: `${APP_URL}/logo.png` },
  },
  mainEntity: {
    '@type': 'ItemList',
    name: 'Currently Airing Anime 2026',
    description: 'List of anime currently airing in 2026 with episode schedules.',
    url: `${APP_URL}/calendar`,
  },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(calendarSchema) }}
      />
      {children}
    </>
  );
}
