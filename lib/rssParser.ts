/**
 * RSS Parser for AnimePulse
 * Fetches anime news from various RSS sources
 */

export interface AnimeNewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  source: string;
  imageUrl?: string;
  categories?: string[];
}

const RSS_SOURCES = [
  {
    name: 'Crunchyroll News',
    url: 'https://feeds.feedburner.com/crunchyroll/animenews',
    category: 'News',
  },
  {
    name: 'MyAnimeList News',
    url: 'https://myanimelist.net/rss/news.rss',
    category: 'News',
  },
  {
    name: 'Anime News Network',
    url: 'https://www.animenewsnetwork.com/news/rss.xml',
    category: 'News',
  },
  {
    name: 'Otaku USA Magazine',
    url: 'https://otakuusamagazine.com/feed/',
    category: 'News',
  },
  {
    name: 'Anime UK News',
    url: 'https://animeuknews.net/feed/',
    category: 'News',
  },
  {
    name: 'Manga Updates',
    url: 'https://www.mangaupdates.com/rss/news.xml',
    category: 'News',
  },
  {
    name: 'AniTrendz',
    url: 'https://anitrendz.net/rss',
    category: 'News',
  },
];

/**
 * Parse RSS XML to JSON
 */
function parseRSSXML(xml: string, sourceName: string): AnimeNewsItem[] {
  const items: AnimeNewsItem[] = [];
  
  // Simple regex-based RSS parsing (for demo purposes)
  // In production, use a proper RSS parser like rss-parser
  const itemRegex = /<item>[\s\S]*?<\/item>/g;
  const titleRegex = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/title>/i;
  const linkRegex = /<link>([^<]*)<\/link>/i;
  const descRegex = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/description>/i;
  const dateRegex = /<pubDate>([^<]*)<\/pubDate>/i;

  // Image patterns in RSS
  const mediaThumbnailRegex = /<media:thumbnail[^>]+url="([^"]+)"/i;
  const mediaContentRegex = /<media:content[^>]+url="([^"]+)"[^>]*>[\s\S]*?<\/media:content>/i;
  const imgSrcRegex = /<img[^>]+src="([^"]+)[^>]*>/i;
  const enclosureRegex = /<enclosure[^>]+url="([^"]+)"[^>]*type="image[^"]*"/i;
  
  const matches = xml.match(itemRegex) || [];
  
  for (const item of matches.slice(0, 5)) { // Get top 5 items
    const title = item.match(titleRegex)?.[1]?.trim() || '';
    const link = item.match(linkRegex)?.[1]?.trim() || '';
    const description = item.match(descRegex)?.[1]?.trim() || '';
    const pubDateStr = item.match(dateRegex)?.[1]?.trim() || '';

    // Extract image from various RSS formats
    let imageUrl: string | undefined;

    // Try media:thumbnail first
    const mediaMatch = item.match(mediaThumbnailRegex);
    if (mediaMatch) imageUrl = mediaMatch[1];

    // Try media:content
    if (!imageUrl) {
      const contentMatch = item.match(mediaContentRegex);
      if (contentMatch) imageUrl = contentMatch[1];
    }

    // Try enclosure
    if (!imageUrl) {
      const enclosureMatch = item.match(enclosureRegex);
      if (enclosureMatch) imageUrl = enclosureMatch[1];
    }

    // Try img tag in description
    if (!imageUrl) {
      const imgMatch = description.match(imgSrcRegex);
      if (imgMatch) imageUrl = imgMatch[1];
    }
    
    if (title && link) {
      // Clean up CDATA and HTML entities
      const cleanTitle = title.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
      const rawDesc = description
        .replace(/<!\[CDATA\[/g, '')
        .replace(/\]\]>/g, '')
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .trim();
      const cleanDesc = rawDesc.length > 200 ? rawDesc.substring(0, 197) + '...' : rawDesc;
      
      items.push({
        title: cleanTitle,
        link,
        description: cleanDesc,
        pubDate: pubDateStr ? new Date(pubDateStr) : new Date(),
        source: sourceName,
        imageUrl,
        categories: ['anime', 'news'],
      });
    }
  }
  
  return items;
}

/**
 * Fetch RSS from all sources
 */
export async function fetchAnimeRSS(): Promise<AnimeNewsItem[]> {
  const allNews: AnimeNewsItem[] = [];
  
  for (const source of RSS_SOURCES) {
    try {
      console.log(`📡 Fetching from ${source.name}...`);
      
      // Note: In production, use actual RSS fetching
      // For now, we'll simulate with sample data
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'AnimePulse Bot/1.0',
        },
      });
      
      if (response.ok) {
        const xml = await response.text();
        const items = parseRSSXML(xml, source.name);
        allNews.push(...items);
      }
    } catch (error) {
      console.error(`❌ Failed to fetch from ${source.name}:`, error);
    }
  }
  
  // Sort by date (newest first)
  return allNews.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime()).slice(0, 10);
}

/**
 * Generate sample anime news (for testing)
 */
export function getSampleAnimeNews(): AnimeNewsItem[] {
  return [
    {
      title: 'Attack on Titan Final Season Part 4 Release Date Announced',
      link: 'https://example.com/aot',
      description: 'The epic conclusion to the Attack on Titan saga finally has a confirmed release date for 2025.',
      pubDate: new Date(),
      source: 'Crunchyroll News',
      categories: ['anime', 'announcement'],
    },
    {
      title: 'New Studio Ghibli Film in Production',
      link: 'https://example.com/ghibli',
      description: 'Hayao Miyazaki is reportedly working on another project despite previous retirement announcements.',
      pubDate: new Date(Date.now() - 3600000),
      source: 'Anime News Network',
      categories: ['anime', 'movie'],
    },
    {
      title: 'Jujutsu Kaisen Season 3 Confirmed',
      link: 'https://example.com/jjk',
      description: 'The adaptation of the Culling Game arc has been officially announced for 2026.',
      pubDate: new Date(Date.now() - 7200000),
      source: 'MyAnimeList',
      categories: ['anime', 'announcement'],
    },
  ];
}
