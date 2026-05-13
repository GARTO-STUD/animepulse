'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console in dev — swap for Sentry/logging service in prod
    console.error('[AnimePulse Error]', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>

      <h1 className="text-[#0f172a] font-black text-2xl mb-2" style={{ fontFamily: 'var(--font-syne)' }}>
        Something went wrong
      </h1>
      <p className="text-[#64748b] text-sm mb-8 max-w-sm">
        An unexpected error occurred. Try refreshing — if it persists, the issue is on our end.
      </p>

      {error.digest && (
        <p className="text-[#64748b]/50 text-xs mb-6 font-mono">
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#e85d04] hover:bg-[#f48c06] text-[#0f172a] font-bold rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e2e8f4] hover:border-[#e85d04]/40 text-[#0f172a] font-bold rounded-xl transition-colors"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
      </div>
    </div>
  );
}
