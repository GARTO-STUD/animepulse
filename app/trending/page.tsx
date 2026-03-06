'use client';

import { useState } from 'react';
import { TrendingUp, Star, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const trendingAnime = [
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

export default function TrendingPage() {
  const [activeCategory, setActiveCategory] = useState('All');

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
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-6 md:mb-0">
              <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold">#1 Trending</span>
              <h2 className="text-3xl font-bold text-white mt-4 mb-2">Solo Leveling</h2>
              <p className="text-white/80 mb-4">
                Follow the journey of Sung Jin-Woo, the weakest hunter who becomes the strongest.
              </p>
              <div className="flex items-center space-x-4">
                <span className="flex items-center text-yellow-300">
                  <Star className="w-5 h-5 mr-1" />
                  9.2
                </span>
                <span className="flex items-center text-white/80">
                  <Eye className="w-5 h-5 mr-1" />
                  2.5M views
                </span>
              </div>
            </div>
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl font-black text-white">
              SL
            </div>
          </div>
        </div>

        {/* Trending Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Top Ranked</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingAnime.map((anime, index) => (
              <div key={anime.id} className="bg-gray-800 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-transform">
                <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center relative">
                  <span className="absolute top-4 left-4 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </span>
                  <span className="text-4xl font-black text-white/20">{anime.title.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2">{anime.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{anime.genre}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-yellow-400 flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      {anime.rating}
                    </span>
                    <span className="text-gray-400">{anime.episodes} episodes</span>
                  </div>
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
