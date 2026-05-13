import Link from 'next/link';
import { Flame, Youtube, Instagram } from 'lucide-react';


function RssIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

const links = {
  explore: [
    { name: 'Latest News',    href: '/news' },
    { name: 'Trending Anime', href: '/trending' },
    { name: 'Anime Calendar', href: '/calendar' },
    { name: 'Top 10 List',    href: '/top-10' },
    { name: 'Reviews',        href: '/reviews' },
    { name: 'Blog',           href: '/blog' },
  ],
  company: [
    { name: 'About Us',         href: '/about-us' },
    { name: 'Contact',          href: '/contact-us' },
    { name: 'Privacy Policy',   href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
  ],
};

const socials = [
  { icon: XIcon,       href: 'https://twitter.com/animepulse',   label: 'X (Twitter)' },
  { icon: Youtube,     href: 'https://youtube.com/animepulse',    label: 'YouTube' },
  { icon: Instagram,   href: 'https://instagram.com/animepulse',  label: 'Instagram' },
  { icon: RssIcon,     href: '/feed.xml',                         label: 'RSS Feed' },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#e2e8f4] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e85d04] to-[#f48c06] flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black text-[#0f172a]">Anime<span className="text-[#e85d04]">Pulse</span></span>
            </Link>
            <p className="text-[#64748b] text-sm leading-relaxed max-w-sm mb-6">
              Your #1 source for anime news, trending rankings, top 10 lists, and honest reviews — updated daily.
            </p>
            <div className="flex items-center gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('/') ? '_self' : '_blank'}
                  rel={href.startsWith('/') ? undefined : 'noopener noreferrer'}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-[#f8f9fc] border border-[#e2e8f4] flex items-center justify-center text-[#64748b] hover:text-[#e85d04] hover:border-[#e85d04]/30 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[#0f172a] text-sm font-bold uppercase tracking-wider mb-4">Explore</h4>
            <ul className="space-y-2.5">
              {links.explore.map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="text-[#64748b] text-sm hover:text-[#e85d04] transition-colors">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[#0f172a] text-sm font-bold uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5">
              {links.company.map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="text-[#64748b] text-sm hover:text-[#e85d04] transition-colors">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#e2e8f4] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#94a3b8] text-xs">
            © {new Date().getFullYear()} AnimePulse. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
