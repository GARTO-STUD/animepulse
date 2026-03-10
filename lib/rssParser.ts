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
  { name: 'Crunchyroll News', url: 'https://www.crunchyroll.com/news/rss', category: 'News' },
  { name: 'Anime News Network', url: 'https://www.animenewsnetwork.com/all/rss.xml?ann-edition=w', category: 'News' },
  { name: 'MyAnimeList News', url: 'https://myanimelist.net/rss/news.rss', category: 'News' },
  { name: 'Otaku USA Magazine', url: 'https://otakuusamagazine.com/feed/', category: 'News' },
  { name: 'Anime UK News', url: 'https://animeuknews.net/feed/', category: 'News' },
];

/**
 * Parse RSS XML to JSON
 */
function parseRSSXML(xml: string, sourceName: string): AnimeNewsItem[] {
  const items: AnimeNewsItem[] = [];
  
  // Extract items
  const itemRegex = /<item>[\s\S]*?<\/item>/g;
  const titleRegex = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/title>/i;
  const linkRegex = /<link>([^<]*)<\/link>/i;
  const descRegex = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/description>/i;
  const dateRegex = /<pubDate>([^<]*)<\/pubDate>/i;
  
  // Image patterns
  const mediaThumbnailRegex = /<(?:media:thumbnail|thumbnail)[^>]+url="([^"]+)"/i;
  const mediaContentRegex = /<(?:media:content|content)[^>]+url="([^"]+)"/i;
  const imgSrcRegex = /<img[^>]+src="([^"]+)[^>]*>/i;
  const enclosureRegex = /<enclosure[^>]+url="([^"]+)"[^>]*type="image[^"]*"/i;

  const matches = xml.match(itemRegex) || [];
  
  for (const item of matches.slice(0, 5)) {
    const title = item.match(titleRegex)?.[1]?.trim() || '';
    const link = item.match(linkRegex)?.[1]?.trim() || '';
    const description = item.match(descRegex)?.[1]?.trim() || '';
    const pubDateStr = item.match(dateRegex)?.[1]?.trim() || '';

    // Extract image
    let imageUrl: string | undefined;
    const mediaMatch = item.match(mediaThumbnailRegex) || item.match(mediaContentRegex) || item.match(enclosureRegex);
    if (mediaMatch) imageUrl = mediaMatch[1];
    if (!imageUrl) {
      const imgMatch = item.match(imgSrcRegex) || description.match(imgSrcRegex);
      if (imgMatch) imageUrl = imgMatch[1];
    }
    
    if (title && link) {
      const cleanTitle = title.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '');
      const cleanDesc = description
        .replace(/<!\[CDATA\[/g, '')
        .replace(/\]\]>/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

      const shortDesc = cleanDesc.substring(0, 200) + (cleanDesc.length > 200 ? '...' : '');
      
      items.push({
        title: cleanTitle,
        link,
        description: shortDesc,
        pubDate: pubDateStr ? new Date(pubDateStr) : new Date(),
        source: sourceName,
        imageUrl: imageUrl?.replace(/&amp;/g, '&'),
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
  
  // Return unique items by title and sort by date
  const uniqueNews = Array.from(new Map(allNews.map(item => [item.title, item])).values());
  return uniqueNews.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime()).slice(0, 15);
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
  ];
}
