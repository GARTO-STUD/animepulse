import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

// App URL for SEO
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://animepulse.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "AnimePulse | Your Ultimate Anime Destination",
    template: "%s | AnimePulse",
  },
  description: "Discover the latest anime news, reviews, trending shows, and top rankings. Your trusted source for all things anime.",
  keywords: [
    "anime", "manga", "anime news", "anime reviews", "trending anime", 
    "top anime", "animepulse", "anime updates", "japanese animation",
    "crunchyroll", "myanimelist", "anime recommendations", "best anime"
  ],
  authors: [{ name: "AnimePulse", url: APP_URL }],
  creator: "AnimePulse",
  publisher: "AnimePulse",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "en": "/",
      "ar": "/",
      "ja": "/",
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon.ico',
  },
  // manifest: '/site.webmanifest', // أضفه بعد إنشاء الملف
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "AnimePulse",
    title: "AnimePulse | Your Ultimate Anime Destination",
    description: "Discover the latest anime news, reviews, trending shows, and top rankings. Your trusted source for all things anime.",
    images: [
      {
        url: `${APP_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "AnimePulse - Your Ultimate Anime Destination",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AnimePulse | Your Ultimate Anime Destination",
    description: "Discover the latest anime news, reviews, trending shows, and top rankings. Your trusted source for all things anime.",
    site: "@AnimePulseChannel",
    creator: "@AnimePulseChannel",
    images: [`${APP_URL}/og-image.jpg`],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  other: {
    "telegram:channel": "@AnimePulseChannel",
  },
};

// JSON-LD Structured Data
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AnimePulse",
  url: APP_URL,
  description: "Your Ultimate Anime Destination - News, Reviews, and Trending Anime",
  potentialAction: {
    "@type": "SearchAction",
    target: `${APP_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: "AnimePulse",
    url: APP_URL,
    logo: {
      "@type": "ImageObject",
      url: `${APP_URL}/logo.png`,
    },
    sameAs: [
      "https://t.me/AnimePulseChannel",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7944585824292210"
          crossOrigin="anonymous"
        />
        <meta name="google-adsense-account" content="ca-pub-7944585824292210" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
