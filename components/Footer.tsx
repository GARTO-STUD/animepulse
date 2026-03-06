import Link from 'next/link';
import { Twitter, Facebook, Instagram, Youtube } from 'lucide-react';

const socialLinks = [
  { name: 'Twitter', href: 'https://twitter.com/animepulse', icon: Twitter },
  { name: 'Facebook', href: 'https://facebook.com/animepulse', icon: Facebook },
  { name: 'Instagram', href: 'https://instagram.com/animepulse', icon: Instagram },
  { name: 'YouTube', href: 'https://youtube.com/animepulse', icon: Youtube },
];

const footerLinks = {
  pages: [
    { name: 'Home', href: '/' },
    { name: 'News', href: '/news' },
    { name: 'Trending', href: '/trending' },
    { name: 'Reviews', href: '/reviews' },
    { name: 'Top 10', href: '/top-10' },
  ],
  legal: [
    { name: 'About Us', href: '/about-us' },
    { name: 'Contact Us', href: '/contact-us' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="text-2xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              AnimePulse
            </Link>
            <p className="text-gray-400 mt-4 mb-6 max-w-md">
              Your ultimate destination for anime news, reviews, and trending shows. 
              Stay updated with the latest in the anime world.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-indigo-600 hover:text-white transition-colors"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold uppercase mb-4">Pages</h4>
            <ul className="space-y-2">
              {footerLinks.pages.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold uppercase mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} AnimePulse. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
