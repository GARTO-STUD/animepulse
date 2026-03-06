'use client';

import Link from 'next/link';
import { Calendar, Clock, ArrowRight, Newspaper } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: string;
  source: string;
  tags: string[];
}

const WORKER_URL = 'https://animepulse.asac-spy10.workers.dev';

export default function NewsPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const response = await fetch(`${WORKER_URL}/news`);
        if (!response.ok) throw new Error('Failed to fetch news');
        const data = await response.json();
        setNewsItems(data.news || []);
      } catch (err) {
        setError('Unable to load news from server');
        console.error('News fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  // Fallback static data if Worker has no data
  const fallbackNews: NewsItem[] = [
    {
      id: '1',
      title: 'Attack on Titan Final Season Part 4 Release Date Announced',
      summary: 'The epic conclusion to the Attack on Titan saga finally has a confirmed release date.',
      content: 'The epic conclusion to the Attack on Titan saga finally has a confirmed release date. Fans have been waiting for this moment.',
      publishedAt: new Date().toISOString(),
      source: 'Crunchyroll News',
      tags: ['anime', 'announcement'],
    },
    {
      id: '2',
      title: 'Jujutsu Kaisen Season 3 Confirmed',
      summary: 'The adaptation of the Culling Game arc is officially announced.',
      content: 'Jujutsu Kaisen Season 3 has been confirmed, bringing excitement to fans worldwide.',
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      source: 'Anime News Network',
      tags: ['anime', 'announcement'],
    },
  ];

  const displayItems = newsItems.length > 0 ? newsItems : fallbackNews;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading latest anime news...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
            <Newspaper className="w-10 h-10 text-indigo-400 mr-3" />
            Anime News
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            The latest updates from the anime world, powered by AnimePulse Auto-Pilot
          </p>
          {error && (
            <div className="mt-4 text-yellow-500 text-sm">
              {error} • Showing cached content
            </div>
          )}
          {newsItems.length === 0 && !error && (
            <div className="mt-4 text-blue-400 text-sm">
              Auto-Pilot is running! News will appear here automatically.
            </div>
          )}
        </div>

        {/* Featured Article */}
        {displayItems[0] && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-12">
            <div className="flex flex-col md:flex-row items-center">
              <div className="flex-1 mb-6 md:mb-0">
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {displayItems[0].tags?.[0] || 'Featured'}
                </span>
                <h2 className="text-3xl font-bold text-white mt-4 mb-4">
                  {displayItems[0].title}
                </h2>
                <p className="text-white/80 mb-4">{displayItems[0].summary}</p>
                <div className="flex items-center text-white/70 text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(displayItems[0].publishedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center text-white text-3xl font-black">
                {displayItems[0].source?.slice(0, 2).toUpperCase() || 'AP'}
              </div>
            </div>
          </div>
        )}

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayItems.map((item) => (
            <article
              key={item.id}
              className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 transition-colors"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-indigo-400 text-sm font-semibold">
                    {item.source}
                  </span>
                  {item.tags?.[0] && (
                    <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                      {item.tags[0]}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 mb-4">{item.summary}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {'3 min read'}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 text-center">
          <p className="text-gray-400">
            Showing {displayItems.length} article{displayItems.length !== 1 ? 's' : ''}
            {newsItems.length > 0 && ' from Auto-Pilot'}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Updates every 6 hours • Powered by RSS & AI
          </p>
        </div>
      </div>
    </div>
  );
}
