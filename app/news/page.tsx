import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const newsItems = [
  {
    id: 1,
    title: 'Attack on Titan Final Season Part 4 Release Date Announced',
    excerpt: 'The epic conclusion to the Attack on Titan saga finally has a confirmed release date.',
    date: '2025-03-01',
    readTime: '5 min read',
    category: 'Announcement',
    image: 'AOT',
  },
  {
    id: 2,
    title: 'New Studio Ghibli Film in Production',
    excerpt: 'Hayao Miyazaki is working on another project despite saying he would retire.',
    date: '2025-02-28',
    readTime: '3 min read',
    category: 'News',
    image: 'SG',
  },
  {
    id: 3,
    title: 'Jujutsu Kaisen Season 3 Confirmed',
    excerpt: 'The adaptation of the Culling Game arc is officially announced.',
    date: '2025-02-25',
    readTime: '4 min read',
    category: 'Announcement',
    image: 'JJK',
  },
  {
    id: 4,
    title: 'Crunchyroll Reveals Most Watched Anime of 2024',
    excerpt: 'The streaming giant releases their year-end statistics.',
    date: '2025-02-20',
    readTime: '6 min read',
    category: 'Industry',
    image: 'CR',
  },
  {
    id: 5,
    title: 'One Piece Manga Reaches Major Milestone',
    excerpt: 'Eiichiro Oda celebrates 27 years of the beloved series.',
    date: '2025-02-18',
    readTime: '4 min read',
    category: 'Manga',
    image: 'OP',
  },
];

export const metadata = {
  title: 'Anime News | AnimePulse',
  description: 'Latest anime news, announcements, and industry updates.',
};

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Latest Anime News</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Stay updated with the latest announcements, releases, and industry news.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured Article */}
          <div className="lg:col-span-2">
            <article className="bg-gray-800 rounded-2xl overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-6xl font-black text-white/20">{newsItems[0].image}</span>
              </div>
              <div className="p-8">
                <span className="text-indigo-400 text-sm font-semibold">{newsItems[0].category}</span>
                <h2 className="text-2xl font-bold text-white mt-2 mb-4">{newsItems[0].title}</h2>
                <p className="text-gray-400 mb-6">{newsItems[0].excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {newsItems[0].date}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {newsItems[0].readTime}
                    </span>
                  </div>
                  <Link href="#" className="text-indigo-400 hover:text-indigo-300 flex items-center">
                    Read More <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar - Trending */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Trending</h3>
            {newsItems.slice(1, 4).map((item) => (
              <div key={item.id} className="bg-gray-800 p-4 rounded-xl">
                <span className="text-indigo-400 text-xs font-semibold">{item.category}</span>
                <h4 className="text-white font-medium mt-1 mb-2">{item.title}</h4>
                <span className="text-gray-500 text-sm">{item.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* More News */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-8">More News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsItems.map((item) => (
              <article key={item.id} className="bg-gray-800 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-transform">
                <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
                  <span className="text-3xl font-black text-white/20">{item.image}</span>
                </div>
                <div className="p-6">
                  <span className="text-indigo-400 text-sm font-semibold">{item.category}</span>
                  <h3 className="text-white font-bold mt-2 mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{item.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {item.date}
                    </span>
                    <span>{item.readTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
