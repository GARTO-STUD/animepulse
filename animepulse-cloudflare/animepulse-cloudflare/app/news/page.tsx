'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  source: string;
  sourceType: 'rss' | 'mal' | 'reddit';
  tags: string[];
  imageUrl?: string;
  url?: string;
  readTime?: number;
  upvotes?: number;
}

const SOURCE_TABS = [
  { key: 'all',    label: 'All News' },
  { key: 'rss',    label: 'RSS Feeds' },
  { key: 'mal',    label: 'MyAnimeList' },
  { key: 'reddit', label: 'Reddit' },
] as const;

type SourceKey = typeof SOURCE_TABS[number]['key'];

function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
    });
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1.5 text-xs text-[#8892a4] hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
        aria-label="Share"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>
      {open && (
        <div
          className="absolute bottom-8 right-0 z-50 bg-[#0d1117] border border-[#1a2235] rounded-xl shadow-xl overflow-hidden min-w-[160px]"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#8892a4] hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Twitter / X
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#8892a4] hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L.057 23.547l5.835-1.53A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.365l-.358-.214-3.72.975.991-3.63-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
            WhatsApp
          </a>
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#8892a4] hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </a>
          <button onClick={copyLink}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#8892a4] hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<SourceKey>('all');
  const [total, setTotal] = useState(0);

  const loadArticles = useCallback(async (tab: SourceKey = activeTab) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (tab !== 'all') params.set('source', tab);
      const res = await fetch(`/api/articles?${params}`);
      if (res.ok) {
        const data = (await res.json()) as any;
        setArticles(data.articles || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadArticles(activeTab);
  }, [activeTab, loadArticles]);

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="min-h-screen">

      {/* Header */}
      <div className="bg-[#0d1117] border-b border-[#1a2235] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white mb-1">Anime News</h1>
          <p className="text-[#8892a4]">Latest anime news and updates · {total} articles</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Source Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {SOURCE_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === key
                  ? 'bg-[#e85d04] text-white'
                  : 'bg-[#0d1117] border border-[#1a2235] text-[#8892a4] hover:text-white hover:border-[#e85d04]/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#0d1117] rounded-xl h-80 animate-pulse border border-[#1a2235]" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[#8892a4] text-lg">No articles available yet. Check back soon.</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <div className="relative rounded-2xl overflow-hidden mb-8 border border-[#1a2235] group">
                {featured.imageUrl && (
                  <div className="absolute inset-0">
                    <Image src={featured.imageUrl} alt={featured.title} fill className="object-cover opacity-20 group-hover:opacity-30 transition-opacity" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#080b14] via-[#080b14]/85 to-transparent" />
                  </div>
                )}
                <div className="relative flex flex-col md:flex-row gap-6 p-8">
                  {featured.imageUrl && (
                    <div className="relative w-36 h-48 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                      <Image src={featured.imageUrl} alt={featured.title} fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="flex-1">
                    <span className="inline-block bg-[#e85d04] text-white text-xs font-bold px-2 py-0.5 rounded mb-3">FEATURED</span>
                    <Link href={`/news/${featured.id}`}>
                      <h2 className="text-2xl font-black text-white mb-3 hover:text-[#e85d04] transition-colors cursor-pointer">
                        {featured.title}
                      </h2>
                    </Link>
                    <p className="text-[#8892a4] mb-4 line-clamp-3 max-w-2xl">{featured.summary}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#8892a4]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(featured.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {featured.readTime && (
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{featured.readTime} min read</span>
                      )}
                      <span className="text-[#e85d04] font-semibold">{featured.source}</span>
                      {featured.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-xs bg-white/5 border border-white/10 text-[#8892a4] px-2 py-0.5 rounded">{t}</span>
                      ))}
                      <ShareButton title={featured.title} url={featured.url || ''} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((item) => (
                <article key={item.id} className="bg-[#0d1117] border border-[#1a2235] rounded-xl overflow-hidden group">
                  {item.imageUrl && (
                    <Link href={`/news/${item.id}`}>
                      <div className="relative h-44 overflow-hidden">
                        <Image src={item.imageUrl} alt={item.title} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                      </div>
                    </Link>
                  )}
                  <div className="p-5">
                    <span className="text-[#e85d04] text-xs font-bold">{item.source}</span>
                    <Link href={`/news/${item.id}`}>
                      <h3 className="text-white font-bold mt-1 mb-2 line-clamp-2 hover:text-[#e85d04] transition-colors cursor-pointer">
                        {item.title}
                      </h3>
                    </Link>
                    <p className="text-[#8892a4] text-sm line-clamp-2 mb-4">{item.summary}</p>
                    <div className="flex items-center justify-between text-xs text-[#8892a4] pt-3 border-t border-[#1a2235]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.upvotes
                          ? <span className="text-orange-400">↑ {item.upvotes.toLocaleString()}</span>
                          : <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.readTime || 3} min</span>
                        }
                        <ShareButton title={item.title} url={item.url || ''} />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
