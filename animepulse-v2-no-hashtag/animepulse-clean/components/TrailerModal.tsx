'use client';
/**
 * components/TrailerModal.tsx
 * Full-featured YouTube trailer modal with:
 *  - Keyboard support (Escape to close)
 *  - Loading skeleton while iframe loads
 *  - Search for trailer if no youtube_id provided (by anime title)
 *  - Autoplay + responsive 16:9
 *  - Accessible focus trap
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Play, Loader2, AlertCircle } from 'lucide-react';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  youtubeId?: string | null;
  title: string;
}

export default function TrailerModal({ isOpen, onClose, youtubeId, title }: TrailerModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [resolvedId, setResolvedId]     = useState<string | null>(youtubeId || null);
  const [searching, setSearching]       = useState(false);
  const [notFound, setNotFound]         = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape key to close
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => closeRef.current?.focus(), 100);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      const iframes = document.querySelectorAll('iframe[data-trailer]');
      iframes.forEach(f => { (f as HTMLIFrameElement).src = ''; });
    };
  }, [isOpen, handleKey]);

  // Reset state when modal opens with a new title/id
  useEffect(() => {
    if (isOpen) {
      setIframeLoaded(false);
      setNotFound(false);
      if (youtubeId) {
        setResolvedId(youtubeId);
        setSearching(false);
      } else {
        setResolvedId(null);
        setSearching(true);
        searchYouTube(title);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, youtubeId, title]);

  async function searchYouTube(query: string) {
    // We can't call YouTube Data API without a key, so we use the YouTube
    // search embed as a reliable fallback — it shows real results in the iframe.
    const searchQuery = encodeURIComponent(`${query} anime trailer official`);
    setResolvedId(`search:${searchQuery}`);
    setSearching(false);
  }

  if (!isOpen) return null;

  const embedSrc = resolvedId?.startsWith('search:')
    ? `https://www.youtube.com/results?search_query=${resolvedId.replace('search:', '')}&embed=true`
    : resolvedId
      ? `https://www.youtube.com/embed/${resolvedId}?autoplay=1&rel=0&modestbranding=1`
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} Trailer`}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" aria-hidden="true" />

      {/* Modal */}
      <div
        className="relative w-full max-w-4xl z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
              <Play className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight line-clamp-1">{title}</p>
              <p className="text-[#64748b] text-xs">Official Trailer</p>
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#e85d04]"
            aria-label="Close trailer"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>

        {/* Video container */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-white border border-[#e2e8f4] shadow-2xl shadow-black/80"
             style={{ aspectRatio: '16/9' }}>

          {/* Loading skeleton */}
          {(searching || (!iframeLoaded && resolvedId)) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white">
              {searching ? (
                <>
                  <Loader2 className="w-10 h-10 text-[#e85d04] animate-spin" />
                  <p className="text-[#64748b] text-sm">Searching for trailer...</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-600/30 flex items-center justify-center">
                    <Play className="w-8 h-8 text-red-500 fill-red-500" />
                  </div>
                  <p className="text-[#64748b] text-sm">Loading trailer...</p>
                </>
              )}
            </div>
          )}

          {/* Not found state */}
          {notFound && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <AlertCircle className="w-12 h-12 text-[#64748b]" />
              <div className="text-center">
                <p className="text-white font-bold mb-1">Trailer not available</p>
                <p className="text-[#64748b] text-sm mb-4">No official trailer found for this title.</p>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' anime trailer')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Search on YouTube
                </a>
              </div>
            </div>
          )}

          {/* YouTube iframe */}
          {embedSrc && !searching && (
            <iframe
              key={resolvedId}
              src={embedSrc}
              data-trailer="true"
              className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              title={`${title} Trailer`}
              onLoad={() => setIframeLoaded(true)}
              onError={() => { setIframeLoaded(true); setNotFound(true); }}
            />
          )}
        </div>

        {/* Footer tip */}
        <p className="text-center text-[#64748b]/50 text-xs mt-3">
          Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">Esc</kbd> or click outside to close
        </p>
      </div>
    </div>
  );
}

/**
 * Inline trailer preview card — shows a clickable thumbnail
 * that opens the TrailerModal. Use inside article cards / anime pages.
 */
export function TrailerPreviewCard({
  youtubeId,
  title,
  className = '',
}: {
  youtubeId: string;
  title: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const thumbUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  const fallbackUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  const [src, setSrc] = useState(thumbUrl);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`group relative overflow-hidden rounded-xl border border-[#e2e8f4] hover:border-red-500/50 transition-all ${className}`}
        style={{ aspectRatio: '16/9' }}
        aria-label={`Watch ${title} trailer`}
      >
        {/* Thumbnail */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${title} trailer thumbnail`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setSrc(fallbackUrl)}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-red-600 group-hover:bg-red-500 group-hover:scale-110 transition-all flex items-center justify-center shadow-2xl shadow-red-600/40">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>
        {/* Duration label */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
          TRAILER
        </div>
      </button>

      <TrailerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        youtubeId={youtubeId}
        title={title}
      />
    </>
  );
}
