/**
 * Telegram Bot Integration for AnimePulse
 * Posts updates to Telegram channel
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

export interface TelegramPost {
  title: string;
  content: string;
  url?: string;
  imageUrl?: string;
}

/**
 * Send message to Telegram channel
 */
export async function sendToTelegram(post: TelegramPost): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ No Telegram bot token found');
    return false;
  }

  const apiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

  try {
    // Format message with Markdown
    let message = `🎌 **${post.title}**\n\n`;
    message += `${post.content.substring(0, 300)}...\n\n`; // Limit content length
    
    if (post.url) {
      message += `🔗 [Read more on AnimePulse](${post.url})\n\n`;
    }
    
    message += `📢 @AnimePulseChannel`;

    // Prepare request body
    interface TelegramRequestBody {
      chat_id: string;
      text: string;
      parse_mode: string;
      disable_web_page_preview: boolean;
    }

    const body: TelegramRequestBody = {
      chat_id: TELEGRAM_CHANNEL_ID,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    };

    // Send message
    const response = await fetch(`${apiUrl}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Successfully posted to Telegram');
      return true;
    } else {
      console.error('❌ Telegram API error:', data.description);
      // Log full error for debugging
      console.log('Full response:', JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to post to Telegram:', error);
    return false;
  }
}

/**
 * Send photo with caption to Telegram
 */
export async function sendPhotoToTelegram(
  imageUrl: string,
  caption: string,
  url?: string
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ No Telegram bot token found');
    return false;
  }

  const apiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

  try {
    let message = `🎌 **AnimePulse Update**\n\n`;
    message += caption.substring(0, 800); // Telegram caption limit
    
    if (url) {
      message += `\n\n🔗 [Read more](${url})`;
    }

    const body = {
      chat_id: TELEGRAM_CHANNEL_ID,
      photo: imageUrl,
      caption: message,
      parse_mode: 'Markdown',
    };

    const response = await fetch(`${apiUrl}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('❌ Failed to send photo:', error);
    // Fallback to text-only message
    return sendToTelegram({
      title: 'New Anime Update',
      content: caption,
      url,
    });
  }
}

/**
 * Send trending update to Telegram
 */
export async function sendTrendingUpdate(animeList: string[]): Promise<boolean> {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let message = `📈 **Trending Anime - ${today}**\n\n`;
  message += `Here are the hottest anime everyone is watching right now:\n\n`;

  animeList.slice(0, 5).forEach((anime, index) => {
    message += `${index + 1}. ${anime}\n`;
  });

  message += `\n🔥 What are you watching this week?`;
  message += `\n\n📢 @AnimePulseChannel`;

  return sendToTelegram({
    title: 'Trending Anime Update',
    content: message,
    url: 'https://animepulse.vercel.app/trending',
  });
}

/**
 * Send news update to Telegram
 */
export async function sendNewsUpdate(newsItem: {
  title: string;
  description: string;
  source: string;
}): Promise<boolean> {
  const message = `📰 **${newsItem.title}**\n\n` +
    `${newsItem.description}\n\n` +
    `📝 Source: ${newsItem.source}\n\n` +
    `🔗 Read more on AnimePulse`;

  return sendToTelegram({
    title: newsItem.title,
    content: message,
    url: 'https://animepulse.vercel.app/news',
  });
}

/**
 * Test Telegram connection
 */
export async function testTelegramConnection(): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ No Telegram bot token configured');
    return false;
  }

  try {
    const apiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Telegram bot connected:', data.result.username);
      return true;
    } else {
      console.error('❌ Telegram connection failed:', data.description);
      return false;
    }
  } catch (error) {
    console.error('❌ Telegram test failed:', error);
    return false;
  }
}
