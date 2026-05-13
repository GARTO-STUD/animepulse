'use client';
/**
 * /calendar — Anime Airing Calendar
 *
 * Features:
 *  - Weekly calendar view (Mon–Sun) showing what airs each day
 *  - Monthly grid view for season overview
 *  - Live "airing today" highlight
 *  - Per-anime detail: episode #, time, studio, score, genres
 *  - Filter by day-of-week
 *  - Season selector: Winter / Spring / Summer / Fall
 *  - Jikan API v4: /schedules/monday..sunday + /seasons/now
 *  - SEO: structured data injected from layout.tsx
 */

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar, Clock, Star, ChevronLeft, ChevronRight,
  Tv, Filter, Flame, RefreshCw, Play,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  images: { jpg: { image_url: string; large_image_url: string } };
  score: number | null;
  episodes: number | null;
  genres: { name: string }[];
  studios: { name: string }[];
  broadcast: {
    day: string | null;
    time: string | null;
    timezone: string | null;
    string: string | null;
  } | null;
  status: string;
  synopsis: string | null;
  season: string | null;
  year: number | null;
  type: string;
}

interface DaySchedule {
  day: string;
  label: string;
  short: string;
  anime: ScheduleAnime[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS: { key: string; label: string; short: string }[] = [
  { key: 'monday',    label: 'Monday',    short: 'Mon' },
  { key: 'tuesday',   label: 'Tuesday',   short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday',  label: 'Thursday',  short: 'Thu' },
  { key: 'friday',    label: 'Friday',    short: 'Fri' },
  { key: 'saturday',  label: 'Saturday',  short: 'Sat' },
  { key: 'sunday',    label: 'Sunday',    short: 'Sun' },
];

const SEASON_COLORS: Record<string, { bg: string; text: string; border: string; label: string; emoji: string }> = {
  winter: { bg: 'bg-blue-500/10',   text: 'text-blue-300',   border: 'border-blue-500/20',   label: 'Winter', emoji: '❄️' },
  spring: { bg: 'bg-green-500/10',  text: 'text-green-300',  border: 'border-green-500/20',  label: 'Spring', emoji: '🌸' },
  summer: { bg: 'bg-yellow-500/10', text: 'text-yellow-300', border: 'border-yellow-500/20', label: 'Summer', emoji: '☀️' },
  fall:   { bg: 'bg-orange-500/10', text: 'text-orange-300', border: 'border-orange-500/20', label: 'Fall',   emoji: '🍂' },
};

const GENRE_COLORS: Record<string, string> = {
  'Action':     'bg-red-500/15 text-red-400',
  'Romance':    'bg-pink-500/15 text-pink-400',
  'Fantasy':    'bg-purple-500/15 text-purple-400',
  'Sci-Fi':     'bg-cyan-500/15 text-cyan-400',
  'Comedy':     'bg-yellow-500/15 text-yellow-400',
  'Horror':     'bg-gray-500/15 text-gray-400',
  'Sports':     'bg-green-500/15 text-green-400',
  'Mystery':    'bg-indigo-500/15 text-indigo-400',
  'Slice of Life': 'bg-teal-500/15 text-teal-400',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayKey(): string {
  const day = new Date().getDay(); // 0=Sun...6=Sat
  const map = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return map[day];
}

function formatBroadcastTime(broadcast: ScheduleAnime['broadcast']): string {
  if (!broadcast?.time) return '—';
  const [h, m] = broadcast.time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm} JST`;
}

function AnimeCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#e2e8f4] animate-pulse">
      <div className="w-12 h-16 rounded-lg bg-[#e2e8f4] flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-[#e2e8f4] rounded w-3/4" />
        <div className="h-3 bg-[#e2e8f4] rounded w-1/2" />
        <div className="h-3 bg-[#e2e8f4] rounded w-1/3" />
      </div>
    </div>
  );
}

// ─── Anime Row Card ───────────────────────────────────────────────────────────

function AnimeRow({ anime, isToday }: { anime: ScheduleAnime; isToday: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const season = anime.season || '';
  const sc = SEASON_COLORS[season] || null;
  const genre = anime.genres[0]?.name || '';
  const genreColor = GENRE_COLORS[genre] || 'bg-[#e2e8f4] text-[#64748b]';

  return (
    <div
      className={`group rounded-xl border transition-all duration-200 overflow-hidden ${
        isToday
          ? 'border-[#e85d04]/30 bg-[#e85d04]/5 hover:border-[#e85d04]/50'
          : 'border-[#e2e8f4] bg-white hover:border-[#e85d04]/20 hover:bg-white'
      }`}
    >
      {/* Main row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        {/* Cover image */}
        <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#e2e8f4]">
          <Image
            src={anime.images.jpg.image_url}
            alt={anime.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
            loading="lazy"
          />
          {isToday && (
            <div className="absolute inset-0 ring-2 ring-[#e85d04]/60 rounded-lg" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-[#0f172a] text-sm font-bold line-clamp-1 leading-snug">
              {anime.title_english || anime.title}
            </h3>
            {anime.score && (
              <span className="flex-shrink-0 flex items-center gap-0.5 text-yellow-400 text-xs font-bold">
                <Star className="w-3 h-3 fill-yellow-400" />{anime.score}
              </span>
            )}
          </div>

          {/* Broadcast time */}
          <div className="flex items-center gap-1.5 text-[10px] text-[#64748b] mb-1.5">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{formatBroadcastTime(anime.broadcast)}</span>
            {anime.episodes && (
              <>
                <span className="text-[#cbd5e1]">·</span>
                <Tv className="w-3 h-3 flex-shrink-0" />
                <span>{anime.episodes} ep{anime.episodes > 1 ? 's' : ''}</span>
              </>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {genre && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${genreColor}`}>
                {genre}
              </span>
            )}
            {sc && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${sc.bg} ${sc.text} ${sc.border}`}>
                {sc.emoji} {sc.label}
              </span>
            )}
            {isToday && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#e85d04]/20 text-[#e85d04] border border-[#e85d04]/30 animate-pulse">
                Airing Today
              </span>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        <div className={`text-[#64748b] transition-transform duration-200 flex-shrink-0 ${expanded ? 'rotate-90' : ''}`}>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-[#e2e8f4]/50">
          {anime.synopsis && (
            <p className="text-[#64748b] text-xs leading-relaxed line-clamp-3 mt-3 mb-3">
              {anime.synopsis}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {anime.studios[0] && (
              <span className="text-[10px] text-[#64748b] bg-[#e2e8f4] px-2 py-1 rounded-lg">
                🎬 {anime.studios[0].name}
              </span>
            )}
            {anime.type && (
              <span className="text-[10px] text-[#64748b] bg-[#e2e8f4] px-2 py-1 rounded-lg">
                📺 {anime.type}
              </span>
            )}
            {anime.genres.slice(1, 3).map(g => (
              <span key={g.name} className="text-[10px] text-[#64748b] bg-[#e2e8f4] px-2 py-1 rounded-lg">
                {g.name}
              </span>
            ))}
            <Link
              href={`/anime/${anime.mal_id}`}
              className="ml-auto text-[10px] font-bold text-[#e85d04] hover:underline flex items-center gap-1"
              onClick={e => e.stopPropagation()}
            >
              <Play className="w-2.5 h-2.5" /> View Details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Day Column ───────────────────────────────────────────────────────────────

function DayColumn({
  day,
  anime,
  loading,
  isToday,
  isActive,
  onSelect,
}: {
  day: { key: string; label: string; short: string };
  anime: ScheduleAnime[];
  loading: boolean;
  isToday: boolean;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`flex-1 min-w-[220px] rounded-2xl border transition-all ${
        isActive
          ? isToday
            ? 'border-[#e85d04]/40 bg-[#e85d04]/5'
            : 'border-[#e85d04]/20 bg-[#f8f9fc]'
          : 'border-[#e2e8f4] bg-[#f8f9fc] opacity-60'
      }`}
    >
      {/* Day header */}
      <button
        onClick={onSelect}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-t-2xl transition-colors ${
          isActive ? 'bg-white' : 'hover:bg-[#f1f5f9]0'
        }`}
      >
        <div className="flex items-center gap-2">
          {isToday && <span className="w-2 h-2 rounded-full bg-[#e85d04] animate-pulse" />}
          <span
            className={`font-black text-sm ${isToday ? 'text-[#e85d04]' : isActive ? 'text-[#0f172a]' : 'text-[#64748b]'}`}
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            {day.label}
          </span>
          {isToday && (
            <span className="text-[10px] font-bold text-[#e85d04] bg-[#e85d04]/10 border border-[#e85d04]/20 px-1.5 py-0.5 rounded-full">
              TODAY
            </span>
          )}
        </div>
        <span className="text-xs text-[#64748b] font-medium">
          {loading ? '…' : `${anime.length} titles`}
        </span>
      </button>

      {/* Anime list */}
      <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <AnimeCardSkeleton key={i} />)
          : anime.length === 0
          ? (
            <div className="text-center py-8 text-[#64748b] text-sm">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">No schedule data</p>
            </div>
          )
          : anime.map(a => (
            <AnimeRow key={a.mal_id} anime={a} isToday={isToday} />
          ))
        }
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loadingDays, setLoadingDays] = useState<Set<string>>(new Set(DAYS.map(d => d.key)));
  const [activeDay, setActiveDay] = useState<string>(getTodayKey());
  const [view, setView] = useState<'week' | 'today'>('today');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [genreList, setGenreList] = useState<string[]>([]);

  const todayKey = getTodayKey();

  const fetchDay = useCallback(async (dayKey: string) => {
    try {
      const res = await fetch(
        `https://api.jikan.moe/v4/schedules/${dayKey}?sfw=true&limit=25`,
        { next: { revalidate: 3600 } } as RequestInit
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || []) as ScheduleAnime[];
    } catch {
      return [] as ScheduleAnime[];
    }
  }, []);

  // Load today first, then rest
  useEffect(() => {
    async function loadAll() {
      // Load today immediately
      const todayData = await fetchDay(todayKey);
      setSchedule([{ day: todayKey, label: '', short: '', anime: todayData }]);
      setLoadingDays(prev => { const n = new Set(prev); n.delete(todayKey); return n; });

      // Collect genres
      const genres = new Set<string>();
      todayData.forEach(a => a.genres.forEach(g => genres.add(g.name)));

      // Load remaining days in parallel (with 300ms delay to avoid Jikan rate limit)
      const otherDays = DAYS.filter(d => d.key !== todayKey);
      const results = await Promise.allSettled(
        otherDays.map(async (day, i) => {
          await new Promise(r => setTimeout(r, i * 400));
          const data = await fetchDay(day.key);
          data.forEach(a => a.genres.forEach(g => genres.add(g.name)));
          setSchedule(prev => {
            const existing = prev.find(s => s.day === day.key);
            if (existing) return prev;
            return [...prev, { day: day.key, label: day.label, short: day.short, anime: data }];
          });
          setLoadingDays(prev => { const n = new Set(prev); n.delete(day.key); return n; });
          return data;
        })
      );

      setGenreList(Array.from(genres).sort());
      setLastUpdated(new Date());

      // If all settled, mark done
      void results;
    }
    loadAll();
  }, [fetchDay, todayKey]);

  function getAnimeForDay(dayKey: string): ScheduleAnime[] {
    const day = schedule.find(s => s.day === dayKey);
    const anime = day?.anime || [];
    if (filterGenre === 'all') return anime;
    return anime.filter(a => a.genres.some(g => g.name === filterGenre));
  }

  const todayAnime = getAnimeForDay(todayKey);
  const activeAnime = getAnimeForDay(activeDay);
  const totalAiring = schedule.reduce((sum, d) => sum + d.anime.length, 0);

  return (
    <div className="min-h-screen bg-[#f8f9fc]">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="border-b border-[#e2e8f4] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">

            <div>
              {/* Breadcrumb for SEO */}
              <nav className="text-xs text-[#64748b] mb-3 flex items-center gap-1.5">
                <a href="/" className="hover:text-[#0f172a] transition-colors">AnimePulse</a>
                <span>›</span>
                <span className="text-[#e85d04]">Anime Calendar</span>
              </nav>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#e85d04]/10 border border-[#e85d04]/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#e85d04]" />
                </div>
                <div>
                  <h1
                    className="text-3xl sm:text-4xl font-black text-[#0f172a]"
                    style={{ fontFamily: 'var(--font-syne)' }}
                  >
                    Anime Calendar
                  </h1>
                  <p className="text-[#64748b] text-sm mt-0.5">
                    {totalAiring > 0
                      ? `${totalAiring}+ series airing this season — updated daily`
                      : 'Loading this season\'s schedule…'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats + last updated */}
            <div className="flex items-center gap-3 text-xs text-[#64748b]">
              {lastUpdated && (
                <div className="flex items-center gap-1.5 bg-[#f8f9fc] border border-[#e2e8f4] px-3 py-2 rounded-xl">
                  <RefreshCw className="w-3 h-3" />
                  <span>Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-[#e85d04]/10 border border-[#e85d04]/20 px-3 py-2 rounded-xl text-[#e85d04]">
                <Flame className="w-3 h-3" />
                <span className="font-bold">{todayAnime.length} airing today</span>
              </div>
            </div>
          </div>

          {/* ── Controls ──────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            {/* View toggle */}
            <div className="flex bg-[#f8f9fc] border border-[#e2e8f4] rounded-xl p-1 gap-1">
              {(['today', 'week'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
                    view === v
                      ? 'bg-[#e85d04] text-[#0f172a] shadow-lg shadow-[#e85d04]/20'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  {v === 'today' ? <Flame className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                  {v === 'today' ? "Today's Airing" : 'Full Week'}
                </button>
              ))}
            </div>

            {/* Genre filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#64748b] flex-shrink-0" />
              <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1">
                <button
                  onClick={() => setFilterGenre('all')}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    filterGenre === 'all'
                      ? 'bg-[#e85d04]/20 border-[#e85d04]/40 text-[#e85d04]'
                      : 'bg-white border-[#e2e8f4] text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  All Genres
                </button>
                {genreList.slice(0, 8).map(g => (
                  <button
                    key={g}
                    onClick={() => setFilterGenre(prev => prev === g ? 'all' : g)}
                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                      filterGenre === g
                        ? 'bg-[#e85d04]/20 border-[#e85d04]/40 text-[#e85d04]'
                        : 'bg-white border-[#e2e8f4] text-[#64748b] hover:text-[#0f172a]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── TODAY VIEW ────────────────────────────────────────────────── */}
        {view === 'today' && (
          <div>
            {/* Day nav pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {DAYS.map(day => {
                const isToday = day.key === todayKey;
                const isActive = day.key === activeDay;
                const count = getAnimeForDay(day.key).length;
                const isLoading = loadingDays.has(day.key);
                return (
                  <button
                    key={day.key}
                    onClick={() => setActiveDay(day.key)}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                      isActive
                        ? isToday
                          ? 'bg-[#e85d04] border-[#e85d04] text-[#0f172a] shadow-lg shadow-[#e85d04]/20'
                          : 'bg-white border-[#e85d04]/30 text-[#0f172a]'
                        : 'bg-[#f8f9fc] border-[#e2e8f4] text-[#64748b] hover:border-[#e85d04]/20 hover:text-[#0f172a]'
                    }`}
                  >
                    <span>{day.short}</span>
                    <span className={`text-[10px] font-medium ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                      {isLoading ? '…' : `${count}`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active day header */}
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-2 h-8 rounded-full ${activeDay === todayKey ? 'bg-[#e85d04]' : 'bg-[#e2e8f4]'}`} />
              <div>
                <h2
                  className="text-[#0f172a] font-black text-xl"
                  style={{ fontFamily: 'var(--font-syne)' }}
                >
                  {DAYS.find(d => d.key === activeDay)?.label}
                  {activeDay === todayKey && (
                    <span className="ml-2 text-sm font-medium text-[#e85d04]">— Today</span>
                  )}
                </h2>
                <p className="text-[#64748b] text-xs">
                  {loadingDays.has(activeDay)
                    ? 'Loading schedule…'
                    : `${activeAnime.length} series airing`
                    + (filterGenre !== 'all' ? ` in ${filterGenre}` : '')}
                </p>
              </div>
            </div>

            {/* Anime grid */}
            {loadingDays.has(activeDay) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }, (_, i) => <AnimeCardSkeleton key={i} />)}
              </div>
            ) : activeAnime.length === 0 ? (
              <div className="text-center py-24">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-[#64748b] opacity-20" />
                <p className="text-[#0f172a] font-bold mb-1">No anime found</p>
                <p className="text-[#64748b] text-sm">
                  {filterGenre !== 'all' ? `No ${filterGenre} anime on this day` : 'No schedule data for this day'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeAnime.map(a => (
                  <AnimeRow key={a.mal_id} anime={a} isToday={activeDay === todayKey} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WEEK VIEW ─────────────────────────────────────────────────── */}
        {view === 'week' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[#0f172a] font-black text-xl" style={{ fontFamily: 'var(--font-syne)' }}>
                This Week
              </h2>
              <p className="text-[#64748b] text-sm">
                {loadingDays.size > 0 ? `Loading ${loadingDays.size} more days…` : 'All days loaded'}
              </p>
            </div>

            {/* Horizontal scroll week view */}
            <div className="flex gap-4 overflow-x-auto pb-4">
              {DAYS.map(day => (
                <DayColumn
                  key={day.key}
                  day={day}
                  anime={getAnimeForDay(day.key)}
                  loading={loadingDays.has(day.key)}
                  isToday={day.key === todayKey}
                  isActive={day.key === activeDay}
                  onSelect={() => { setActiveDay(day.key); setView('today'); }}
                />
              ))}
            </div>

            <p className="text-center text-[#64748b] text-xs mt-4">
              Click any day column to view its full schedule
            </p>
          </div>
        )}

        {/* ── BOTTOM SEO CONTENT ────────────────────────────────────────── */}
        <div className="mt-16 pt-8 border-t border-[#e2e8f4]">
          <h2 className="text-[#0f172a] font-black text-lg mb-3" style={{ fontFamily: 'var(--font-syne)' }}>
            About the AnimePulse Anime Calendar
          </h2>
          <p className="text-[#64748b] text-sm leading-relaxed max-w-3xl">
            The AnimePulse Anime Calendar shows the complete airing schedule for currently broadcasting anime series.
            Data is sourced from MyAnimeList via the Jikan API and refreshed every hour.
            Browse by day of the week to find what's airing today, tomorrow, or any day this season.
            Click any title to see full episode details, trailers, and community ratings.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {['anime schedule 2025', 'anime calendar', 'airing anime', 'seasonal anime'].map(tag => (
              <span key={tag} className="text-xs bg-white border border-[#e2e8f4] text-[#64748b] px-3 py-1.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
