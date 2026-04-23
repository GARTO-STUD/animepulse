'use client';

interface AdBannerProps {
  slot: string;
  className?: string;
}

export default function AdBanner({ slot, className = '' }: AdBannerProps) {
  return (
    <div className={`bg-gray-800/50 rounded-lg p-4 text-center ${className}`}>
      <div className="text-gray-500 text-sm mb-2">Advertisement</div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-7944585824292210"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(adsbygoogle = window.adsbygoogle || []).push({});`,
        }}
      />
    </div>
  );
}
