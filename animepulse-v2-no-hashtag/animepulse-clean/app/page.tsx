'use client';

/**
 * app/page.tsx — AnimePulse Homepage
 * Fixed: broken ternary in hero section
 * Added: trailer support for trending anime cards
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Flame, TrendingUp, Star, Newspaper,
  ChevronRight, Zap, Users, Play,
} from 'lucide-react';
import ArticleCard, { type ArticleCardData } from '@/components/ArticleCard';
import AdBanner from '@/components/AdBanner';
import { ArticleCardSkeletonGrid } from '@/components/Skeleton';
import TrailerModal from '@/components/TrailerModal';

interface Anime {
  mal_id: number;
  title: string;
  score: number | null;
  images: { jpg: { large_image_url: string; image_url: string } };
  genres?: { name: string }[];
  trailer?: { youtube_id: string | null };
}

function SectionHeader({
  icon: Icon,
  title,
  href,
  accentColor = 'text-[#e85d04]',
}: {
  icon: React.ElementType;
  title: string;
  href?: string;
  accentColor?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center">
          <Icon className={`w-4 h-4 ${accentColor}`} />
        </div>
        <h2
          className="text-white font-black text-xl"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className={`flex items-center gap-1 text-sm font-medium ${accentColor} hover:opacity-80 transition-opacity`}
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

/** Small play button overlay for anime cards */
function AnimeTrailerButton({ anime }: { anime: Anime }) {
  const [open, setOpen] = useState(false);
  if (!anime.trailer?.youtube_id) return null;
  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all shadow-lg"
        aria-label={`Watch ${anime.title} trailer`}
      >
        <Play className="w-2.5 h-2.5 fill-white" /> Trailer
      </button>
      <TrailerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        youtubeId={anime.trailer.youtube_id}
        title={anime.title}
      />
    </>
  );
}

export default function HomePage() {
  const [trending,  setTrending]  = useState<Anime[]>([]);
  const [articles,  setArticles]  = useState<ArticleCardData[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [animeRes, articlesRes] = await Promise.all([
          fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=6').catch(() => null),
          fetch('/api/articles?limit=16&status=published'),
        ]);
        if (animeRes?.ok) {
          const d = await animeRes.json();
          setTrending(d.data || []);
        }
        const articlesData = await articlesRes.json();
        setArticles(articlesData.articles || []);
      } catch { /* data load failed silently */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const heroArticle   = articles[0];
  const breakingNews  = articles.slice(1, 4);
  const editorPicks   = articles.filter(a => (a.qualityScore || 0) >= 70).slice(0, 3);
  const latestArticles = articles.slice(4, 13);

  return (
    <div className="min-h-screen bg-[#f8f9fc]">

      {/* ── HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[500px] sm:min-h-[600px] flex items-end">
        {/* Background — trending anime image */}
        {trending[0] && (
          <div className="absolute inset-0">
            <Image
              src={trending[0].images.jpg.large_image_url}
              alt={trending[0].title}
              fill
              className="object-cover object-top opacity-20"
              priority
              unoptimized
            />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-[#080b14]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080b14] via-[#080b14]/50 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-20 w-full">
          <div className="max-w-2xl">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 mb-5">
              <span className="w-2 h-2 rounded-full bg-[#e85d04] animate-pulse" />
              <span className="text-xs font-bold text-[#e85d04] uppercase tracking-wide">
                Breaking Anime News
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-10 bg-[#e2e8f4] rounded-xl w-3/4 animate-pulse" />
                <div className="h-5 bg-[#e2e8f4] rounded-xl w-full animate-pulse" />
                <div className="h-5 bg-[#e2e8f4] rounded-xl w-2/3 animate-pulse" />
              </div>
            ) : heroArticle ? (
              <>
                {heroArticle.verdict && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e85d04]/15 border border-[#e85d04]/25 text-[#e85d04] text-sm font-bold mb-3">
                    <Flame className="w-3.5 h-3.5" />
                    {heroArticle.verdict}
                  </div>
                )}
                <h1
                  className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f172a] leading-tight mb-4"
                  style={{ fontFamily: 'var(--font-syne)' }}
                >
                  {heroArticle.title}
                </h1>
                <p className="text-[#c8d0de] text-lg leading-relaxed mb-6 line-clamp-2">
                  {heroArticle.summary}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={`/news/${heroArticle.id}`}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e85d04] to-[#f48c06] hover:opacity-90 text-[#0f172a] font-bold rounded-xl transition-opacity shadow-lg shadow-orange-500/20"
                  >
                    Read Story <ChevronRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/news"
                    className="flex items-center gap-2 px-6 py-3 bg-[#f1f5f9] hover:bg-white/10 border border-white/10 text-[#0f172a] font-medium rounded-xl transition-colors"
                  >
                    All News
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-4xl sm:text-5xl font-black text-[#0f172a] leading-tight mb-4" style={{ fontFamily: 'var(--font-syne)' }}>
                  Your Pulse on<br />
                  <span className="text-[#e85d04]">Anime News</span>
                </h1>
                <p className="text-[#c8d0de] text-lg mb-6">
                  AI-curated anime news, trending shows, and editorial analysis — daily.
                </p>
                <Link href="/news" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#e85d04] to-[#f48c06] text-[#0f172a] font-bold rounded-xl shadow-lg shadow-orange-500/20">
                  Read News <ChevronRight className="w-5 h-5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">

        {/* ── BREAKING NEWS ─────────────────────────────────────────────── */}
        {breakingNews.length > 0 && (
          <section>
            <SectionHeader icon={Zap} title="Breaking News" href="/news" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {breakingNews.map(a => (
                <ArticleCard key={a.id} article={a} variant="horizontal" />
              ))}
            </div>
          </section>
        )}

        {/* ── TOP AD ────────────────────────────────────────────────────── */}
        <AdBanner format="horizontal" />

        {/* ── TRENDING ANIME ────────────────────────────────────────────── */}
        {trending.length > 0 && (
          <section>
            <SectionHeader icon={TrendingUp} title="Trending Now" href="/trending" accentColor="text-purple-400" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {trending.slice(0, 6).map((anime, i) => (
                <Link
                  key={anime.mal_id}
                  href={`/anime/${anime.mal_id}`}
                  className="group relative rounded-2xl overflow-hidden bg-white border border-[#e2e8f4] hover:border-purple-500/30 transition-all block"
                >
                  <div className="relative h-44">
                    <Image
                      src={anime.images.jpg.large_image_url}
                      alt={anime.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] to-transparent" />
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#e85d04] flex items-center justify-center text-[#0f172a] text-xs font-black z-10">
                      {i + 1}
                    </div>
                    {anime.score && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-full z-10">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-xs font-bold">{anime.score}</span>
                      </div>
                    )}
                    {/* Trailer button per anime */}
                    <AnimeTrailerButton anime={anime} />
                  </div>
                  <div className="p-3">
                    <p className="text-white text-xs font-bold line-clamp-2 leading-snug">
                      {anime.title}
                    </p>
                    {anime.genres?.[0] && (
                      <p className="text-[#64748b] text-[10px] mt-1">{anime.genres[0].name}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── MAIN CONTENT + SIDEBAR ─────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Left: Latest News Grid */}
          <div className="flex-1">
            <SectionHeader icon={Newspaper} title="Latest News" href="/news" />

            {loading ? (
              <ArticleCardSkeletonGrid count={4} />
            ) : latestArticles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  {latestArticles.map(a => (
                    <ArticleCard key={a.id} article={a} variant="default" />
                  ))}
                </div>
                <div className="text-center">
                  <Link
                    href="/news"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[#e2e8f4] hover:border-[#e85d04]/30 text-[#64748b] hover:text-[#0f172a] text-sm font-medium rounded-xl transition-all"
                  >
                    View All News <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-[#64748b]">
                <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No articles yet. Run AutoPilot to get started.</p>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">

            {/* Ad */}
            <AdBanner format="rectangle" />

            {/* Editor's Picks */}
            {editorPicks.length > 0 && (
              <div className="bg-white border border-[#e2e8f4] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <h3 className="text-white font-black text-sm" style={{ fontFamily: 'var(--font-syne)' }}>
                    Editor&apos;s Picks
                  </h3>
                </div>
                <div className="space-y-1">
                  {editorPicks.map(a => (
                    <ArticleCard key={a.id} article={a} variant="compact" />
                  ))}
                </div>
              </div>
            )}

            {/* Top Airing Quick List */}
            {trending.length > 0 && (
              <div className="bg-white border border-[#e2e8f4] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <h3 className="text-white font-black text-sm" style={{ fontFamily: 'var(--font-syne)' }}>
                    Top Airing
                  </h3>
                </div>
                <ol className="space-y-3">
                  {trending.slice(0, 5).map((anime, i) => (
                    <li key={anime.mal_id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#e85d04] text-xs font-black flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#0f172a] text-xs font-medium line-clamp-1">{anime.title}</p>
                        {anime.score && (
                          <p className="text-[#64748b] text-[10px] flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                            {anime.score}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
                <Link
                  href="/trending"
                  className="flex items-center justify-center gap-1 mt-4 text-xs text-[#64748b] hover:text-[#0f172a] transition-colors"
                >
                  View Full Rankings <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Anime Shop Banner */}
            <a
              href="https://www.amazon.com/s?k=anime+merchandise&tag=YOUR-AFFILIATE-ID"
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="bg-gradient-to-br from-[#ff9900]/10 to-[#ff9900]/5 border border-[#ff9900]/30 hover:border-[#ff9900]/60 rounded-2xl p-5 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-[#ff9900]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                  </svg>
                  <span className="text-[#ff9900] font-black text-sm" style={{ fontFamily: 'var(--font-syne)' }}>
                    Rep Your Favorite Anime
                  </span>
                </div>
                <p className="text-[#64748b] text-xs mb-4 leading-relaxed">
                  Figures, hoodies, posters & manga — grab your gear before it sells out.
                </p>
                <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#ff9900] group-hover:bg-[#e88800] text-white text-sm font-bold rounded-xl transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.9 18 9 18h12v-2H9.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 23.46 5H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                  Shop Now
                </div>
              </div>
            </a>
          </aside>
        </div>

        {/* ── BOTTOM AD ─────────────────────────────────────────────────── */}
        <AdBanner format="horizontal" />
      </div>
    </div>
  );
}
