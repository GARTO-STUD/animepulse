'use client';

import { Calendar, Newspaper } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: string;
  source: string;
  tags: string[];
  imageUrl?: string;
  url?: string;
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
          <div className="bg-gray-800 rounded-2xl overflow-hidden mb-12 border border-gray-700">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 h-64 md:h-auto relative">
                {displayItems[0].imageUrl ? (
                  <img
                    src={displayItems[0].imageUrl}
                    alt={displayItems[0].title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
                    <Newspaper className="w-20 h-20 text-white/20" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                    {displayItems[0].tags?.[0] || 'Featured'}
                  </span>
                </div>
              </div>
              <div className="md:w-1/2 p-8 flex flex-col justify-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  {displayItems[0].title}
                </h2>
                <p className="text-gray-300 mb-6 line-clamp-3">{displayItems[0].summary}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center text-gray-400 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(displayItems[0].publishedAt).toLocaleDateString()}
                    <span className="mx-2">•</span>
                    <span className="text-indigo-400 font-semibold">{displayItems[0].source}</span>
                  </div>
                  {displayItems[0].url && (
                    <a
                      href={displayItems[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      Read Full Story →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayItems.map((item) => (
            <article
              key={item.id}
              className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-indigo-500/50 transition-all group"
            >
              <div className="h-48 relative overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <Newspaper className="w-12 h-12 text-gray-600" />
                  </div>
                )}
              </div>
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
                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 mb-4 line-clamp-2 text-sm">{item.summary}</p>
                <div className="flex items-center justify-between text-sm mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Source →
                    </a>
                  )}
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
