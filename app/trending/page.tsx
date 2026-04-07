'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Star, Calendar, RefreshCw } from 'lucide-react';

const WORKER_URL = 'https://animepulse.asac-spy10.workers.dev';

const fallbackTrending = [
  {
    id: 1,
    title: 'Solo Leveling',
    episodes: '24',
    rating: 9.2,
    views: '2.5M',
    studio: 'A-1 Pictures',
    genre: 'Action, Fantasy',
  },
  {
    id: 2,
    title: 'Frieren: Beyond Journey\'s End',
    episodes: '28',
    rating: 9.5,
    views: '1.8M',
    studio: 'Madhouse',
    genre: 'Adventure, Fantasy',
  },
  {
    id: 3,
    title: 'Jujutsu Kaisen',
    episodes: '48',
    rating: 8.9,
    views: '3.2M',
    studio: 'MAPPA',
    genre: 'Action, Supernatural',
  },
  {
    id: 4,
    title: 'Demon Slayer',
    episodes: '55',
    rating: 8.8,
    views: '4.1M',
    studio: 'ufotable',
    genre: 'Action, Historical',
  },
  {
    id: 5,
    title: 'Chainsaw Man',
    episodes: '12',
    rating: 8.7,
    views: '2.1M',
    studio: 'MAPPA',
    genre: 'Action, Horror',
  },
  {
    id: 6,
    title: 'Blue Lock',
    episodes: '24',
    rating: 8.6,
    views: '1.5M',
    studio: '8bit',
    genre: 'Sports, Drama',
  },
];

const categories = ['All', 'Action', 'Adventure', 'Fantasy', 'Slice of Life', 'Sports'];

interface TrendingData {
  anime: string[];
  updatedAt: string;
}

export default function TrendingPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [trendingData, setTrendingData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await fetch(`${WORKER_URL}/trending`);
        if (!response.ok) throw new Error('Failed to fetch trending data');
        const data = await response.json();
        setTrendingData(data);
      } catch (err) {
        setError('Unable to load real-time trending data');
        console.error('Trending fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrending();
  }, []);

  const displayList = trendingData?.anime || fallbackTrending.map(a => a.title);
  const updatedAt = trendingData?.updatedAt ? new Date(trendingData.updatedAt).toLocaleDateString() : 'Today';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 flex flex-col items-center justify-center">
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-400">Fetching latest trending anime...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-indigo-400 mr-3" />
            Trending Anime
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            The hottest anime series that everyone is talking about right now.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Trending */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-12 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center relative z-10">
            <div className="flex-1 mb-6 md:mb-0">
              <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">#1 Trending Now</span>
              <h2 className="text-4xl font-bold text-white mt-4 mb-2">{displayList[0]}</h2>
              <p className="text-white/80 mb-6 max-w-lg">
                Currently dominating the charts with record-breaking viewership and social engagement.
              </p>
              <div className="flex items-center space-x-6">
                <div className="flex flex-col">
                  <span className="text-white/60 text-xs uppercase font-bold tracking-wider">Update Date</span>
                  <span className="text-white font-medium flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {updatedAt}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white/60 text-xs uppercase font-bold tracking-wider">Status</span>
                  <span className="text-yellow-300 font-medium flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Top Airing
                  </span>
                </div>
              </div>
            </div>
            <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-5xl font-black text-white shadow-2xl">
              {displayList[0]?.slice(0, 2).toUpperCase()}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        </div>

        {/* Trending Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Top 8 Trending Series</h2>
            {error && <span className="text-yellow-500 text-sm">{error}</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayList.map((title: string, index: number) => (
              <div key={index} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-indigo-500/50 transition-all group">
                <div className="h-40 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center relative">
                  <span className="absolute top-3 left-3 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold shadow-lg">
                    {index + 1}
                  </span>
                  <span className="text-3xl font-black text-white/10 group-hover:text-white/20 transition-colors">
                    {title.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-white font-bold mb-1 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                    {title}
                  </h3>
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                    Rising in popularity
                  </div>
                  <button className="w-full py-2 bg-gray-700 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Views', value: '15M+' },
            { label: 'Top Rating', value: '9.5' },
            { label: 'Active Series', value: '48' },
            { label: 'Studios', value: '12' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-800 p-6 rounded-xl text-center">
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
