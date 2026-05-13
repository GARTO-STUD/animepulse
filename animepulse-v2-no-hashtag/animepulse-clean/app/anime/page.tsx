'use client';
/**
 * /anime — Anime browsing page (redirects to trending with full search)
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Star, TrendingUp } from 'lucide-react';

interface Anime {
  mal_id: number;
  title: string;
  score: number | null;
  episodes: number | null;
  genres: { name: string }[];
  images: { jpg: { large_image_url: string } };
  status: string;
  type: string;
}

export default function AnimePage() {
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [popular, setPopular] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Load popular anime on mount
  useEffect(() => {
    fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=12')
      .then(r => r.json())
      .then(d => setPopular(d.data || []))
      .catch(() => {});
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(false);
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=20`);
      const d   = await res.json();
      setResults(d.data || []);
    } catch { setResults([]); }
    finally { setLoading(false); setSearched(true); }
  }

  const display = searched ? results : popular;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f4] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-7 h-7 text-[#e85d04]" />
            <h1 className="text-3xl font-black text-[#0f172a]">Anime</h1>
          </div>
          <form onSubmit={handleSearch} className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search anime by title…"
              className="w-full bg-[#f8f9fc] border border-[#e2e8f4] focus:border-[#e85d04]/50 rounded-xl pl-12 pr-4 py-3 text-[#0f172a] placeholder-[#8892a4] focus:outline-none text-sm"
            />
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-white font-black text-lg mb-5 flex items-center gap-2">
          <div className="w-1 h-5 bg-[#e85d04] rounded-full" />
          {searched ? `Results for "${query}"` : 'Currently Airing'}
        </h2>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#e85d04] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-20 text-[#64748b]">
            <p className="font-bold text-[#0f172a] mb-1">No results found</p>
            <p className="text-sm">Try a different title</p>
          </div>
        )}

        {!loading && display.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {display.map(anime => (
              <Link key={anime.mal_id} href={`/anime/${anime.mal_id}`} className="anime-card group block">
                <div className="relative rounded-xl overflow-hidden bg-white border border-[#e2e8f4]">
                  <div className="relative h-52">
                    <Image
                      src={anime.images.jpg.large_image_url}
                      alt={anime.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                    {anime.score && (
                      <span className="absolute top-2 right-2 bg-black/70 text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded z-10 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-yellow-400" />{anime.score}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-[#0f172a] text-xs font-bold line-clamp-2 leading-snug">{anime.title}</h3>
                    <p className="text-[#64748b] text-[10px] mt-1">{anime.genres[0]?.name || anime.type || '—'}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
