// Server component wrapper — required for static export with dynamic routes
// generateStaticParams must live in a server component (not 'use client')
// The actual UI is in AnimeDetailClient.tsx (client component)

export const runtime = 'edge';

import AnimeDetailClient from './AnimeDetailClient';


export default function AnimeDetailPage() {
  return <AnimeDetailClient />;
}
