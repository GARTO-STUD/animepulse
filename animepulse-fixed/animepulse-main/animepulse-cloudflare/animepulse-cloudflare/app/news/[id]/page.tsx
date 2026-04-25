// Server component wrapper
// The actual UI is in NewsDetailClient.tsx (client component)

import NewsDetailClient from './NewsDetailClient';

export const runtime = 'edge';

export default function NewsDetailPage() {
  return <NewsDetailClient />;
}
