#!/usr/bin/env -S npx tsx
/**
 * AnimePulse Auto-Pilot System
 * 
 * This script runs automatically to:
 * 1. Fetch anime news from RSS feeds
 * 2. Generate AI content using Gemini
 * 3. Post updates to Telegram
 * 4. Update the website content
 * 
 * Usage:
 *   ts-node auto-pilot.ts [task]
 * 
 * Tasks:
 *   - news: Fetch and process news
 *   - trending: Update trending data
 *   - full: Run complete workflow (default)
 */

import { fetchAnimeRSS, getSampleAnimeNews } from './lib/rssParser';
import { generateArticle, generateTrendingAnalysis } from './lib/gemini';
import { sendToTelegram, sendTrendingUpdate, testTelegramConnection } from './lib/telegram';
import * as fs from 'fs';
import * as path from 'path';

// Data storage paths
const DATA_DIR = path.join(process.cwd(), 'data');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');
const LOG_FILE = path.join(DATA_DIR, 'auto-pilot.log');

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

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Log function
function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  ensureDataDir();
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Load existing news
function loadNews(): NewsItem[] {
  ensureDataDir();
  try {
    if (fs.existsSync(NEWS_FILE)) {
      return JSON.parse(fs.readFileSync(NEWS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error loading news:', e);
  }
  return [];
}

// Save news
function saveNews(news: NewsItem[]) {
  ensureDataDir();
  fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2));
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Task: Fetch and Process News
 */
async function processNews(): Promise<number> {
  log('📡 Starting news fetch task...');
  
  // Fetch news from RSS
  const newsItems = await fetchAnimeRSS();
  
  if (newsItems.length === 0) {
    log('⚠️ No new items found, using sample data for testing');
    // Use sample data for demonstration
    const sample = getSampleAnimeNews();
    newsItems.length = 0;
    for (const item of sample) {
      newsItems.push({
        title: item.title,
        description: item.description,
        pubDate: item.pubDate,
        source: item.source,
        link: item.link,
        categories: item.categories,
      });
    }
  }
  
  const existingNews = loadNews();
  const existingTitles = new Set(existingNews.map(n => n.title.toLowerCase()));
  
  let newCount = 0;
  
  for (const item of newsItems.slice(0, 3)) { // Process top 3
    if (existingTitles.has(item.title.toLowerCase())) {
      log(`⏭️ Skipping duplicate: ${item.title}`);
      continue;
    }
    
    log(`🤖 Generating content for: ${item.title}`);
    
    try {
      // Generate AI content
      const article = await generateArticle({
        title: item.title,
        description: item.description,
      });
      
      const newsItem: NewsItem = {
        id: generateId(),
        title: article.title,
        content: article.content,
        summary: article.summary,
        source: item.source,
        url: item.link,
        publishedAt: new Date().toISOString(),
        tags: article.tags,
        postedToTelegram: false,
      };
      
      existingNews.unshift(newsItem); // Add to beginning
      newCount++;
      
      log(`✅ Generated article: ${article.title}`);
      
      // Post to Telegram
      if (process.env.TELEGRAM_BOT_TOKEN) {
        log('📱 Posting to Telegram...');
        const telegramSuccess = await sendToTelegram({
          title: newsItem.title,
          content: newsItem.summary,
          url: `https://animepulse.vercel.app/news`,
        });
        
        newsItem.postedToTelegram = telegramSuccess;
        if (telegramSuccess) {
          log('✅ Posted to Telegram successfully');
        } else {
          log('⚠️ Failed to post to Telegram');
        }
      }
    } catch (error) {
      log(`❌ Error processing item: ${error}`);
    }
  }
  
  // Keep only last 50 articles
  const trimmedNews = existingNews.slice(0, 50);
  saveNews(trimmedNews);
  
  log(`✅ News task complete. Added ${newCount} new articles.`);
  return newCount;
}

/**
 * Fetch real trending anime from Jikan API (MyAnimeList)
 */
async function fetchTrendingAnime(): Promise<string[]> {
  try {
    const response = await fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10');
    if (!response.ok) throw new Error('Jikan API error');
    const data = await response.json();
    return (data.data || []).map((anime: { title: string }) => anime.title).slice(0, 8);
  } catch (e) {
    log('⚠️ Jikan API failed, using fallback trending list');
    return [
      'Solo Leveling',
      'Jujutsu Kaisen',
      'Demon Slayer',
      'Attack on Titan',
      'One Piece',
      'Chainsaw Man',
      'Blue Lock',
      'Frieren: Beyond Journey\'s End',
    ];
  }
}

/**
 * Task: Update Trending
 */
async function updateTrending(): Promise<void> {
  log('📈 Starting trending update task...');

  const trendingAnime = await fetchTrendingAnime();
  log(`✅ Fetched ${trendingAnime.length} trending anime`);
  
  // Generate trending analysis
  const analysis = await generateTrendingAnalysis(trendingAnime);
  log(`📝 Generated trending analysis: ${analysis.substring(0, 100)}...`);
  
  // Post to Telegram if configured
  if (process.env.TELEGRAM_BOT_TOKEN) {
    log('📱 Posting trending update to Telegram...');
    await sendTrendingUpdate(trendingAnime);
  }
  
  // Save trending data
  const trendingData = {
    updatedAt: new Date().toISOString(),
    anime: trendingAnime,
    analysis,
  };
  
  ensureDataDir();
  fs.writeFileSync(
    path.join(DATA_DIR, 'trending.json'),
    JSON.stringify(trendingData, null, 2)
  );
  
  log('✅ Trending update complete');
}

/**
 * Main Auto-Pilot Function
 */
async function runAutoPilot(): Promise<void> {
  const startTime = Date.now();
  log('=== 🚀 AnimePulse Auto-Pilot Started ===');
  log(`⏰ Time: ${new Date().toLocaleString()}`);
  
  // Test Telegram connection
  await testTelegramConnection();
  
  try {
    // Task 1: Process News
    const newsCount = await processNews();
    
    // Task 2: Update Trending
    await updateTrending();
    
    const duration = (Date.now() - startTime) / 1000;
    log(`=== ✅ Auto-Pilot Complete (${duration.toFixed(2)}s) ===`);
    log(`   📰 New articles: ${newsCount}`);
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    log(`=== ❌ Auto-Pilot Failed: ${error} ===`);
    process.exit(1);
  }
}

// Run specific task based on argument
const task = process.argv[2] || 'full';

(async () => {
  log(`Task: ${task}`);
  
  try {
    switch (task) {
      case 'news':
        await processNews();
        break;
      case 'trending':
        await updateTrending();
        break;
      case 'test':
        await testTelegramConnection();
        break;
      case 'full':
      default:
        await runAutoPilot();
    }
    
    console.log('\n✅ Task completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Task failed:', error);
    process.exit(1);
  }
})();
