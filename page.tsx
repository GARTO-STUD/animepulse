import { Star, User, ThumbsUp, Calendar } from 'lucide-react';

const reviews = [
  {
    id: 1,
    anime: 'Attack on Titan',
    rating: 5,
    reviewer: 'AnimeEnthusiast',
    date: '2025-02-15',
    content: 'A masterpiece that redefined anime storytelling. The character development and plot twists are incredible.',
    likes: 234,
    tags: ['Action', 'Drama', 'Masterpiece'],
  },
  {
    id: 2,
    anime: 'Death Note',
    rating: 5,
    reviewer: 'OtakuReviewer',
    date: '2025-02-12',
    content: 'The psychological battle between Light and L is unmatched. A classic that remains timeless.',
    likes: 189,
    tags: ['Thriller', 'Psychological', 'Classic'],
  },
  {
    id: 3,
    anime: 'One Piece',
    rating: 5,
    reviewer: 'PirateKing',
    date: '2025-02-10',
    content: '27 years of epic storytelling. The world-building is unmatched in anime history.',
    likes: 312,
    tags: ['Adventure', 'Shounen', 'Legendary'],
  },
  {
    id: 4,
    anime: 'Violet Evergarden',
    rating: 4,
    reviewer: 'BeautifulStories',
    date: '2025-02-08',
    content: 'Stunning visuals and emotional storytelling. Every episode is a work of art.',
    likes: 156,
    tags: ['Drama', 'Slice of Life', 'Beautiful'],
  },
  {
    id: 5,
    anime: 'Fullmetal Alchemist: Brotherhood',
    rating: 5,
    reviewer: 'EquivalentExchange',
    date: '2025-02-05',
    content: 'Perfect pacing, incredible story, satisfying ending. The gold standard for anime adaptations.',
    likes: 278,
    tags: ['Action', 'Adventure', 'Perfect'],
  },
  {
    id: 6,
    anime: 'Steins;Gate',
    rating: 5,
    reviewer: 'ElPsyCongroo',
    date: '2025-02-01',
    content: 'Mind-bending time travel plot that actually makes sense. An unforgettable experience.',
    likes: 201,
    tags: ['Sci-Fi', 'Thriller', 'Mind-Bending'],
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

export const metadata = {
  title: 'Anime Reviews | AnimePulse',
  description: 'In-depth reviews and ratings of your favorite anime series.',
};

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Anime Reviews</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Honest reviews from our community of anime enthusiasts.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="bg-gray-800 rounded-xl p-6 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-gray-400">Total Reviews</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">4.7</div>
              <div className="text-gray-400">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-gray-400">Community Members</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">New</div>
              <div className="text-gray-400">Daily Reviews</div>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{review.anime}</h3>
                  <div className="mt-2">
                    <StarRating rating={review.rating} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {review.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <p className="text-gray-400 mb-4">{review.content}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-gray-400">
                    <User className="w-4 h-4 mr-1" />
                    <span className="text-sm">{review.reviewer}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span className="text-sm">{review.date}</span>
                  </div>
                </div>
                <button className="flex items-center text-gray-400 hover:text-indigo-400 transition-colors">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">{review.likes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Review CTA */}
        <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Share Your Thoughts</h2>
          <p className="text-white/80 mb-6">
            Join our community and share your anime reviews with fellow fans.
          </p>
          <button className="px-8 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-gray-100 transition-colors">
            Write a Review
          </button>
        </div>
      </div>
    </div>
  );
}
