/**
 * components/AdBanner.tsx
 * Clean ad slot — invisible placeholder until Google Ads loads.
 * In dev/no-client: renders a transparent reserved space (no ugly dashed borders).
 * In production: activates AdSense ins element.
 */
'use client';

import { useEffect, useRef } from 'react';

interface AdBannerProps {
  slot?: string;
  format?: 'horizontal' | 'vertical' | 'rectangle' | 'auto';
  className?: string;
  sticky?: boolean;
  label?: string;
}

declare global {
  interface Window { adsbygoogle?: unknown[]; }
}

const SIZE_MAP = {
  horizontal: { width: '100%',    minHeight: '90px'  },
  rectangle:  { width: '300px',   minHeight: '250px' },
  vertical:   { width: '160px',   minHeight: '600px' },
  auto:       { width: '100%',    minHeight: '100px' },
};

export default function AdBanner({
  slot,
  format = 'horizontal',
  className = '',
  sticky = false,
  label: _label,
}: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const size   = SIZE_MAP[format];

  useEffect(() => {
    if (client && typeof window !== 'undefined' && window.adsbygoogle) {
      try { window.adsbygoogle.push({}); } catch { /* not ready */ }
    }
  }, [client]);

  return (
    <div
      ref={adRef}
      className={`${sticky ? 'sticky top-20' : ''} ${className}`}
      style={{ width: size.width, minHeight: size.minHeight }}
      aria-hidden="true"
    >
      {client ? (
        /* Real AdSense unit — uncomment ins when approved */
        <div style={{ minHeight: size.minHeight }} />
        /*
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format === 'auto' ? 'auto' : undefined}
          data-full-width-responsive={format === 'auto' ? 'true' : undefined}
        />
        */
      ) : (
        /* Invisible reserved space — no borders, no text, nothing visible */
        <div style={{ width: '100%', height: size.minHeight }} />
      )}
    </div>
  );
}

export function AffiliateLink({
  href,
  children,
  type = 'other',
}: {
  href: string;
  children: React.ReactNode;
  type?: 'streaming' | 'merch' | 'manga' | 'other';
}) {
  const colors = {
    streaming: 'text-purple-600 hover:text-purple-700',
    merch:     'text-orange-600 hover:text-orange-700',
    manga:     'text-blue-600  hover:text-blue-700',
    other:     'text-[#e85d04] hover:text-[#c44e03]',
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`underline underline-offset-2 transition-colors ${colors[type]}`}
      data-affiliate-type={type}
    >
      {children}
    </a>
  );
}
