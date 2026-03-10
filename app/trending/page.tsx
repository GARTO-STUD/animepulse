'use client';

import { useState } from 'react';
import { TrendingUp, Star, Eye } from 'lucide-react';

const trendingAnime = [
  {
    id: 1,
    title: 'Solo Leveling',
    episodes: '24',
    rating: 9.2,
    views: '2.5M',
    studio: 'A-1 Pictures',
    genre: 'Action, Fantasy',
    image: 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Frieren: Beyond Journey\'s End',
    episodes: '28',
    rating: 9.5,
    views: '1.8M',
    studio: 'Madhouse',
    genre: 'Adventure, Fantasy',
    image: 'https://images.unsplash.com/photo-1519638399535-1b036603ac77?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Jujutsu Kaisen',
    episodes: '48',
    rating: 8.9,
    views: '3.2M',
    studio: 'MAPPA',
    genre: 'Action, Supernatural',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 4,
    title: 'Demon Slayer',
    episodes: '55',
    rating: 8.8,
    views: '4.1M',
    studio: 'ufotable',
    genre: 'Action, Historical',
    image: 'https://images.unsplash.com/photo-1614583225154-5feade07339d?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 5,
    title: 'Chainsaw Man',
    episodes: '12',
    rating: 8.7,
    views: '2.1M',
    studio: 'MAPPA',
    genre: 'Action, Horror',
    image: 'https://images.unsplash.com/photo-1607604276483-bdfdd0cb2ada?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 6,
    title: 'Blue Lock',
    episodes: '24',
    rating: 8.6,
    views: '1.5M',
    studio: '8bit',
    genre: 'Sports, Drama',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop',
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
        <div className="relative overflow-hidden rounded-2xl mb-12 group border border-gray-700 bg-gray-800">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 relative h-64 md:h-auto overflow-hidden">
              <img
                src={trendingAnime[0].image}
                alt={trendingAnime[0].title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent md:hidden" />
            </div>
            <div className="md:w-2/3 p-8 md:p-12 flex flex-col justify-center">
              <div>
                <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold">#1 Trending</span>
              </div>
              <h2 className="text-4xl font-bold text-white mt-6 mb-4 group-hover:text-indigo-400 transition-colors">
                {trendingAnime[0].title}
              </h2>
              <p className="text-gray-400 text-lg mb-6 max-w-xl">
                Follow the journey of Sung Jin-Woo, the weakest hunter who becomes the strongest.
              </p>
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-yellow-400 font-bold text-lg">
                  <Star className="w-6 h-6 mr-2 fill-current" />
                  {trendingAnime[0].rating}
                </div>
                <div className="flex items-center text-gray-400 text-lg">
                  <Eye className="w-6 h-6 mr-2" />
                  {trendingAnime[0].views} views
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Top Ranked</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingAnime.map((anime, index) => (
              <div key={anime.id} className="bg-gray-800 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all border border-gray-700 group">
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={anime.image}
                    alt={anime.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  <span className="absolute top-4 left-4 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {index + 1}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2 group-hover:text-indigo-400 transition-colors">{anime.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{anime.genre}</p>
                  <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-700">
                    <span className="text-yellow-400 font-bold flex items-center">
                      <Star className="w-4 h-4 mr-1 fill-current" />
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
