'use client';
/**
 * components/SmartAffiliateBanner.tsx — Premium Redesign
 * Visually striking affiliate section that blends naturally into editorial content.
 */

import { useMemo, useState } from 'react';
import { ExternalLink, Sparkles, ChevronRight } from 'lucide-react';
import { getArticleAffiliateLinks, type AffiliateLink } from '@/lib/affiliate';

interface SmartAffiliateBannerProps {
  tags:     string[];
  title:    string;
  compact?: boolean;
  className?: string;
}

const TYPE_GRADIENTS: Record<string, { bg: string; pill: string; dot: string }> = {
  streaming: { bg: 'from-violet-50 to-purple-50',  pill: 'bg-violet-100 text-violet-700', dot: 'bg-violet-400' },
  manga:     { bg: 'from-blue-50 to-indigo-50',    pill: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-400' },
  bluray:    { bg: 'from-slate-50 to-zinc-50',      pill: 'bg-slate-100 text-slate-700',   dot: 'bg-slate-400' },
  merch:     { bg: 'from-amber-50 to-orange-50',   pill: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400' },
  figures:   { bg: 'from-pink-50 to-rose-50',      pill: 'bg-pink-100 text-pink-700',     dot: 'bg-pink-400' },
};

function PremiumCard({ link, index }: { link: AffiliateLink; index: number }) {
  const [hovered, setHovered] = useState(false);
  const style = TYPE_GRADIENTS[link.type] || TYPE_GRADIENTS.merch;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer
        bg-gradient-to-r ${style.bg}
        ${hovered
          ? 'border-[#e85d04]/40 shadow-lg shadow-orange-500/10 -translate-y-0.5'
          : 'border-[#e2e8f4] shadow-sm'
        }
      `}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Icon blob */}
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl
        transition-transform duration-300 ${hovered ? 'scale-110' : 'scale-100'}
        bg-white shadow-sm border border-white/80
      `}>
        {link.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${style.pill}`}>
            {link.type}
          </span>
        </div>
        <p className="font-bold text-[#0f172a] text-sm leading-snug" style={{ fontFamily: 'var(--font-syne)' }}>
          {link.label}
        </p>
        <p className="text-[#64748b] text-xs mt-0.5">{link.cta}</p>
      </div>

      {/* CTA Arrow */}
      <div className={`
        flex items-center gap-1 text-xs font-bold text-[#e85d04] flex-shrink-0
        transition-all duration-200 ${hovered ? 'translate-x-1 opacity-100' : 'opacity-60'}
      `}>
        <span className="hidden sm:block">Shop</span>
        <ChevronRight className="w-4 h-4" />
      </div>

      {/* Subtle shine on hover */}
      {hovered && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      )}
    </a>
  );
}

function CompactCard({ link }: { link: AffiliateLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group flex items-center gap-2.5 p-3 rounded-xl border border-[#e2e8f4] bg-white hover:border-[#e85d04]/30 hover:shadow-md transition-all duration-200"
    >
      <span className="text-lg">{link.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-[#0f172a] line-clamp-1 group-hover:text-[#e85d04] transition-colors">
          {link.label}
        </p>
        <p className="text-[10px] text-[#94a3b8]">{link.cta}</p>
      </div>
      <ExternalLink className="w-3 h-3 text-[#94a3b8] group-hover:text-[#e85d04] flex-shrink-0 transition-colors" />
    </a>
  );
}

export default function SmartAffiliateBanner({
  tags,
  title,
  compact = false,
  className = '',
}: SmartAffiliateBannerProps) {
  const links = useMemo(() => getArticleAffiliateLinks(tags, title), [tags, title]);
  if (links.length === 0) return null;

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles className="w-3 h-3 text-[#e85d04]" />
          <p className="text-[10px] text-[#94a3b8] uppercase tracking-widest font-semibold">
            Sponsored
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {links.map((link, i) => <CompactCard key={i} link={link} />)}
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-[#e2e8f4] bg-white shadow-sm ${className}`}>
      {/* Header strip */}
      <div className="relative px-5 py-4 bg-gradient-to-r from-[#fff5ee] to-white border-b border-[#e2e8f4]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e85d04] to-[#f48c06] flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-black text-[#0f172a] text-sm leading-none" style={{ fontFamily: 'var(--font-syne)' }}>
                Watch & Collect
              </p>
              <p className="text-[11px] text-[#64748b] mt-0.5">Best places to enjoy this anime</p>
            </div>
          </div>
          <span className="text-[10px] text-[#94a3b8] bg-[#f1f5f9] px-2.5 py-1 rounded-full font-medium">
            Affiliate
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="p-4 space-y-3">
        {links.map((link, i) => (
          <PremiumCard key={i} link={link} index={i} />
        ))}
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-[#94a3b8] pb-3 px-4 leading-relaxed">
        AnimePulse earns a small commission from purchases — at no cost to you.
      </p>
    </div>
  );
}
