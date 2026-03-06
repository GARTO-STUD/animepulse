import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AnimePulse | Your Ultimate Anime Destination",
  description: "Discover the latest anime news, reviews, trending shows, and top rankings. Your trusted source for all things anime.",
  keywords: ["anime", "manga", "news", "reviews", "trending", "top anime", "animepulse"],
  authors: [{ name: "AnimePulse" }],
  openGraph: {
    title: "AnimePulse",
    description: "Your Ultimate Anime Destination",
    url: "https://animepulse.vercel.app",
    siteName: "AnimePulse",
    locale: "en_US",
    type: "website",
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
        {/* Google AdSense */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7944585824292210" crossOrigin="anonymous" />
        <meta name="google-adsense-account" content="ca-pub-7944585824292210" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
