'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Search, Flame } from 'lucide-react';

const navLinks = [
  { name: 'Home',     href: '/' },
  { name: 'News',     href: '/news' },
  { name: 'Trending', href: '/trending' },
  { name: 'Reviews',  href: '/reviews' },
  { name: 'Top 10',   href: '/top-10' },
  { name: 'Blog',     href: '/blog' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#1a2235] bg-[#080b14]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e85d04] to-[#f48c06] flex items-center justify-center glow-orange">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white group-hover:text-[#f48c06] transition-colors">
              Anime<span className="text-[#e85d04]">Pulse</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#e85d04]/10 text-[#e85d04] border border-[#e85d04]/20'
                      : 'text-[#8892a4] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Live Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
              <span className="text-xs font-semibold text-green-400">LIVE</span>
            </div>

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-[#8892a4] hover:text-white hover:bg-white/5 rounded-lg transition-all"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              className="md:hidden p-2 text-[#8892a4] hover:text-white"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892a4]" />
              <input
                autoFocus
                type="text"
                placeholder="Search anime, news, reviews..."
                className="w-full bg-[#0d1117] border border-[#1a2235] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#8892a4] focus:outline-none focus:border-[#e85d04]/50 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden pb-4 border-t border-[#1a2235] pt-3">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#e85d04]/10 text-[#e85d04]'
                        : 'text-[#8892a4] hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
