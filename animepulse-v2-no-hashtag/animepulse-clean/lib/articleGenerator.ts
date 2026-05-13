/**
 * lib/articleGenerator.ts
 * AI Article Generation with Groq (primary) and Gemini (fallback).
 * Produces structured, human-like content following AnimePulse's editorial voice.
 */

export interface GeneratedArticle {
  title: string;
  content: string;        // Full Markdown article
  summary: string;        // 2-3 SEO sentences
  editorialNote: string;  // 280-char hot take
  verdict: string;        // Emoji verdict + one sentence
  tags: string[];
  readTime: number;       // Minutes
  seoTitle: string;       // <60 chars optimised title
  metaDescription: string; // 150-160 chars meta description
  keywords: string[];     // 5-8 focus keywords
}

const ANIMEPULSE_PROMPT = (title: string, description: string) => `
You are Alex Chen, lead editor at AnimePulse — the sharpest anime news voice online.
AnimePulse readers are passionate fans who want analysis, not just summaries.

AnimePulse Voice Rules:
- Write like you CARE — excitement, frustration, hype are all valid emotions
- Use contractions (we're, it's, don't) — never sound corporate or stiff
- Reference the anime community (\"fans are losing it\", \"the fandom went wild\")
- Include one surprising or counterintuitive observation per article
- Short punchy sentences mixed with longer analytical ones
- NEVER start with \"In conclusion\", \"It is worth noting\", \"This article\"
- NEVER use phrases like \"delve into\", \"it's important to note\", \"I cannot\"

Title: ${title}
Background: ${description}

Write the article in Markdown with EXACTLY these sections in order:

## What Happened
(2–3 paragraphs. Open with the most striking detail, not background context. Make the reader feel the news.)

## Why Anime Fans Should Care
(1–2 paragraphs. Real stakes for the community. Be specific — names, studios, context.)

## Key Highlights
- (3–5 bullet points with the most important facts)

## AnimePulse Take 🔥
(1 paragraph in first person. "I think...", "Honestly...", "Here's the thing...". Take a clear stance. Be bold.)

## What Comes Next
(1 short paragraph. What should fans watch for? Concrete next steps.)

---EDITORIAL_NOTE---
(One tweet-length hot take. Max 280 chars. Spicy, funny, or provocative. No hashtags.)
---VERDICT---
(Pick ONE: 🔥 Must Watch | ⭐ Looks Promising | 😐 Wait and See | ❌ Skip It — then one punchy sentence why.)
---SUMMARY---
(2–3 sentences optimised for Google. Include anime title, key news, and why it matters. No fluff.)
---TAGS---
(6–8 comma-separated tags: anime titles, studio name, genre, season year, relevant topics)
---SEO_TITLE---
(Rewrite the title for Google. Max 60 chars. Include the anime name and a strong keyword. No clickbait.)
---META_DESCRIPTION---
(Exactly 150-160 chars. Summarise the news with the anime name + key detail + a hook. Must end with a period.)
---KEYWORDS---
(5–8 comma-separated focus keywords: specific anime name, studio, character names, genre, year)
`.trim();

/**
 * Generate article using Groq (llama-3.3-70b-versatile).
 * Groq is fast and free-tier friendly.
 */
async function generateWithGroq(
  title: string,
  description: string,
  groqKey: string
): Promise<GeneratedArticle | null> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are Alex Chen, lead editor at AnimePulse. Write vivid, opinionated anime news articles. Always follow the exact format requested with section separators.',
          },
          { role: 'user', content: ANIMEPULSE_PROMPT(title, description) },
        ],
        temperature: 0.82,
        max_tokens: 3000,
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message: { content: string } }>;
    };
    const text = data.choices?.[0]?.message?.content || '';
    return parseGeneratedText(title, description, text);
  } catch {
    return null;
  }
}

/**
 * Generate article using Gemini (fallback).
 */
async function generateWithGemini(
  title: string,
  description: string,
  geminiKey: string
): Promise<GeneratedArticle | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: ANIMEPULSE_PROMPT(title, description) }] }],
          generationConfig: { temperature: 0.82, maxOutputTokens: 3000 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseGeneratedText(title, description, text);
  } catch {
    return null;
  }
}

/**
 * Parse the structured text output from any LLM into a GeneratedArticle.
 */
function parseGeneratedText(
  title: string,
  description: string,
  text: string
): GeneratedArticle {
  const [contentRaw, rest1]    = text.split('---EDITORIAL_NOTE---');
  const [editorialNote, rest2] = (rest1 || '').split('---VERDICT---');
  const [verdict, rest3]       = (rest2 || '').split('---SUMMARY---');
  const [summary, rest4]       = (rest3 || '').split('---TAGS---');
  const [tagsStr, rest5]       = (rest4 || '').split('---SEO_TITLE---');
  const [seoTitle, rest6]      = (rest5 || '').split('---META_DESCRIPTION---');
  const [metaDescription, keywordsStr] = (rest6 || '').split('---KEYWORDS---');

  const tags = (tagsStr || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const keywords = (keywordsStr || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);

  const content = contentRaw?.trim() || `## What Happened\n\n${description}`;
  const wordCount = content.split(/\s+/).length;

  // Fallback SEO title: trim to 60 chars
  const rawSeoTitle = seoTitle?.trim() || title;
  const cleanSeoTitle = rawSeoTitle.length > 60
    ? rawSeoTitle.slice(0, 57) + '...'
    : rawSeoTitle;

  // Fallback meta description: trim to 160 chars
  const rawMeta = metaDescription?.trim() || summary?.trim() || description;
  const cleanMeta = rawMeta.length > 160
    ? rawMeta.slice(0, 157) + '...'
    : rawMeta;

  return {
    title,
    content,
    editorialNote: editorialNote?.trim() || '',
    verdict: verdict?.trim() || '',
    summary: summary?.trim() || description,
    tags: tags.length ? tags : ['anime', 'news'],
    readTime: Math.max(1, Math.ceil(wordCount / 200)),
    seoTitle: cleanSeoTitle,
    metaDescription: cleanMeta,
    keywords: keywords.length ? keywords : tags.slice(0, 5),
  };
  };
}

/**
 * Generate an article using available AI provider.
 * Tries Groq first (faster), falls back to Gemini, then plain fallback.
 */
export async function generateArticle(
  item: { title: string; description: string },
  groqKey?: string,
  geminiKey?: string
): Promise<GeneratedArticle> {
  // Try Groq first
  if (groqKey) {
    const result = await generateWithGroq(item.title, item.description, groqKey);
    if (result) return result;
  }

  // Fallback to Gemini
  if (geminiKey) {
    const result = await generateWithGemini(item.title, item.description, geminiKey);
    if (result) return result;
  }

  // Last resort: structured fallback — always write meaningful content from the RSS description
  const desc = item.description || 'Details are still emerging on this story.';
  const titleWords = item.title.toLowerCase();
  const isSequel   = /season|sequel|part|cour|return/i.test(titleWords);
  const isRelease  = /release|date|announce|confirm/i.test(titleWords);
  const isCasting  = /cast|voice|actor|director|studio/i.test(titleWords);

  const whyCareParagraph = isSequel
    ? `Sequels and continuations are always a big deal for the anime community. When a beloved series gets another season confirmed, it means the source material is strong enough to warrant further adaptation — and that the studio believes in the story. Fans who've been waiting deserve to know the details.`
    : isRelease
    ? `Release dates and announcements are the lifeblood of the anime news cycle. Whether it's a simulcast window, a home video release, or a theatrical run, knowing when and where to watch matters enormously for fans planning their viewing schedules.`
    : isCasting
    ? `Voice casting and production staff announcements shape how a series will feel long before the first frame airs. The people behind the microphones and the directors behind the camera are often as important as the source material itself.`
    : `Every piece of anime news contributes to the bigger picture of where the industry is heading. For dedicated fans, staying on top of even smaller stories helps build a complete understanding of what's coming and what to get excited about.`;

  return {
    title: item.title,
    content: `## What Happened\n\n${desc}\n\nThis story broke across major anime news outlets and quickly gained traction among fans online. The details above represent the initial reporting — we'll continue to update as more information becomes available.\n\n## Why Anime Fans Should Care\n\n${whyCareParagraph}\n\n## Key Highlights\n\n- **Breaking:** ${item.title}\n- Source: ${item.source || 'Anime news network'}\n- Follow AnimePulse for live updates on this story\n\n## AnimePulse Take 🔥\n\nHonestly, this is exactly the kind of news that keeps the community buzzing. Whether you're a casual viewer or a die-hard fan, stories like this shape what we'll be talking about for weeks. Keep an eye on this one.\n\n## What Comes Next\n\nExpect follow-up coverage as more details emerge. Official statements, confirmed dates, and community reactions are all likely to drop soon — and we'll have them covered.`,
    editorialNote: `Breaking: ${item.title.slice(0, 200)}`,
    verdict: '⭐ Looks Promising — early signs are positive, but we need more details.',
    summary: desc,
    tags: ['anime', 'news', 'breaking'],
    readTime: 3,
  };
}
