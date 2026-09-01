// Server component wrapper — required for static export with dynamic routes
// generateStaticParams must live in a server component (not 'use client')
// The actual UI is in NewsDetailClient.tsx (client component)

export const runtime = 'edge';

import NewsDetailClient from './NewsDetailClient';


export default function NewsDetailPage() {
  return <NewsDetailClient />;
}
