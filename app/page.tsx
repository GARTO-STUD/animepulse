import Link from 'next/link';
import { TrendingUp, Newspaper, Star, Play } from 'lucide-react';

const features = [
  {
    icon: Newspaper,
    title: 'Latest News',
    description: 'Stay updated with breaking anime news and announcements.',
    href: '/news',
  },
  {
    icon: TrendingUp,
    title: 'Trending Shows',
    description: 'Discover what\'s hot in the anime community right now.',
    href: '/trending',
  },
  {
    icon: Star,
    title: 'Reviews',
    description: 'In-depth reviews and ratings from our expert team.',
    href: '/reviews',
  },
];

const trendingAnime = [
  {
    title: 'Attack on Titan',
    rating: 9.8,
    status: 'Completed',
    image: 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=1000&auto=format&fit=crop'
  },
  {
    title: 'Jujutsu Kaisen',
    rating: 9.6,
    status: 'Ongoing',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1000&auto=format&fit=crop'
  },
  {
    title: 'Demon Slayer',
    rating: 9.5,
    status: 'Ongoing',
    image: 'https://images.unsplash.com/photo-1614583225154-5feade07339d?q=80&w=1000&auto=format&fit=crop'
  },
  {
    title: 'One Piece',
    rating: 9.7,
    status: 'Ongoing',
    image: 'https://images.unsplash.com/photo-1607604276483-bdfdd0cb2ada?q=80&w=1000&auto=format&fit=crop'
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-black py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6">
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Your Anime Journey
            </span>
            <br />
            <span className="text-white">Starts Here</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Discover the latest anime news, trending shows, expert reviews, and top rankings 
            all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/trending"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              <Play className="w-5 h-5 mr-2" />
              Explore Trending
            </Link>
            <Link
              href="/news"
              className="inline-flex items-center justify-center px-8 py-4 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-all"
            >
              <Newspaper className="w-5 h-5 mr-2" />
              Latest News
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group p-8 bg-gray-900 rounded-2xl border border-gray-800 hover:border-indigo-500/50 transition-all hover:transform hover:scale-105"
                >
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/30 transition-colors">
                    <Icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Trending Now</h2>
            <Link
              href="/trending"
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingAnime.map((anime) => (
              <Link
                href="/trending"
                key={anime.title}
                className="bg-gray-800 rounded-xl overflow-hidden group cursor-pointer border border-gray-700 hover:border-indigo-500/50 transition-all hover:-translate-y-2"
              >
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={anime.image}
                    alt={anime.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors">{anime.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-400 font-bold flex items-center">
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      {anime.rating}
                    </span>
                    <span className="text-sm text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                      {anime.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Stay in the Loop
          </h2>
          <p className="text-gray-400 mb-8">
            Subscribe to our newsletter for weekly anime updates and exclusive content.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
