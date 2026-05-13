'use client';
/**
 * /trailers — Watch trailers for ANY anime
 *
 * Improvements applied:
 *  1. Skeleton loading cards (replaces spinner)
 *  2. Animated hero background (floating orbs + scanline grain)
 *  3. Mobile hero py-12 → py-6 sm:py-12
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import {
  Search, Play, Tv, Star, CalendarDays,
  TrendingUp, Clock, AlertCircle,
  ChevronRight, X, Clapperboard,
} from 'lucide-react';
import TrailerModal from '@/components/TrailerModal';

/* ── Types ──────────────────────────────────────────────────────── */
interface JikanAnime {
  mal_id:        number;
  title:         string;
  title_english: string | null;
  score:         number | null;
  year:          number | null;
  season:        string | null;
  type:          string;
  status:        string;
  episodes:      number | null;
  synopsis:      string | null;
  genres:        Array<{ name: string }>;
  studios:       Array<{ name: string }>;
  images:        { jpg: { image_url: string; large_image_url: string } };
  trailer:       { youtube_id: string | null; url: string | null } | null;
}

interface ModalState {
  open:      boolean;
  youtubeId: string | null;
  title:     string;
}

/* ── Helpers ────────────────────────────────────────────────────── */
const SEASON_NAMES = [
  'winter','winter','winter',
  'spring','spring','spring',
  'summer','summer','summer',
  'fall',  'fall',  'fall',
];

function currentSeason() {
  const d = new Date();
  return { season: SEASON_NAMES[d.getMonth()], year: d.getFullYear() };
}

function scoreColor(s: number | null) {
  if (!s)     return '#64748b';
  if (s >= 8) return '#22c55e';
  if (s >= 7) return '#84cc16';
  if (s >= 6) return '#eab308';
  return '#f97316';
}

const TABS = [
  { key: 'seasonal',  label: 'Seasonal',  icon: CalendarDays },
  { key: 'trending',  label: 'Trending',  icon: TrendingUp },
  { key: 'upcoming',  label: 'Upcoming',  icon: Clock },
  { key: 'search',    label: 'Search',    icon: Search },
] as const;
type Tab = typeof TABS[number]['key'];

/* ── Skeleton card ──────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white border border-[#e2e8f4] rounded-2xl overflow-hidden flex flex-col animate-pulse">
      {/* Thumbnail placeholder */}
      <div className="bg-[#e2e8f4]" style={{ aspectRatio: '16/9' }} />
      {/* Info placeholder */}
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3.5 bg-[#e2e8f4] rounded-full w-4/5" />
        <div className="h-3.5 bg-[#e2e8f4] rounded-full w-3/5" />
        <div className="h-3 bg-[#f1f5f9] rounded-full w-2/5 mt-1" />
        <div className="flex gap-1.5 mt-1">
          <div className="h-5 bg-[#f1f5f9] rounded-full w-14" />
          <div className="h-5 bg-[#f1f5f9] rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton grid ──────────────────────────────────────────────── */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {Array.from({ length: 12 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/* ── Trailer card ───────────────────────────────────────────────── */
function TrailerCard({
  anime,
  onPlay,
}: {
  anime: JikanAnime;
  onPlay: (youtubeId: string | null, title: string) => void;
}) {
  const [imgErr,   setImgErr]   = useState(false);
  const [thumbErr, setThumbErr] = useState(false);
  const title     = anime.title_english || anime.title;
  const youtubeId = anime.trailer?.youtube_id ?? null;
  const thumbUrl  = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    : null;

  return (
    <div className="group bg-white border border-[#e2e8f4] rounded-2xl overflow-hidden hover:border-[#e85d04]/40 hover:shadow-xl transition-all duration-200 flex flex-col">

      {/* Thumbnail / Poster */}
      <div
        className="relative overflow-hidden cursor-pointer bg-[#0f172a]"
        style={{ aspectRatio: '16/9' }}
        onClick={() => onPlay(youtubeId, title)}
        role="button"
        tabIndex={0}
        aria-label={`Watch ${title} trailer`}
        onKeyDown={e => e.key === 'Enter' && onPlay(youtubeId, title)}
      >
        {thumbUrl && !thumbErr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={`${title} trailer`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setThumbErr(true)}
          />
        ) : !imgErr ? (
          <Image
            src={anime.images.jpg.large_image_url || anime.images.jpg.image_url}
            alt={title}
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Clapperboard className="w-12 h-12 text-[#334155]" />
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-red-600 group-hover:bg-red-500 group-hover:scale-110 transition-all shadow-2xl shadow-red-900/60 flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Trailer badge */}
        <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
          youtubeId
            ? 'bg-red-600 text-white'
            : 'bg-black/60 text-[#94a3b8] border border-[#334155]'
        }`}>
          <Play className="w-2.5 h-2.5 fill-current" />
          {youtubeId ? 'Trailer' : 'Search'}
        </div>

        {/* Score */}
        {anime.score && (
          <div
            className="absolute top-2 left-2 text-white text-xs font-black px-2 py-0.5 rounded-lg flex items-center gap-1"
            style={{ background: scoreColor(anime.score) + 'dd' }}
          >
            <Star className="w-3 h-3 fill-white" />
            {anime.score.toFixed(1)}
          </div>
        )}

        {/* Type + year */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Tv className="w-3 h-3" />{anime.type}
          </span>
          {anime.year && (
            <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
              {anime.year}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h3
          className="text-[#0f172a] font-bold text-sm leading-snug line-clamp-2 cursor-pointer group-hover:text-[#e85d04] transition-colors"
          onClick={() => onPlay(youtubeId, title)}
        >
          {title}
        </h3>
        {anime.studios[0] && (
          <p className="text-[#94a3b8] text-xs truncate">{anime.studios[0].name}</p>
        )}
        {anime.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {anime.genres.slice(0, 2).map(g => (
              <span key={g.name} className="text-[10px] bg-[#f1f5f9] text-[#64748b] px-2 py-0.5 rounded-full">
                {g.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────── */
export default function TrailersPage() {
  const { season, year } = useMemo(() => currentSeason(), []);
  const SEASON_LABEL     = season.charAt(0).toUpperCase() + season.slice(1);

  const [activeTab,   setActiveTab]   = useState<Tab>('seasonal');
  const [lists,       setLists]       = useState<Record<string, JikanAnime[]>>({});
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [modal,       setModal]       = useState<ModalState>({ open: false, youtubeId: null, title: '' });
  const searchRef = useRef<HTMLInputElement>(null);
  const listsRef  = useRef<Record<string, JikanAnime[]>>({});

  const fetchTab = useCallback(async (tab: Tab, query = '') => {
    const cacheKey = tab === 'search' ? `search:${query}` : tab;
    if (listsRef.current[cacheKey]) return;

    setLoading(true);
    setError(null);

    const ENDPOINTS: Record<Tab, string> = {
      seasonal: 'https://api.jikan.moe/v4/seasons/now?limit=24',
      trending: 'https://api.jikan.moe/v4/top/anime?filter=airing&limit=24',
      upcoming: 'https://api.jikan.moe/v4/seasons/upcoming?limit=24',
      search:   `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=24&order_by=score&sort=desc`,
    };

    try {
      const res = await fetch(ENDPOINTS[tab]);

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('Retry-After') ?? 2);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        const retry = await fetch(ENDPOINTS[tab]);
        if (!retry.ok) throw new Error(`HTTP ${retry.status}`);
        const json = await retry.json() as { data: JikanAnime[] };
        const data = json.data || [];
        listsRef.current = { ...listsRef.current, [cacheKey]: data };
        setLists(prev => ({ ...prev, [cacheKey]: data }));
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { data: JikanAnime[] };
      const data = json.data || [];
      listsRef.current = { ...listsRef.current, [cacheKey]: data };
      setLists(prev => ({ ...prev, [cacheKey]: data }));
    } catch (e) {
      setError('Failed to load. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'search') fetchTab(activeTab);
    if (activeTab === 'search') {
      const t = setTimeout(() => searchRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [activeTab, fetchTab]);

  const handleSearch = useCallback(() => {
    const q = searchInput.trim();
    if (!q) return;
    setSearchQuery(q);
    const cacheKey = `search:${q}`;
    listsRef.current = { ...listsRef.current };
    delete listsRef.current[cacheKey];
    setLists(prev => { const n = { ...prev }; delete n[cacheKey]; return n; });
    fetchTab('search', q);
  }, [searchInput, fetchTab]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  const openModal = useCallback((youtubeId: string | null, title: string) =>
    setModal({ open: true, youtubeId, title }), []);

  const activeKey = activeTab === 'search' ? `search:${searchQuery}` : activeTab;
  const animeList = lists[activeKey] || [];

  return (
    <div className="min-h-screen bg-[#f8f9fc]">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      {/*
        Improvement 2: animated hero background
        - Three blurred radial orbs that float with CSS keyframe animations
        - A repeating scanline overlay (SVG data-URI) for cinematic texture
        - All pure CSS, zero JS overhead
      */}
      <div className="relative bg-[#080b14] border-b border-[#1e293b] overflow-hidden">

        {/* Floating orbs */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #e85d04 0%, transparent 70%)',
            animation: 'orb-drift-1 12s ease-in-out infinite',
          }}
        />
        <div
          className="absolute top-8 right-0 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
            animation: 'orb-drift-2 16s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-16 left-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #e85d04 0%, transparent 70%)',
            animation: 'orb-drift-3 10s ease-in-out infinite',
          }}
        />

        {/* Scanline grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='1' fill='%23fff'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '2px 2px',
          }}
        />

        {/* Keyframe definitions injected as a style tag */}
        <style>{`
          @keyframes orb-drift-1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33%       { transform: translate(40px, 30px) scale(1.1); }
            66%       { transform: translate(-20px, 50px) scale(0.95); }
          }
          @keyframes orb-drift-2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            40%       { transform: translate(-50px, 20px) scale(1.08); }
            70%       { transform: translate(20px, -30px) scale(0.92); }
          }
          @keyframes orb-drift-3 {
            0%, 100% { transform: translate(-50%, 0) scale(1); }
            50%       { transform: translate(-50%, -30px) scale(1.12); }
          }
        `}</style>

        {/* Improvement 3: py-6 on mobile, py-12 on sm+ */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">

          <div className="flex items-start gap-4 mb-8">
            <div className="flex-shrink-0 w-12 h-12 bg-red-600/20 border border-red-600/40 rounded-2xl flex items-center justify-center">
              <Clapperboard className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-red-600/20 border border-red-600/40 text-red-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Anime Trailers
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Watch Any Anime Trailer
              </h1>
              <p className="text-[#64748b] mt-2 max-w-xl">
                Browse {SEASON_LABEL} {year} trailers, trending, upcoming — or search any anime ever made.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  activeTab === key
                    ? 'bg-[#e85d04] border-[#e85d04] text-white shadow-lg shadow-[#e85d04]/20'
                    : 'bg-[#0f172a] border-[#1e293b] text-[#64748b] hover:border-[#e85d04]/40 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {key === 'seasonal' ? `${SEASON_LABEL} ${year}` : label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Search bar ─────────────────────────────────────────── */}
        {activeTab === 'search' && (
          <div className="bg-white border border-[#e2e8f4] rounded-2xl p-4 mb-8">
            <p className="text-[#0f172a] font-bold text-sm mb-3">
              Search any anime — from classics to new releases
            </p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='e.g. "Demon Slayer", "Naruto", "Bocchi the Rock"…'
                  className="w-full pl-9 pr-4 py-3 bg-[#f8f9fc] border border-[#e2e8f4] rounded-xl text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#e85d04]/30 focus:border-[#e85d04]/50"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={!searchInput.trim()}
                className="flex items-center gap-2 px-5 py-3 bg-[#e85d04] hover:bg-[#c44d03] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>

            {/* Quick suggestions */}
            {!searchQuery && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[#94a3b8] text-xs self-center">Try:</span>
                {['One Piece', 'Attack on Titan', 'Jujutsu Kaisen', 'Chainsaw Man', 'Frieren', 'Solo Leveling', 'Dragon Ball', 'Bleach'].map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      setSearchInput(s);
                      const cacheKey = `search:${s}`;
                      listsRef.current = { ...listsRef.current };
                      delete listsRef.current[cacheKey];
                      setLists(prev => { const n = { ...prev }; delete n[cacheKey]; return n; });
                      setSearchQuery(s);
                      fetchTab('search', s);
                    }}
                    className="text-xs bg-[#f1f5f9] hover:bg-[#e85d04]/10 hover:text-[#e85d04] text-[#64748b] border border-[#e2e8f4] hover:border-[#e85d04]/30 px-3 py-1 rounded-full transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/*
          Improvement 1: Skeleton loading grid
          Shows 12 placeholder cards that match the real card layout,
          keeping the grid stable and removing layout shift on load.
        */}
        {loading && <SkeletonGrid />}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <AlertCircle className="w-10 h-10 text-[#e85d04]" />
            <p className="text-[#0f172a] font-semibold">{error}</p>
            <button
              onClick={() => {
                listsRef.current = {};
                setLists({});
                if (activeTab !== 'search') fetchTab(activeTab);
                else handleSearch();
              }}
              className="bg-[#e85d04] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#c44d03] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty search state */}
        {!loading && !error && activeTab === 'search' && !searchQuery && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#e85d04]/10 border border-[#e85d04]/20 flex items-center justify-center">
              <Clapperboard className="w-10 h-10 text-[#e85d04]" />
            </div>
            <p className="text-[#0f172a] font-bold text-lg">Search any anime</p>
            <p className="text-[#64748b] text-sm text-center max-w-sm">
              Type a title above — official trailers open instantly, or we fall back to YouTube search.
            </p>
          </div>
        )}

        {/* No results */}
        {!loading && !error && searchQuery && animeList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Search className="w-10 h-10 text-[#94a3b8]" />
            <p className="text-[#0f172a] font-semibold">No results for &ldquo;{searchQuery}&rdquo;</p>
            <p className="text-[#64748b] text-sm">Try a different spelling or shorter title</p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && animeList.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[#e85d04] rounded-full" />
                <h2 className="text-[#0f172a] font-black text-xl">
                  {activeTab === 'seasonal' && `${SEASON_LABEL} ${year} Trailers`}
                  {activeTab === 'trending' && 'Trending Now'}
                  {activeTab === 'upcoming' && 'Coming Soon'}
                  {activeTab === 'search'   && `Results for "${searchQuery}"`}
                </h2>
                <span className="text-[#94a3b8] text-sm font-medium">
                  {animeList.length} anime
                </span>
              </div>
              <span className="text-xs text-[#64748b] hidden sm:block">
                <span className="font-bold text-[#0f172a]">
                  {animeList.filter(a => a.trailer?.youtube_id).length}
                </span>{' '}
                with official trailers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {animeList.map(anime => (
                <TrailerCard key={anime.mal_id} anime={anime} onPlay={openModal} />
              ))}
            </div>

            {animeList.some(a => !a.trailer?.youtube_id) && (
              <p className="text-center text-xs text-[#94a3b8] mt-8">
                Cards marked <span className="font-bold text-[#64748b]">Search</span> open a YouTube search when clicked — official trailer not available via MAL.
              </p>
            )}
          </>
        )}

        {/* Want more CTA */}
        {!loading && !error && animeList.length > 0 && activeTab !== 'search' && (
          <div className="mt-12 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-black text-lg">Want more?</p>
              <p className="text-[#64748b] text-sm mt-0.5">
                Switch to the Search tab to find trailers for any anime ever made.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('search')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#e85d04] hover:bg-[#c44d03] text-white font-bold text-sm rounded-xl transition-colors flex-shrink-0"
            >
              Search Trailers
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Trailer modal */}
      <TrailerModal
        isOpen={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        youtubeId={modal.youtubeId}
        title={modal.title}
      />
    </div>
  );
}
