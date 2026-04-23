'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, Tag, Play, ExternalLink, Copy, Check } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  sourceType: 'rss' | 'mal' | 'reddit';
  url: string;
  imageUrl?: string;
  publishedAt: string;
  tags: string[];
  readTime: number;
  upvotes?: number;
  youtubeId?: string;
}

function ShareDropdown({ title, url }: { title: string; url: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const twitterUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  function copyLink() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => { setCopied(false); setOpen(false); }, 1500); });
  }
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-sm font-bold transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share
      </button>
      {open && (
        <div className="absolute top-12 right-0 z-50 bg-[#0d1117] border border-[#1a2235] rounded-xl shadow-2xl overflow-hidden min-w-[170px]">
          <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#8892a4] hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Twitter / X
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#8892a4] hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L.057 23.547l5.835-1.53A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.365l-.358-.214-3.72.975.991-3.63-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
            WhatsApp
          </a>
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#8892a4] hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </a>
          <button onClick={copyLink} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#8892a4] hover:text-white hover:bg-white/5 transition-colors">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ArticleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch('/api/articles?limit=100')
      .then(r => r.json())
      .then(data => {
        const all: Article[] = data.articles || [];
        const found = all.find(a => a.id === id);
        setArticle(found || null);
        setRelated(all.filter(a => a.id !== id).slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#e85d04] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#8892a4]">Loading article...</p>
      </div>
    </div>
  );

  if (!article) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-white text-xl font-bold mb-2">Article not found</p>
        <p className="text-[#8892a4] mb-6">This article may have been removed or does not exist.</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-[#e85d04] text-white font-bold rounded-xl">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {article.imageUrl && (
        <div className="relative h-[300px] overflow-hidden">
          <Image src={article.imageUrl} alt={article.title} fill className="object-cover opacity-25" unoptimized priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080b14] via-[#080b14]/60 to-transparent" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[#8892a4] hover:text-white text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to News
        </button>

        <div className="mb-6">
          <span className="inline-block bg-[#e85d04]/15 border border-[#e85d04]/30 text-[#e85d04] text-xs font-bold px-3 py-1 rounded-full mb-4">
            {article.source}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#8892a4]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {article.readTime || 3} min read
            </span>
            {article.upvotes && <span className="text-orange-400 font-semibold">↑ {article.upvotes.toLocaleString()}</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <ShareDropdown title={article.title} url={pageUrl} />
          {article.url && (
            <a href={article.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0d1117] border border-[#1a2235] hover:border-[#e85d04]/40 text-[#8892a4] hover:text-white text-sm font-medium transition-all">
              <ExternalLink className="w-4 h-4" /> Original Source
            </a>
          )}
          {article.youtubeId && (
            <button onClick={() => setShowTrailer(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-400 hover:text-red-300 text-sm font-bold transition-all">
              <Play className="w-4 h-4 fill-red-400" /> Watch Trailer
            </button>
          )}
        </div>

        {article.imageUrl && (
          <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-[#1a2235] mb-8">
            <Image src={article.imageUrl} alt={article.title} fill className="object-cover" unoptimized />
          </div>
        )}

        <div className="text-[#8892a4] leading-relaxed space-y-4 mb-10">
          {article.content ? (
            article.content.split('\n').map((para, i) => {
              if (!para.trim()) return null;
              if (para.startsWith('## ')) return (
                <h2 key={i} className="text-white text-2xl font-black mt-8 mb-3 flex items-center gap-2">
                  <div className="w-1 h-6 bg-[#e85d04] rounded-full flex-shrink-0" />
                  {para.replace('## ', '')}
                </h2>
              );
              if (para.startsWith('### ')) return <h3 key={i} className="text-white text-xl font-bold mt-6 mb-2">{para.replace('### ', '')}</h3>;
              return <p key={i} className="text-[#8892a4] leading-relaxed">{para}</p>;
            })
          ) : (
            <p className="text-lg">{article.summary}</p>
          )}
        </div>

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-8 border-t border-[#1a2235]">
            <Tag className="w-4 h-4 text-[#8892a4] mt-0.5" />
            {article.tags.map(tag => (
              <span key={tag} className="text-xs bg-[#0d1117] border border-[#1a2235] text-[#8892a4] px-3 py-1 rounded-full hover:border-[#e85d04]/30 hover:text-[#e85d04] transition-colors cursor-default">
                {tag}
              </span>
            ))}
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-white text-xl font-black mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#e85d04] rounded-full" /> More Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map(r => (
                <Link key={r.id} href={`/news/${r.id}`}
                  className="flex gap-4 bg-[#0d1117] border border-[#1a2235] rounded-xl p-4 group hover:border-[#e85d04]/30 transition-colors">
                  {r.imageUrl && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={r.imageUrl} alt={r.title} fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#e85d04] text-xs font-bold mb-1">{r.source}</p>
                    <h3 className="text-white text-sm font-bold line-clamp-2 group-hover:text-[#e85d04] transition-colors">{r.title}</h3>
                    <p className="text-[#8892a4] text-xs mt-1">
                      {new Date(r.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {showTrailer && article.youtubeId && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowTrailer(false)}>
          <div className="relative w-full max-w-3xl aspect-video" onClick={e => e.stopPropagation()}>
            <iframe src={`https://www.youtube.com/embed/${article.youtubeId}?autoplay=1`}
              className="w-full h-full rounded-2xl" allowFullScreen allow="autoplay" />
            <button onClick={() => setShowTrailer(false)}
              className="absolute -top-10 right-0 text-white text-sm hover:text-[#e85d04] transition-colors">
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Required for Next.js static export — dynamic IDs are resolved client-side
export function generateStaticParams() {
  return [];
}
