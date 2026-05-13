'use client';
/**
 * /search — Full-text search across articles
 */

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import ArticleCard, { type ArticleCardData } from '@/components/ArticleCard';

function SearchResults() {
  const params   = useSearchParams();
  const query    = params.get('q') || '';
  const [results, setResults]   = useState<ArticleCardData[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(false);
    try {
      // Server-side search — fast, no over-fetching
      const res  = await fetch(`/api/articles?q=${encodeURIComponent(q.trim())}&limit=50&status=published`);
      const data = await res.json();
      setResults(data.articles || []);
    } catch { setResults([]); }
    finally { setLoading(false); setSearched(true); }
  }, []);

  useEffect(() => { if (query) runSearch(query); }, [query, runSearch]);

  return (
    <div className="min-h-screen bg-[#f8f9fc] max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-2">
        <Search className="w-5 h-5 text-[#e85d04]" />
        <h1 className="text-[#0f172a] font-black text-2xl" style={{ fontFamily: 'var(--font-syne)' }}>Search</h1>
      </div>
      {query && (
        <p className="text-[#64748b] text-sm mb-8">
          {loading ? 'Searching…' : searched ? `${results.length} results for "${query}"` : ''}
        </p>
      )}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#e85d04] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-20">
          <X className="w-12 h-12 mx-auto mb-3 text-[#64748b] opacity-30" />
          <p className="text-[#0f172a] font-bold mb-1">No results found</p>
          <p className="text-[#64748b] text-sm">Try different keywords</p>
        </div>
      )}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(a => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return <Suspense><SearchResults /></Suspense>;
}
