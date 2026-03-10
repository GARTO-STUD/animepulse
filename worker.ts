/** * Cloudflare Worker for AnimePulse Auto-Pilot */
export interface Env {
  ANIMEPULSE_KV: KVNamespace;
  CRON_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHANNEL_ID: string;
  GEMINI_API_KEY: string;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  tags: string[];
  postedToTelegram: boolean;
}

// RSS Sources
const RSS_SOURCES = [
  { name: 'Crunchyroll News', url: 'https://www.crunchyroll.com/news/rss', category: 'News' },
  { name: 'Anime News Network', url: 'https://www.animenewsnetwork.com/all/rss.xml?ann-edition=w', category: 'News' },
  { name: 'MyAnimeList News', url: 'https://myanimelist.net/rss/news.rss', category: 'News' },
  { name: 'Otaku USA Magazine', url: 'https://otakuusamagazine.com/feed/', category: 'News' },
  { name: 'Anime UK News', url: 'https://animeuknews.net/feed/', category: 'News' },
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse();
    }

    const secret = url.searchParams.get('secret');

    // PUBLIC endpoint - no auth required (for website)
    if (url.pathname === '/news') {
      const news = await getStoredNews(env);
      return jsonResponse({ news, total: news.length });
    }

    // Health check endpoint
    if (url.pathname === '/') {
      return jsonResponse({ message: 'AnimePulse Worker Running', version: '1.1.0' });
    }

    // PROTECTED endpoints - require secret
    if (secret !== env.CRON_SECRET) {
      return jsonResponse({ error: 'Unauthorized - valid secret required' }, 401);
    }

    if (url.pathname === '/auto-pilot') {
      const result = await runAutoPilot(env);
      return jsonResponse(result);
    }

    if (url.pathname === '/fetch-rss') {
      const result = await fetchAllRSS();
      return jsonResponse(result);
    }

    return jsonResponse({ error: 'Not Found' }, 404);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runAutoPilot(env).catch(console.error));
  },
};

async function runAutoPilot(env: Env) {
  const results = {
    newsFetched: 0,
    articlesGenerated: 0,
    telegramPosted: 0,
  };

  try {
    // Fetch REAL RSS items
    const rssItems = await fetchAllRSS();
    results.newsFetched = rssItems.length;

    if (rssItems.length === 0) {
      return { success: true, message: 'No new RSS items found', ...results };
    }

    const existingNews = await getStoredNews(env);
    const existingTitles = new Set(existingNews.map((n) => n.title.toLowerCase()));

    let newItemsCount = 0;
    for (const item of rssItems.slice(0, 5)) { // Process top 5 new items
      if (existingTitles.has(item.title.toLowerCase())) continue;

      const article = await generateArticle(item, env);
      const newsItem: NewsItem = {
        id: generateId(),
        title: article.title,
        content: article.content,
        summary: article.summary,
        source: item.source,
        url: item.link,
        imageUrl: item.imageUrl,
        publishedAt: new Date().toISOString(),
        tags: article.tags,
        postedToTelegram: false,
      };

      existingNews.unshift(newsItem);
      newItemsCount++;
      results.articlesGenerated++;

      if (env.TELEGRAM_BOT_TOKEN && newItemsCount <= 3) {
        const posted = await postToTelegram(newsItem, env);
        if (posted) results.telegramPosted++;
      }
    }

    // Explicitly save to KV
    if (newItemsCount > 0) {
      await env.ANIMEPULSE_KV.put('news', JSON.stringify(existingNews.slice(0, 50)));
    }
    
    return { 
      success: true, 
      message: `Fetched ${rssItems.length} RSS items, added ${newItemsCount} new articles`,
      ...results, 
      timestamp: new Date().toISOString() 
    };
  } catch (error) {
    return { success: false, error: String(error), ...results };
  }
}

// Fetch RSS from all sources
async function fetchAllRSS(): Promise<Array<{title: string, description: string, link: string, source: string, imageUrl?: string}>> {
  const allNews: Array<{title: string, description: string, link: string, source: string, imageUrl?: string}> = [];
  
  for (const source of RSS_SOURCES) {
    try {
      console.log(`📡 Fetching from ${source.name}...`);
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'AnimePulse Bot/1.0' },
      });
      
      if (!response.ok) {
        console.warn(`⚠️ ${source.name} returned ${response.status}`);
        continue;
      }
      
      const xml = await response.text();
      const items = parseRSSXML(xml, source.name);
      
      for (const item of items) {
        allNews.push({
          title: item.title,
          description: item.description,
          link: item.link,
          source: source.name,
          imageUrl: item.imageUrl,
        });
      }
    } catch (error) {
      console.error(`❌ Failed to fetch from ${source.name}:`, error);
    }
  }
  
  // Return unique items (by title)
  const uniqueNews = Array.from(new Map(allNews.map(item => [item.title, item])).values());
  return uniqueNews.slice(0, 15);
}

// Parse RSS XML with image extraction
function parseRSSXML(xml: string, sourceName: string) {
  const items: Array<{title: string, link: string, description: string, pubDate: Date, imageUrl?: string}> = [];
  
  // Extract items
  const itemRegex = /<item>[\s\S]*?<\/item>/g;
  const titleRegex = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/title>/i;
  const linkRegex = /<link>([^<]*)<\/link>/i;
  const descRegex = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\])?<\/description>/i;
  const dateRegex = /<pubDate>([^<]*)<\/pubDate>/i;
  
  // Image patterns in RSS
  const mediaThumbnailRegex = /<(?:media:thumbnail|thumbnail)[^>]+url="([^"]+)"/i;
  const mediaContentRegex = /<(?:media:content|content)[^>]+url="([^"]+)"/i;
  const imgSrcRegex = /<img[^>]+src="([^"]+)[^>]*>/i;
  const enclosureRegex = /<enclosure[^>]+url="([^"]+)"[^>]*type="image[^"]*"/i;
  
  const matches = xml.match(itemRegex) || [];
  
  for (const item of matches.slice(0, 5)) {
    const title = item.match(titleRegex)?.[1]?.trim() || '';
    const link = item.match(linkRegex)?.[1]?.trim() || '';
    const description = item.match(descRegex)?.[1]?.trim() || '';
    const dateStr = item.match(dateRegex)?.[1]?.trim() || '';
    
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
    
    // Try img tag in description or item content
    if (!imageUrl) {
      const imgMatch = item.match(imgSrcRegex) || description.match(imgSrcRegex);
      if (imgMatch) imageUrl = imgMatch[1];
    }
    
    if (title && link) {
      // Clean up CDATA and HTML
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

      const shortDesc = cleanDesc.substring(0, 250) + (cleanDesc.length > 250 ? '...' : '');
      
      items.push({
        title: cleanTitle,
        link,
        description: shortDesc,
        pubDate: dateStr ? new Date(dateStr) : new Date(),
        imageUrl: imageUrl?.replace(/&amp;/g, '&'),
      });
    }
  }
  
  return items;
}

async function getStoredNews(env: Env): Promise<NewsItem[]> {
  try {
    const stored = await env.ANIMEPULSE_KV.get('news');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Error getting stored news:', e);
    return [];
  }
}

async function generateArticle(
  item: { title: string; description: string },
  env: Env
) {
  const prompt = `Write an engaging anime news article about: ${item.title}\n\nDescription: ${item.description}\n\nSummary after ---SUMMARY---\nTags after ---TAGS--- (comma-separated)`;

  const fallbackArticle = {
    title: item.title,
    content: `# ${item.title}\n\n${item.description}\n\n## Community Reaction\n\nThe anime community has been quick to react to this news. Fans on social media are expressing excitement and sharing their expectations. This update is certainly one of the highlights of the week in the industry.\n\n## Why It Matters\n\nDevelopments like this often signal new trends or major shifts in the anime landscape. Whether it's a new season announcement or a production update, it keeps the spirit of the medium alive and thriving.\n\nStay tuned to AnimePulse for more in-depth coverage and future updates on this story!\n\n*Content generated by AnimePulse Auto-Pilot Fallback System.*`,
    summary: item.description,
    tags: ['anime', 'news', 'update'],
  };

  if (!env.GEMINI_API_KEY) {
    return fallbackArticle;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
       console.error('Gemini API Error:', data.error.message);
       return fallbackArticle;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const [content, rest] = text.split('---SUMMARY---');
    const [summary, tagsStr] = (rest || '').split('---TAGS---');

    return {
      title: item.title,
      content: content?.trim() || `# ${item.title}\n\n${item.description}`,
      summary: summary?.trim() || item.description,
      tags: tagsStr?.split(',').map((t: string) => t.trim()).filter((t: string) => t) || ['anime', 'news'],
    };
  } catch (error) {
    console.warn('Using fallback content for:', item.title);
    return fallbackArticle;
  }
}

async function postToTelegram(newsItem: NewsItem, env: Env): Promise<boolean> {
  if (!env.TELEGRAM_BOT_TOKEN) return false;

  const message = `🎌 **${newsItem.title}**\n\n${newsItem.summary}\n\n🔗 ${newsItem.url}\n\n📢 @AnimePulseChannel`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHANNEL_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    const data = await response.json();
    return data.ok;
  } catch {
    return false;
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// CORS headers for cross-origin requests
function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function corsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}