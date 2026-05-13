import Link from 'next/link';
import { Flame, Home, Newspaper, TrendingUp } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      {/* Animated 404 */}
      <div className="relative mb-8">
        <div className="text-[10rem] font-black leading-none text-[#cbd5e1] select-none"
          style={{ fontFamily: 'var(--font-syne)' }}>
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#e85d04] to-[#f48c06] flex items-center justify-center shadow-2xl shadow-orange-500/30">
            <Flame className="w-10 h-10 text-[#0f172a]" />
          </div>
        </div>
      </div>

      <h1 className="text-[#0f172a] font-black text-3xl mb-3" style={{ fontFamily: 'var(--font-syne)' }}>
        Page Not Found
      </h1>
      <p className="text-[#64748b] text-base mb-10 max-w-sm">
        Looks like this page went on a filler arc. Let&apos;s get you back to the good stuff.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#e85d04] hover:bg-[#f48c06] text-[#0f172a] font-bold rounded-xl transition-colors"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
        <Link
          href="/news"
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e2e8f4] hover:border-[#e85d04]/40 text-[#0f172a] font-bold rounded-xl transition-colors"
        >
          <Newspaper className="w-4 h-4" />
          Latest News
        </Link>
        <Link
          href="/trending"
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e2e8f4] hover:border-[#e85d04]/40 text-[#0f172a] font-bold rounded-xl transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Trending
        </Link>
      </div>
    </div>
  );
}
