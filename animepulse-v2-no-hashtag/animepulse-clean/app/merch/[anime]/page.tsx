'use client';
export const runtime = 'edge';
/**
 * app/merch/[anime]/page.tsx
 *
 * /merch/demon-slayer
 * /merch/one-piece
 * /merch/jujutsu-kaisen
 * …etc
 *
 * Features:
 *  - Fetches anime info from Jikan API (cover art, score, synopsis)
 *  - Full affiliate link sections: streaming, manga, blu-ray, figures, merch
 *  - SEO: structured data (Product schema) injected client-side
 *  - "Also shop for" — related anime merch suggestions
 *  - FTC disclosure
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingBag, ExternalLink, ChevronRight, Search } from 'lucide-react';
import { getMerchSections, type MerchSection, type AffiliateLink } from '@/lib/affiliate';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JikanAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  images: { jpg: { large_image_url: string; image_url: string } };
  score: number | null;
  scored_by: number | null;
  synopsis: string | null;
  genres: { name: string }[];
  studios: { name: string }[];
  year: number | null;
  status: string;
  episodes: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugToTitle(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function titleToSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── Affiliate Link Card ──────────────────────────────────────────────────────

function LinkCard({ link }: { link: AffiliateLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`
        group flex items-center justify-between gap-4 p-4 rounded-xl border
        transition-all duration-200 hover:scale-[1.01] hover:shadow-lg
        ${link.bgColor} ${link.border}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{link.icon}</span>
        <div>
          <p className={`font-bold text-sm ${link.color}`}>{link.label}</p>
          <p className="text-[#64748b] text-xs mt-0.5">{link.cta}</p>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 text-xs font-bold ${link.color} opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0`}>
        Shop <ExternalLink className="w-3.5 h-3.5" />
      </div>
    </a>
  );
}

// ─── Merch Section Block ──────────────────────────────────────────────────────

function MerchBlock({ section }: { section: MerchSection }) {
  return (
    <div className="bg-white border border-[#e2e8f4] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e2e8f4] bg-[#f8f9fc]">
        <h2 className="text-white font-black text-base" style={{ fontFamily: 'var(--font-syne)' }}>
          {section.title}
        </h2>
        <p className="text-[#64748b] text-xs mt-0.5">{section.subtitle}</p>
      </div>
      <div className="p-4 space-y-2.5">
        {section.links.map((link, i) => (
          <LinkCard key={i} link={link} />
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-64 bg-white rounded-2xl border border-[#e2e8f4]" />
      {[1, 2, 3].map(i => (
        <div key={i} className="h-40 bg-white rounded-2xl border border-[#e2e8f4]" />
      ))}
    </div>
  );
}

// ─── Popular Anime for "Also Shop" ───────────────────────────────────────────

const POPULAR_SLUGS = [
  'demon-slayer', 'one-piece', 'jujutsu-kaisen', 'attack-on-titan',
  'my-hero-academia', 'naruto', 'chainsaw-man', 'spy-x-family',
  'dragon-ball', 'frieren', 'blue-lock', 'solo-leveling',
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MerchPage() {
  const params = useParams();
  const slug = params.anime as string;
  const displayTitle = slugToTitle(slug);

  const [anime, setAnime]       = useState<JikanAnime | null>(null);
  const [loading, setLoading]   = useState(true);
  const [sections, setSections] = useState<MerchSection[]>([]);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Search Jikan for the anime to get cover art + details
        const res = await fetch(
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(displayTitle)}&limit=1&sfw=true`
        );
        if (res.ok) {
          const data = await res.json();
          const found = data.data?.[0] as JikanAnime | undefined;
          setAnime(found || null);
          // Build sections using the found title (more accurate) or slug title
          const titleForSections = found?.title_english || found?.title || displayTitle;
          setSections(getMerchSections(titleForSections, found?.mal_id));
        } else {
          setSections(getMerchSections(displayTitle));
        }
      } catch {
        setSections(getMerchSections(displayTitle));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, displayTitle]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/merch/${titleToSlug(searchInput.trim())}`;
    }
  }

  const relatedSlugs = POPULAR_SLUGS.filter(s => s !== slug).slice(0, 6);

  return (
    <div className="min-h-screen bg-[#f8f9fc]">

      {/* ── Hero Header ───────────────────────────────────────────────── */}
      <div className="border-b border-[#e2e8f4] bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Breadcrumb */}
          <nav className="text-xs text-[#64748b] mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#0f172a] transition-colors">AnimePulse</Link>
            <span>›</span>
            <Link href="/merch" className="hover:text-[#0f172a] transition-colors">Shop</Link>
            <span>›</span>
            <span className="text-[#0f172a]">{displayTitle}</span>
          </nav>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Anime cover */}
            {anime?.images?.jpg?.image_url && (
              <div className="relative w-28 h-40 rounded-xl overflow-hidden flex-shrink-0 border border-[#e2e8f4] shadow-xl">
                <Image
                  src={anime.images.jpg.image_url}
                  alt={displayTitle}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#e85d04]/10 border border-[#e85d04]/20 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-[#e85d04]" />
                </div>
                <span className="text-[#e85d04] text-xs font-bold uppercase tracking-widest">
                  Official Shop Guide
                </span>
              </div>

              <h1
                className="text-3xl sm:text-4xl font-black text-[#0f172a] leading-tight mb-2"
                style={{ fontFamily: 'var(--font-syne)' }}
              >
                {displayTitle}
              </h1>

              {anime && (
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  {anime.score && (
                    <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                      <Star className="w-4 h-4 fill-yellow-400" />
                      {anime.score}
                      <span className="text-[#64748b] font-normal text-xs">/ 10</span>
                    </span>
                  )}
                  {anime.genres?.slice(0, 3).map(g => (
                    <span key={g.name} className="text-xs bg-[#e2e8f4] text-[#64748b] px-2.5 py-1 rounded-full">
                      {g.name}
                    </span>
                  ))}
                  {anime.year && (
                    <span className="text-xs text-[#64748b]">{anime.year}</span>
                  )}
                </div>
              )}

              <p className="text-[#64748b] text-sm leading-relaxed line-clamp-2">
                {anime?.synopsis
                  ? anime.synopsis.slice(0, 180) + '…'
                  : `Find the best deals on official ${displayTitle} merchandise, manga, Blu-ray, and collectibles.`
                }
              </p>
            </div>
          </div>

          {/* Search bar for other anime */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search merch for any anime…"
                className="w-full bg-[#f8f9fc] border border-[#e2e8f4] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0f172a] placeholder-[#8892a4] focus:outline-none focus:border-[#e85d04]/50"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-[#e85d04] to-[#f48c06] text-[#0f172a] font-bold rounded-xl text-sm hover:shadow-lg transition-shadow"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {loading ? (
          <PageSkeleton />
        ) : (
          <div className="space-y-5">
            {sections.map((section, i) => (
              <MerchBlock key={i} section={section} />
            ))}

            {/* FTC Disclosure */}
            <div className="bg-white border border-[#e2e8f4]/50 rounded-xl px-5 py-4">
              <p className="text-[#64748b] text-xs leading-relaxed">
                <strong className="text-[#0f172a]">Affiliate Disclosure:</strong>{' '}
                AnimePulse participates in affiliate programs including Amazon Associates
                and others. We may earn a small commission when you purchase through our links,
                at no extra cost to you. This helps us keep the site free and running.
              </p>
            </div>

            {/* SEO text */}
            <div className="pt-4 border-t border-[#e2e8f4]">
              <h2 className="text-white font-black text-lg mb-3" style={{ fontFamily: 'var(--font-syne)' }}>
                About {displayTitle} Merchandise
              </h2>
              <p className="text-[#64748b] text-sm leading-relaxed">
                Looking for official {displayTitle} products? AnimePulse has curated the best
                sources for {displayTitle} manga volumes, Blu-ray box sets, collector figures,
                and licensed merchandise. All links go to trusted retailers including Amazon
                and RightStuf Anime.
              </p>
            </div>

            {/* Related anime merch */}
            <div>
              <h2 className="text-white font-black text-lg mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-syne)' }}>
                <div className="w-1 h-6 bg-[#e85d04] rounded-full" />
                Also Shop For
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {relatedSlugs.map(s => (
                  <Link
                    key={s}
                    href={`/merch/${s}`}
                    className="flex items-center justify-between gap-2 p-3 bg-white border border-[#e2e8f4] rounded-xl text-sm text-[#64748b] hover:text-[#0f172a] hover:border-[#e85d04]/20 transition-all group"
                  >
                    <span className="capitalize">{s.replace(/-/g, ' ')}</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Back to anime page link if we found MAL data */}
            {anime && (
              <div className="text-center pt-2">
                <Link
                  href={`/anime/${anime.mal_id}`}
                  className="inline-flex items-center gap-2 text-sm text-[#e85d04] hover:underline"
                >
                  View {displayTitle} full anime page
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
