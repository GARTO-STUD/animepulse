// Server component wrapper
// The actual UI is in AnimeDetailClient.tsx (client component)

import AnimeDetailClient from './AnimeDetailClient';

export const runtime = 'edge';

export default function AnimeDetailPage() {
  return <AnimeDetailClient />;
}
