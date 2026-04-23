// Server component wrapper — required for static export with dynamic routes
// generateStaticParams must live in a server component (not 'use client')
// The actual UI is in NewsDetailClient.tsx (client component)

import NewsDetailClient from './NewsDetailClient';

// Returning [] means no pages are pre-rendered at build time.
// The client component fetches data at runtime via useEffect/useParams.
export function generateStaticParams() {
  return [];
}

export default function NewsDetailPage() {
  return <NewsDetailClient />;
}
