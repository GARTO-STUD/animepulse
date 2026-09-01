'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, Star, Newspaper, ChevronRight, Play } from 'lucide-react';

interface Anime {
  mal_id: number;
  title: string;
  score: number | null;
  members: number;
  episodes: number | null;
  synopsis: string | null;
  genres: { name: string }[];
  images: { jpg: { large_image_url: string; image_url: string } };
  aired: { string: string };
}


export default function HomePage() {
  const [trending, setTrending] = useState<Anime[]>([]);
  const [topAll, setTopAll] = useState<Anime[]>([]);
  const [seasonal, setSeasonal] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [t, top, s] = (await Promise.all([
          fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=6').then(r => r.json()),
          fetch('https://api.jikan.moe/v4/top/anime?limit=5').then(r => r.json()),
          fetch('https://api.jikan.moe/v4/seasons/now?limit=6').then(r => r.json()),
        ])) as [{ data?: Anime[] }, { data?: Anime[] }, { data?: Anime[] }];
        setTrending(t.data || []);
        setTopAll(top.data || []);
        setSeasonal(s.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const hero = trending[0];

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden min-h-[520px] flex items-end">
        {hero && (
          <div className="absolute inset-0">
            <Image
              src={hero.images.jpg.large_image_url}
              alt={hero.title}
              fill
              className="object-cover object-top opacity-30"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-[#080b14]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080b14]/80 to-transparent" />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-20 w-full">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge bg-[#e85d04] text-white">#1 TRENDING NOW</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-4">
              {hero ? (
                <>{hero.title}</>
              ) : (
                <>Your Ultimate<br /><span className="text-[#e85d04] glow-text">Anime</span> Hub</>
              )}
            </h1>
            {hero && (
              <p className="text-[#8892a4] text-lg mb-6 line-clamp-3 max-w-xl">
                {hero.synopsis}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {hero ? (
                <Link
                  href={`/anime/${hero.mal_id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#e85d04] hover:bg-[#f48c06] text-white font-bold rounded-xl transition-all glow-orange"
                >
                  <Play className="w-4 h-4 fill-white" /> View Details
                </Link>
              ) : null}
              <Link
                href="/trending"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#e85d04] hover:bg-[#f48c06] text-white font-bold rounded-xl transition-all glow-orange"
              >
                <Flame className="w-4 h-4" /> View Trending
              </Link>
              <Link
                href="/news"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/10 transition-all backdrop-blur-sm"
              >
                <Newspaper className="w-4 h-4" /> Latest News
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-[#1a2235] bg-[#0d1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Monthly Readers', value: '100K+', color: 'text-[#e85d04]' },
              { label: 'Anime Tracked', value: '25K+', color: 'text-blue-400' },
              { label: 'News Articles', value: '1K+', color: 'text-green-400' },
              { label: 'Reviews', value: '500+', color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="py-2">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-[#8892a4] text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRENDING NOW ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-[#e85d04] rounded-full" />
            <h2 className="section-title text-2xl text-white">Trending Now</h2>
          </div>
          <Link href="/trending" className="flex items-center gap-1 text-sm text-[#e85d04] hover:text-[#f48c06] font-semibold transition-colors">
            See All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#0d1117] rounded-xl h-64 animate-pulse border border-[#1a2235]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {trending.map((anime, i) => (
              <Link key={anime.mal_id} href={`/anime/${anime.mal_id}`} className="anime-card group block">
                <div className="relative rounded-xl overflow-hidden bg-[#0d1117] border border-[#1a2235]">
                  <div className="relative h-52 card-img-wrap">
                    <Image
                      src={anime.images.jpg.large_image_url}
                      alt={anime.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <span className="absolute top-2 left-2 w-6 h-6 bg-[#e85d04] rounded-full flex items-center justify-center text-white text-xs font-black z-10">
                      {i + 1}
                    </span>
                    {anime.score && (
                      <span className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-black/70 text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded z-10">
                        <Star className="w-3 h-3 fill-yellow-400" />{anime.score}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-white text-xs font-bold line-clamp-2 leading-snug">{anime.title}</h3>
                    <p className="text-[#8892a4] text-xs mt-1">{anime.genres[0]?.name || 'Anime'}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── THIS SEASON ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-blue-500 rounded-full" />
            <h2 className="section-title text-2xl text-white">This Season</h2>
          </div>
          <Link href="/trending" className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            See All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {seasonal.slice(0, 6).map((anime) => (
              <Link key={anime.mal_id} href={`/anime/${anime.mal_id}`} className="anime-card group flex gap-4 bg-[#0d1117] border border-[#1a2235] rounded-xl p-4">
                <div className="relative w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image src={anime.images.jpg.image_url} alt={anime.title} fill className="object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white text-sm font-bold line-clamp-2 mb-1">{anime.title}</h3>
                  <p className="text-[#8892a4] text-xs mb-2">{anime.genres.slice(0, 2).map(g => g.name).join(' · ')}</p>
                  <div className="flex items-center gap-3 text-xs">
                    {anime.score && (
                      <span className="flex items-center gap-0.5 text-yellow-400 font-semibold">
                        <Star className="w-3 h-3 fill-yellow-400" />{anime.score}
                      </span>
                    )}
                    <span className="text-[#8892a4]">{anime.episodes ? `${anime.episodes} eps` : 'Ongoing'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── ALL TIME TOP 5 ── */}
      <section className="bg-[#0d1117] border-y border-[#1a2235] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 bg-yellow-500 rounded-full" />
              <h2 className="section-title text-2xl text-white">All-Time Best</h2>
            </div>
            <Link href="/top-10" className="flex items-center gap-1 text-sm text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">
              Full Top 10 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {!loading && (
            <div className="space-y-3">
              {topAll.slice(0, 5).map((anime, i) => (
                <Link key={anime.mal_id} href={`/anime/${anime.mal_id}`} className="anime-card flex items-center gap-4 bg-[#080b14] border border-[#1a2235] rounded-xl p-4 group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-500 text-black' :
                    i === 1 ? 'bg-gray-400 text-black' :
                    i === 2 ? 'bg-amber-700 text-white' :
                    'bg-[#1a2235] text-[#8892a4]'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="relative w-10 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={anime.images.jpg.image_url} alt={anime.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm group-hover:text-[#e85d04] transition-colors line-clamp-1">{anime.title}</h3>
                    <p className="text-[#8892a4] text-xs mt-0.5">{anime.genres.slice(0, 2).map(g => g.name).join(' · ')}</p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400 font-black text-sm flex-shrink-0">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    {anime.score || '—'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
