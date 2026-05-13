'use client';
/**
 * NewsDetailClient.tsx — Article reader client component
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clock, Calendar, ChevronLeft, Share2, Copy, Check,
  ExternalLink, Flame, BookOpen, Play,
} from 'lucide-react';
import AdBanner from '@/components/AdBanner';
import { toast } from '@/components/Toast';
import TrailerModal from '@/components/TrailerModal';
import SmartAffiliateBanner from '@/components/SmartAffiliateBanner';

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  sourceType: string;
  url: string;
  imageUrl?: string | null;
  publishedAt: string;
  tags?: string[];
  readTime?: number;
  editorialNote?: string;
  verdict?: string;
  views?: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

/** Convert Markdown to basic HTML (no external dep needed) */
function markdownToHtml(md: string): string {
  return md
    .replace(/^#{1} (.+)$/gm, '<h1 class="text-2xl font-black text-[#0f172a] mt-8 mb-4" style="font-family:var(--font-syne)">$1</h1>')
    .replace(/^#{2} (.+)$/gm, '<h2 class="text-xl font-black text-[#0f172a] mt-8 mb-3" style="font-family:var(--font-syne)">$1</h2>')
    .replace(/^#{3} (.+)$/gm, '<h3 class="text-lg font-bold text-[#0f172a] mt-6 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#0f172a] font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-[#64748b]">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-[#e2e8f4] text-[#e85d04] px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^\- (.+)$/gm, '<li class="flex items-start gap-2 text-[#c8d0de] leading-relaxed py-1"><span class="text-[#e85d04] mt-1.5 flex-shrink-0">▸</span><span>$1</span></li>')
    .replace(/(<li.*<\/li>\n?)+/g, (match) => `<ul class="my-4 space-y-1 pl-2">${match}</ul>`)
    .replace(/^(?!<(?:h[123456]|ul|li|p))(.+)$/gm, '<p class="text-[#c8d0de] leading-relaxed my-3">$1</p>')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/<p class="[^"]*"><\/p>/g, '');
}

export default function NewsDetailClient({
  id,
  initialArticle,
}: {
  id: string;
  initialArticle: Record<string, unknown> | null;
}) {
  const [article, setArticle] = useState<Article | null>(initialArticle as Article | null);
  const [loading, setLoading] = useState(!initialArticle);
  const [copied, setCopied]   = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [readProgress, setReadProgress] = useState(0);
  const [showTrailer, setShowTrailer]   = useState(false);

  // Reading progress bar
  useEffect(() => {
    function handleScroll() {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      if (scrollHeight > 0) {
        setReadProgress(Math.min(100, Math.round((scrollTop / scrollHeight) * 100)));
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!initialArticle) {
      fetch(`/api/articles/${id}`)
        .then(r => r.json())
        .then(data => setArticle(data.article || null))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id, initialArticle]);

  // Load related articles — try multiple tags for better coverage
  useEffect(() => {
    if (!article?.tags?.length) return;
    const topTags = article.tags.slice(0, 2);
    Promise.all(
      topTags.map(tag =>
        fetch(`/api/articles?limit=6&tag=${encodeURIComponent(tag)}&status=published`)
          .then(r => r.json())
          .then(d => d.articles || [])
          .catch(() => [] as Article[])
      )
    ).then(results => {
      const seen = new Set<string>([id]);
      const merged: Article[] = [];
      for (const list of results) {
        for (const a of list as Article[]) {
          if (!seen.has(a.id)) { seen.add(a.id); merged.push(a); }
          if (merged.length >= 4) break;
        }
        if (merged.length >= 4) break;
      }
      setRelatedArticles(merged.slice(0, 4));
    });
  }, [article, id]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#e85d04] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex flex-col items-center justify-center gap-4">
        <span className="text-6xl">😔</span>
        <h1 className="text-white font-black text-2xl">Article Not Found</h1>
        <Link href="/news" className="flex items-center gap-2 text-[#e85d04] hover:underline">
          <ChevronLeft className="w-4 h-4" /> Back to News
        </Link>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const twitterShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 z-[60] h-0.5 bg-gradient-to-r from-[#e85d04] to-[#f48c06] transition-all duration-150"
        style={{ width: `${readProgress}%` }}
        aria-hidden="true"
      />

      {/* Hero Image */}
      {article.imageUrl && (
        <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080b14]/50 to-[#080b14]" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#64748b] mb-6">
          <Link href="/" className="hover:text-[#0f172a] transition-colors">Home</Link>
          <span>›</span>
          <Link href="/news" className="hover:text-[#0f172a] transition-colors">News</Link>
          <span>›</span>
          <span className="text-[#0f172a] line-clamp-1">{article.title}</span>
        </div>

        {/* Top Ad */}
        <AdBanner format="horizontal" className="mb-8" />

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Article */}
          <article className="flex-1 min-w-0">
            {/* Verdict */}
            {article.verdict && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e85d04]/10 border border-[#e85d04]/20 text-[#e85d04] text-sm font-bold mb-4">
                <Flame className="w-4 h-4" />
                {article.verdict}
              </div>
            )}

            {/* Title */}
            <h1 className="text-[#0f172a] font-black text-2xl sm:text-3xl lg:text-4xl leading-tight mb-4" style={{ fontFamily: 'var(--font-syne)' }}>
              {article.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#64748b] mb-6 pb-6 border-b border-[#e2e8f4]">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded bg-[#e85d04]/10 border border-[#e85d04]/20 flex items-center justify-center">
                  <Flame className="w-3 h-3 text-[#e85d04]" />
                </span>
                <span className="font-medium text-[#e85d04]">{article.source}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(article.publishedAt)}
              </span>
              {article.readTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {article.readTime} min read
                </span>
              )}
              {article.url && (
                <a href={article.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-[#0f172a] transition-colors">
                  <ExternalLink className="w-4 h-4" /> Source
                </a>
              )}
            </div>

            {/* Summary Callout */}
            <div className="bg-white border-l-4 border-[#e85d04] rounded-r-xl p-4 mb-8">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-[#e85d04]" />
                <span className="text-xs font-bold text-[#e85d04] uppercase tracking-wide">TL;DR</span>
              </div>
              <p className="text-[#c8d0de] text-sm leading-relaxed">{article.summary}</p>
            </div>

            {/* Article Body */}
            <div
              className="prose-custom mb-10"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(article.content) }}
            />

            {/* Editorial Hot Take */}
            {article.editorialNote && (
              <div className="bg-gradient-to-r from-[#e85d04]/10 to-transparent border border-[#e85d04]/20 rounded-2xl p-5 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-[#e85d04]" />
                  <span className="text-[#e85d04] font-black text-sm uppercase tracking-wide">AnimePulse Hot Take</span>
                </div>
                <p className="text-[#0f172a] text-sm leading-relaxed italic">"{article.editorialNote}"</p>
              </div>
            )}

            {/* Smart Affiliate Banner — auto-detects tags to show relevant links */}
            {article.tags && article.tags.length > 0 && (
              <SmartAffiliateBanner
                tags={article.tags}
                title={article.title}
                className="mb-8"
              />
            )}

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {article.tags.map(tag => (
                  <Link
                    key={tag}
                    href={`/news?tag=${encodeURIComponent(tag)}`}
                    className="text-xs bg-white border border-[#e2e8f4] text-[#64748b] px-3 py-1.5 rounded-full hover:border-[#e85d04]/30 hover:text-[#0f172a] transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Share Bar */}
            <div className="flex flex-wrap items-center gap-3 py-5 border-y border-[#e2e8f4] mb-10">
              <span className="text-sm text-[#64748b] font-medium">Share:</span>
              <a
                href={twitterShare}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#e2e8f4] text-sm text-[#64748b] hover:text-[#0f172a] hover:border-[#e85d04]/30 transition-colors"
              >
                <Share2 className="w-4 h-4" /> Twitter/X
              </a>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#e2e8f4] text-sm text-[#64748b] hover:text-[#0f172a] hover:border-[#e85d04]/30 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              {/* Trailer button — searches by article title */}
              <button
                onClick={() => setShowTrailer(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/10 border border-red-500/30 text-sm text-red-400 hover:text-[#0f172a] hover:bg-red-600 hover:border-red-500 transition-all font-semibold"
              >
                <Play className="w-4 h-4 fill-current" /> Watch Trailer
              </button>
            </div>

            {/* Trailer Modal */}
            <TrailerModal
              isOpen={showTrailer}
              onClose={() => setShowTrailer(false)}
              youtubeId={null}
              title={article.title}
            />

            {/* Bottom Ad */}
            <AdBanner format="horizontal" className="mb-10" />

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <section className="mt-2">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-6 bg-gradient-to-b from-[#e85d04] to-[#f48c06] rounded-full" />
                  <h2 className="text-[#0f172a] font-black text-xl" style={{ fontFamily: 'var(--font-syne)' }}>
                    Keep Reading
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedArticles.map((rel, idx) => (
                    <Link
                      key={rel.id}
                      href={`/news/${rel.id}`}
                      className={`group flex flex-col rounded-2xl bg-white border border-[#e2e8f4] overflow-hidden hover:border-[#e85d04]/40 hover:shadow-lg hover:shadow-orange-500/8 transition-all duration-300 ${idx === 0 && relatedArticles.length >= 3 ? 'sm:col-span-2' : ''}`}
                    >
                      {rel.imageUrl && (
                        <div className={`relative overflow-hidden flex-shrink-0 ${idx === 0 && relatedArticles.length >= 3 ? 'h-40' : 'h-32'}`}>
                          <Image
                            src={rel.imageUrl}
                            alt={rel.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          {rel.verdict && (
                            <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-[#e85d04]/90 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                              {rel.verdict.slice(0, 18)}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="text-[#0f172a] text-sm font-bold line-clamp-2 group-hover:text-[#e85d04] transition-colors leading-snug mb-2" style={{ fontFamily: 'var(--font-syne)' }}>
                          {rel.title}
                        </h3>
                        {rel.summary && (
                          <p className="text-[#64748b] text-xs line-clamp-2 mb-3 leading-relaxed">
                            {rel.summary}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#f1f5f9]">
                          <div className="flex items-center gap-2 text-[10px] text-[#94a3b8]">
                            <span className="text-[#e85d04] font-semibold text-[10px]">{rel.source}</span>
                            <span>·</span>
                            <span>{new Date(rel.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <span className="text-[10px] text-[#e85d04] font-bold group-hover:translate-x-0.5 transition-transform inline-block">
                            Read →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* View all related tag link */}
                {article.tags && article.tags.length > 0 && (
                  <div className="mt-4 text-center">
                    <Link
                      href={`/news?tag=${encodeURIComponent(article.tags[0])}`}
                      className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#e85d04] transition-colors"
                    >
                      More about #{article.tags[0]}
                      <ChevronLeft className="w-4 h-4 rotate-180" />
                    </Link>
                  </div>
                )}
              </section>
            )}
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <AdBanner format="rectangle" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
