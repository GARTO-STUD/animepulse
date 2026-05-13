/**
 * components/ArticleCard.tsx — Light Theme
 * Variants: 'default', 'featured', 'compact', 'horizontal'
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Clock, Calendar, Share2, Eye } from 'lucide-react';
import { useState } from 'react';

export interface ArticleCardData {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  source: string;
  tags?: string[];
  imageUrl?: string | null;
  readTime?: number;
  verdict?: string;
  qualityScore?: number;
  views?: number;
}

type CardVariant = 'default' | 'featured' | 'compact' | 'horizontal';

interface ArticleCardProps {
  article: ArticleCardData;
  variant?: CardVariant;
  className?: string;
  showScore?: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const emoji = verdict.slice(0, 2);
  const colors: Record<string, string> = {
    '🔥': 'bg-red-50 text-red-600 border-red-200',
    '⭐': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    '😐': 'bg-slate-50 text-slate-500 border-slate-200',
    '❌': 'bg-gray-50 text-gray-500 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${colors[emoji] || 'bg-orange-50 text-[#e85d04] border-orange-200'}`}>
      {verdict.slice(0, 20)}
    </span>
  );
}

function ShareMenu({ title, id }: { title: string; id: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/news/${id}` : `/news/${id}`;

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
    });
  }

  return (
    <div className="relative">
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
        aria-label="Share"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          className="absolute bottom-8 right-0 z-50 bg-white border border-[#e2e8f4] rounded-xl shadow-xl min-w-[150px] py-1"
          onClick={e => { e.preventDefault(); e.stopPropagation(); }}
        >
          {[
            { label: 'Twitter/X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
            { label: 'Reddit',    href: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}` },
            { label: 'WhatsApp',  href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}` },
          ].map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className="block px-4 py-2 text-xs text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8f9fc] transition-colors">
              {label}
            </a>
          ))}
          <button onClick={copy} className="w-full text-left px-4 py-2 text-xs text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8f9fc] transition-colors">
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Card Variants ────────────────────────────────────────────────────────────

export function ArticleCard({ article, variant = 'default', className = '', showScore = false }: ArticleCardProps) {

  // FEATURED — large hero card
  if (variant === 'featured') {
    return (
      <Link href={`/news/${article.id}`} className={`group relative block rounded-2xl overflow-hidden bg-white border border-[#e2e8f4] hover:border-[#e85d04]/40 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-orange-500/10 ${className}`}>
        <div className="relative h-72 sm:h-96">
          {article.imageUrl ? (
            <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f4]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            {article.verdict && <div className="mb-3"><VerdictBadge verdict={article.verdict} /></div>}
            <h2 className="text-white font-black text-xl sm:text-2xl leading-tight mb-3 group-hover:text-[#f48c06] transition-colors" style={{ fontFamily: 'var(--font-syne)' }}>
              {article.title}
            </h2>
            <p className="text-white/70 text-sm line-clamp-2 mb-3">{article.summary}</p>
            <div className="flex items-center gap-3 text-xs text-white/60">
              <span className="text-[#f48c06] font-medium">{article.source}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime || 3}m</span>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // COMPACT — minimal list item
  if (variant === 'compact') {
    return (
      <Link href={`/news/${article.id}`} className={`group flex items-center gap-3 p-3 rounded-xl hover:bg-[#f8f9fc] transition-colors ${className}`}>
        {article.imageUrl && (
          <div className="relative w-16 h-14 rounded-lg overflow-hidden flex-shrink-0">
            <Image src={article.imageUrl} alt={article.title} fill className="object-cover" unoptimized />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-[#0f172a] text-xs font-bold line-clamp-2 group-hover:text-[#e85d04] transition-colors leading-snug">
            {article.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-[#94a3b8]">
            <span>{formatDate(article.publishedAt)}</span>
            {article.readTime && <span>· {article.readTime}m</span>}
          </div>
        </div>
      </Link>
    );
  }

  // HORIZONTAL — image left, text right
  if (variant === 'horizontal') {
    return (
      <Link href={`/news/${article.id}`} className={`group flex gap-4 p-4 rounded-2xl bg-white border border-[#e2e8f4] hover:border-[#e85d04]/30 transition-all shadow-sm hover:shadow-md ${className}`}>
        {article.imageUrl && (
          <div className="relative w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
            <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {article.verdict && <div className="mb-1.5"><VerdictBadge verdict={article.verdict} /></div>}
          <h3 className="text-[#0f172a] font-bold text-sm leading-snug line-clamp-2 group-hover:text-[#e85d04] transition-colors mb-1.5">
            {article.title}
          </h3>
          <p className="text-[#64748b] text-xs line-clamp-1 mb-2">{article.summary}</p>
          <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
            <span className="text-[#e85d04] font-medium">{article.source}</span>
            <span>·</span>
            <span>{formatDate(article.publishedAt)}</span>
            {article.readTime && <><span>·</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime}m</span></>}
          </div>
        </div>
      </Link>
    );
  }

  // DEFAULT — standard grid card
  return (
    <Link href={`/news/${article.id}`} className={`group flex flex-col rounded-2xl overflow-hidden bg-white border border-[#e2e8f4] hover:border-[#e85d04]/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/8 shadow-sm ${className}`}>
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {article.imageUrl ? (
          <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f4] flex items-center justify-center">
            <span className="text-4xl opacity-30">✦</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Score badge */}
        {showScore && article.qualityScore !== undefined && (
          <div className="absolute top-3 right-3">
            <span className={`text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm ${
              article.qualityScore >= 70 ? 'bg-green-500/90 text-white' :
              article.qualityScore >= 55 ? 'bg-orange-500/90 text-white' :
              'bg-gray-500/90 text-white'
            }`}>
              {article.qualityScore}
            </span>
          </div>
        )}

        {/* Source tag */}
        <div className="absolute bottom-3 left-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#e85d04]/90 text-white backdrop-blur-sm">
            {article.source}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {article.verdict && (
          <div className="mb-2">
            <VerdictBadge verdict={article.verdict} />
          </div>
        )}

        <h3 className="text-[#0f172a] font-bold text-sm leading-snug line-clamp-2 group-hover:text-[#e85d04] transition-colors mb-2 flex-1" style={{ fontFamily: 'var(--font-syne)' }}>
          {article.title}
        </h3>

        <p className="text-[#64748b] text-xs line-clamp-2 mb-3 leading-relaxed">
          {article.summary}
        </p>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {article.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] bg-[#f8f9fc] border border-[#e2e8f4] text-[#64748b] px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#e2e8f4] mt-auto">
          <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(article.publishedAt)}
            </span>
            {article.readTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readTime}m
              </span>
            )}
            {article.views !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {article.views > 999 ? `${(article.views / 1000).toFixed(1)}k` : article.views}
              </span>
            )}
          </div>
          <ShareMenu title={article.title} id={article.id} />
        </div>
      </div>
    </Link>
  );
}

export default ArticleCard;
