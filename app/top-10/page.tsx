import { Trophy, Star, TrendingUp, Medal } from 'lucide-react';

const topAnime = [
  {
    rank: 1,
    title: 'Fullmetal Alchemist: Brotherhood',
    rating: 9.9,
    episodes: 64,
    studio: 'Bones',
    genre: 'Action, Adventure',
    reason: 'Perfect story, incredible character development, and a satisfying conclusion.',
  },
  {
    rank: 2,
    title: 'Steins;Gate',
    rating: 9.8,
    episodes: 24,
    studio: 'White Fox',
    genre: 'Sci-Fi, Thriller',
    reason: 'Masterpiece of time travel storytelling with unforgettable characters.',
  },
  {
    rank: 3,
    title: 'Attack on Titan',
    rating: 9.7,
    episodes: 94,
    studio: 'MAPPA / Wit Studio',
    genre: 'Action, Drama',
    reason: 'Epic storytelling with shocking twists and incredible world-building.',
  },
  {
    rank: 4,
    title: 'Death Note',
    rating: 9.6,
    episodes: 37,
    studio: 'Madhouse',
    genre: 'Psychological, Thriller',
    reason: 'The ultimate battle of wits between Light and L.',
  },
  {
    rank: 5,
    title: 'One Piece',
    rating: 9.5,
    episodes: '1100+',
    studio: 'Toei Animation',
    genre: 'Adventure, Shounen',
    reason: 'Unparalleled world-building and 27 years of epic storytelling.',
  },
  {
    rank: 6,
    title: 'Hunter x Hunter',
    rating: 9.4,
    episodes: 148,
    studio: 'Madhouse',
    genre: 'Adventure, Action',
    reason: 'Complex characters and the best power system in anime.',
  },
  {
    rank: 7,
    title: 'Vinland Saga',
    rating: 9.3,
    episodes: 48,
    studio: 'MAPPA',
    genre: 'Historical, Action',
    reason: 'Deep character study with incredible historical accuracy.',
  },
  {
    rank: 8,
    title: 'Demon Slayer',
    rating: 9.2,
    episodes: 55,
    studio: 'ufotable',
    genre: 'Action, Historical',
    reason: 'Stunning animation that set new standards for the industry.',
  },
  {
    rank: 9,
    title: 'Jujutsu Kaisen',
    rating: 9.1,
    episodes: 48,
    studio: 'MAPPA',
    genre: 'Action, Supernatural',
    reason: 'Modern shounen done right with incredible fight choreography.',
  },
  {
    rank: 10,
    title: 'Your Name',
    rating: 9.0,
    episodes: 'Movie',
    studio: 'CoMix Wave',
    genre: 'Romance, Drama',
    reason: 'Beautiful movie that captured the hearts of millions worldwide.',
  },
];

export const metadata = {
  title: 'Top 10 Anime | AnimePulse',
  description: 'The definitive ranking of the best anime of all time.',
};

export default function TopTenPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-12 h-12 text-yellow-400 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">Top 10 Anime</h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            The definitive ranking of the greatest anime of all time, carefully curated by our community.
          </p>
        </div>

        {/* Featured #1 */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border border-yellow-500/30 rounded-2xl p-8 mb-12">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Medal className="w-16 h-16 text-yellow-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">#1 Best Anime</h2>
            <h3 className="text-2xl text-yellow-400 font-bold mb-4">{topAnime[0].title}</h3>
            <p className="text-gray-300 mb-4 max-w-2xl mx-auto">{topAnime[0].reason}</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full">
                {topAnime[0].episodes} Episodes
              </span>
              <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full">
                Studio: {topAnime[0].studio}
              </span>
              <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full">
                {topAnime[0].genre}
              </span>
            </div>
          </div>
        </div>

        {/* Top 10 List */}
        <div className="space-y-4">
          {topAnime.map((anime) => (
            <div
              key={anime.rank}
              className={`flex flex-col md:flex-row gap-4 p-6 rounded-xl transition-all hover:transform hover:scale-[1.02] ${
                anime.rank === 1
                  ? 'bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border border-yellow-500/30'
                  : anime.rank <= 3
                  ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30'
                  : 'bg-gray-800 border border-gray-700'
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                    anime.rank === 1
                      ? 'bg-yellow-500 text-black'
                      : anime.rank === 2
                      ? 'bg-gray-400 text-black'
                      : anime.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  {anime.rank}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">{anime.title}</h3>
                  <div className="flex items-center text-yellow-400 mt-2 md:mt-0">
                    <Star className="w-5 h-5 mr-1 fill-yellow-400" />
                    <span className="font-bold">{anime.rating}</span>
                  </div>
                </div>
                <p className="text-gray-400 mb-3">{anime.reason}</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="text-gray-500">{anime.episodes} episodes</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-indigo-400">{anime.studio}</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-purple-400">{anime.genre}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Criteria */}
        <div className="mt-16 bg-gray-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Ranking Criteria</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-white font-bold mb-2">Rating</h3>
              <p className="text-gray-400 text-sm">Community and critic ratings</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white font-bold mb-2">Impact</h3>
              <p className="text-gray-400 text-sm">Cultural influence and legacy</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-white font-bold mb-2">Legacy</h3>
              <p className="text-gray-400 text-sm">Long-term influence on the industry</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}