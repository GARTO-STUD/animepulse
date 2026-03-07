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
  publishedAt: string;
  tags: string[];
  postedToTelegram: boolean;
}

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
      return jsonResponse({ message: 'AnimePulse Worker Running', version: '1.0.0' });
    }

    // PROTECTED endpoints - require secret
    if (secret !== env.CRON_SECRET) {
      return jsonResponse({ error: 'Unauthorized - valid secret required' }, 401);
    }

    if (url.pathname === '/auto-pilot') {
      const result = await runAutoPilot(env);
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
    const newsItems = getSampleNews();
    results.newsFetched = newsItems.length;

    const existingNews = await getStoredNews(env);
    const existingTitles = new Set(existingNews.map((n) => n.title.toLowerCase()));

    for (const item of newsItems.slice(0, 3)) {
      if (existingTitles.has(item.title.toLowerCase())) continue;

      const article = await generateArticle(item, env);
      const newsItem: NewsItem = {
        id: generateId(),
        title: article.title,
        content: article.content,
        summary: article.summary,
        source: item.source,
        url: item.url,
        publishedAt: new Date().toISOString(),
        tags: article.tags,
        postedToTelegram: false,
      };

      existingNews.unshift(newsItem);
      results.articlesGenerated++;

      if (env.TELEGRAM_BOT_TOKEN) {
        const posted = await postToTelegram(newsItem, env);
        if (posted) results.telegramPosted++;
      }
    }

    await env.ANIMEPULSE_KV.put('news', JSON.stringify(existingNews.slice(0, 50)));
    return { success: true, ...results, timestamp: new Date().toISOString() };
  } catch (error) {
    return { success: false, error: String(error), ...results };
  }
}

async function getStoredNews(env: Env): Promise<NewsItem[]> {
  const stored = await env.ANIMEPULSE_KV.get('news');
  return stored ? JSON.parse(stored) : [];
}

async function generateArticle(
  item: { title: string; description: string },
  env: Env
) {
  const prompt = `Write an engaging anime news article about: ${item.title}\n\nDescription: ${item.description}\n\nSummary after ---SUMMARY---\nTags after ---TAGS--- (comma-separated)`;

  if (!env.GEMINI_API_KEY) {
    return {
      title: item.title,
      content: `# ${item.title}\n\n${item.description}`,
      summary: item.description,
      tags: ['anime', 'news'],
    };
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
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const [content, rest] = text.split('---SUMMARY---');
    const [summary, tagsStr] = (rest || '').split('---TAGS---');

    return {
      title: item.title,
      content: content?.trim() || `# ${item.title}`,
      summary: summary?.trim() || item.description,
      tags: tagsStr?.split(',').map((t: string) => t.trim()).filter((t: string) => t) || ['anime', 'news'],
    };
  } catch {
    return {
      title: item.title,
      content: `# ${item.title}\n\n${item.description}`,
      summary: item.description,
      tags: ['anime', 'news'],
    };
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

function getSampleNews() {
  return [
    {
      title: 'Attack on Titan Final Season Part 4 Release Date Announced',
      description: 'The epic conclusion to the Attack on Titan saga finally has a confirmed release date.',
      url: 'https://animepulse.vercel.app/news',
      source: 'Crunchyroll News',
    },
    {
      title: 'Jujutsu Kaisen Season 3 Confirmed',
      description: 'The Culling Game arc will be adapted in 2026.',
      url: 'https://animepulse.vercel.app/news',
      source: 'Anime News Network',
    },
    {
      title: 'New Studio Ghibli Film in Production',
      description: 'Hayao Miyazaki continues to work on new projects.',
      url: 'https://animepulse.vercel.app/news',
      source: 'MyAnimeList',
    },
  ];
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
