/**
 * lib/affiliate.ts
 * Affiliate intelligence — maps anime titles and article tags
 * to contextually relevant monetization links.
 *
 * Supported programs:
 *  - Amazon Associates (manga, blu-ray, figurines, merch)
 *  - Crunchyroll Affiliate (streaming)
 *  - RightStuf/Nozomi (physical media)
 *  - VIZ Media (manga direct)
 *
 * HOW TO SET UP YOUR AFFILIATE IDs:
 *  NEXT_PUBLIC_AMAZON_AFFILIATE_TAG=yoursite-20
 *  NEXT_PUBLIC_CRUNCHYROLL_AFFILIATE_ID=your-cr-id
 *  (add to .env.local and Vercel env vars)
 */

export type AffiliateType = 'streaming' | 'manga' | 'bluray' | 'merch' | 'figures';

export interface AffiliateLink {
  type:    AffiliateType;
  label:   string;         // Button text
  url:     string;         // Final affiliate URL
  icon:    string;         // Emoji icon
  cta:     string;         // Short call-to-action
  color:   string;         // Tailwind text color class
  bgColor: string;         // Tailwind bg color class
  border:  string;         // Tailwind border color class
}

export interface MerchSection {
  title:     string;
  subtitle:  string;
  links:     AffiliateLink[];
}

// ─── Affiliate Tag Config ─────────────────────────────────────────────────────

function amazonTag(): string {
  return typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'animepulse-20')
    : 'animepulse-20';
}

function crunchyrollId(): string {
  return typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_CRUNCHYROLL_AFFILIATE_ID || '')
    : '';
}

// ─── URL Builders ─────────────────────────────────────────────────────────────

function amazonSearchUrl(query: string, category = 'Books'): string {
  const tag = amazonTag();
  const q = encodeURIComponent(query);
  return `https://www.amazon.com/s?k=${q}&i=${category === 'Books' ? 'stripbooks' : 'toys-and-games'}&tag=${tag}`;
}

function crunchyrollUrl(path = ''): string {
  const id = crunchyrollId();
  const base = `https://www.crunchyroll.com${path}`;
  return id ? `${base}?affiliate_id=${id}` : base;
}

function rightStufUrl(query: string): string {
  return `https://www.rightstufanime.com/search?keywords=${encodeURIComponent(query)}`;
}

// ─── Tag → Affiliate Mapping ─────────────────────────────────────────────────
// Maps common article tags to their most relevant affiliate product type

const TAG_TYPE_MAP: Record<string, AffiliateType> = {
  // Streaming
  'anime':        'streaming',
  'crunchyroll':  'streaming',
  'funimation':   'streaming',
  'simulcast':    'streaming',
  'season':       'streaming',
  'episode':      'streaming',
  'airing':       'streaming',
  'premiere':     'streaming',

  // Manga / Light Novel
  'manga':        'manga',
  'light novel':  'manga',
  'manhwa':       'manga',
  'manhua':       'manga',
  'viz media':    'manga',
  'yen press':    'manga',
  'kodansha':     'manga',
  'volume':       'manga',
  'chapter':      'manga',
  'adaptation':   'manga',

  // Physical media
  'blu-ray':      'bluray',
  'dvd':          'bluray',
  'collector':    'bluray',
  'limited edition': 'bluray',
  'release':      'bluray',

  // Merchandise
  'merchandise':  'merch',
  'collab':       'merch',
  'collaboration':'merch',
  'clothing':     'merch',
  'apparel':      'merch',

  // Figures
  'figure':       'figures',
  'figurine':     'figures',
  'nendoroid':    'figures',
  'funko':        'figures',
  'pop':          'figures',
  'statue':       'figures',
  'good smile':   'figures',
};

// Well-known anime → their exact search queries per product type
const ANIME_SEARCH_OVERRIDES: Record<string, Record<AffiliateType, string>> = {
  'demon slayer':      { manga: 'Demon Slayer Kimetsu no Yaiba manga', bluray: 'Demon Slayer Blu-ray', merch: 'Demon Slayer merchandise', figures: 'Demon Slayer figure nendoroid', streaming: '' },
  'one piece':         { manga: 'One Piece manga viz media', bluray: 'One Piece Blu-ray', merch: 'One Piece merchandise', figures: 'One Piece figure', streaming: '' },
  'jujutsu kaisen':    { manga: 'Jujutsu Kaisen manga viz', bluray: 'Jujutsu Kaisen Blu-ray', merch: 'Jujutsu Kaisen merch', figures: 'Jujutsu Kaisen figure', streaming: '' },
  'attack on titan':   { manga: 'Attack on Titan manga kodansha', bluray: 'Attack on Titan Blu-ray', merch: 'Attack on Titan merchandise', figures: 'Attack on Titan figure', streaming: '' },
  'my hero academia':  { manga: 'My Hero Academia manga viz', bluray: 'My Hero Academia Blu-ray', merch: 'My Hero Academia merch', figures: 'My Hero Academia figure', streaming: '' },
  'naruto':            { manga: 'Naruto manga viz', bluray: 'Naruto Blu-ray complete', merch: 'Naruto merchandise', figures: 'Naruto figure nendoroid', streaming: '' },
  'dragon ball':       { manga: 'Dragon Ball manga viz', bluray: 'Dragon Ball Z Blu-ray', merch: 'Dragon Ball merchandise', figures: 'Dragon Ball figure', streaming: '' },
  'chainsaw man':      { manga: 'Chainsaw Man manga viz', bluray: 'Chainsaw Man Blu-ray', merch: 'Chainsaw Man merchandise', figures: 'Chainsaw Man figure', streaming: '' },
  'spy x family':      { manga: 'Spy x Family manga viz', bluray: 'Spy x Family Blu-ray', merch: 'Spy x Family merchandise', figures: 'Spy x Family figure anya', streaming: '' },
  'vinland saga':      { manga: 'Vinland Saga manga kodansha', bluray: 'Vinland Saga Blu-ray', merch: 'Vinland Saga merchandise', figures: 'Vinland Saga figure', streaming: '' },
  'bocchi the rock':   { manga: 'Bocchi the Rock manga', bluray: 'Bocchi the Rock Blu-ray', merch: 'Bocchi the Rock merch', figures: 'Bocchi the Rock figure', streaming: '' },
  'blue lock':         { manga: 'Blue Lock manga kodansha', bluray: 'Blue Lock Blu-ray', merch: 'Blue Lock merchandise', figures: 'Blue Lock figure', streaming: '' },
  'frieren':           { manga: 'Frieren Beyond Journey\'s End manga', bluray: 'Frieren Blu-ray', merch: 'Frieren merchandise', figures: 'Frieren figure', streaming: '' },
  'solo leveling':     { manga: 'Solo Leveling manhwa yen press', bluray: 'Solo Leveling Blu-ray', merch: 'Solo Leveling merchandise', figures: 'Solo Leveling figure', streaming: '' },
};

// ─── Style Map per affiliate type ─────────────────────────────────────────────

const TYPE_STYLE: Record<AffiliateType, { icon: string; color: string; bgColor: string; border: string }> = {
  streaming: { icon: '▶️', color: 'text-orange-300', bgColor: 'bg-orange-500/10', border: 'border-orange-500/20' },
  manga:     { icon: '📚', color: 'text-blue-300',   bgColor: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
  bluray:    { icon: '💿', color: 'text-purple-300', bgColor: 'bg-purple-500/10', border: 'border-purple-500/20' },
  merch:     { icon: '👕', color: 'text-pink-300',   bgColor: 'bg-pink-500/10',   border: 'border-pink-500/20'   },
  figures:   { icon: '🎭', color: 'text-yellow-300', bgColor: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
};

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Detect the primary affiliate type from an array of article tags.
 * Falls back to 'streaming' if no match.
 */
export function detectTypeFromTags(tags: string[]): AffiliateType {
  const normalized = tags.map(t => t.toLowerCase().trim());
  for (const tag of normalized) {
    const mapped = TAG_TYPE_MAP[tag];
    if (mapped) return mapped;
    // Partial match
    for (const [key, type] of Object.entries(TAG_TYPE_MAP)) {
      if (tag.includes(key) || key.includes(tag)) return type;
    }
  }
  return 'streaming';
}

/**
 * Find the best known-anime override from a title or tags array.
 */
function findAnimeOverride(titleOrTags: string[]): [string, Record<AffiliateType, string>] | null {
  const normalized = titleOrTags.map(s => s.toLowerCase());
  for (const [anime, overrides] of Object.entries(ANIME_SEARCH_OVERRIDES)) {
    if (normalized.some(s => s.includes(anime) || anime.includes(s))) {
      return [anime, overrides];
    }
  }
  return null;
}

/**
 * Generate a smart set of affiliate links for an article.
 * Detects context from tags + title, picks 2-4 most relevant links.
 */
export function getArticleAffiliateLinks(
  tags: string[],
  title: string,
): AffiliateLink[] {
  const allStrings = [...tags, title].map(s => s.toLowerCase());
  const primaryType = detectTypeFromTags(tags);
  const override = findAnimeOverride(allStrings);
  const links: AffiliateLink[] = [];

  // Always offer streaming (Crunchyroll) as first link
  links.push({
    type:     'streaming',
    label:    'Watch on Crunchyroll',
    url:      crunchyrollUrl('/'),
    icon:     '▶️',
    cta:      'Stream free with ads',
    ...TYPE_STYLE.streaming,
  });

  // Add type-specific link based on detected context
  if (primaryType !== 'streaming') {
    const searchQuery = override?.[1]?.[primaryType] || `${title} anime ${primaryType}`;
    if (primaryType === 'manga') {
      links.push({
        type:    'manga',
        label:   'Buy Manga on Amazon',
        url:     amazonSearchUrl(searchQuery, 'Books'),
        icon:    '📚',
        cta:     'Shop manga volumes',
        ...TYPE_STYLE.manga,
      });
    } else if (primaryType === 'figures') {
      links.push({
        type:    'figures',
        label:   'Browse Figures on Amazon',
        url:     amazonSearchUrl(searchQuery, 'Toys'),
        icon:    '🎭',
        cta:     'Collectibles & figures',
        ...TYPE_STYLE.figures,
      });
    } else if (primaryType === 'bluray') {
      links.push({
        type:    'bluray',
        label:   'Buy Blu-ray on Amazon',
        url:     amazonSearchUrl(searchQuery, 'Movies'),
        icon:    '💿',
        cta:     'Own the complete series',
        ...TYPE_STYLE.bluray,
      });
    } else if (primaryType === 'merch') {
      links.push({
        type:    'merch',
        label:   'Browse Merch on Amazon',
        url:     amazonSearchUrl(searchQuery, 'Toys'),
        icon:    '👕',
        cta:     'Official merchandise',
        ...TYPE_STYLE.merch,
      });
    }
  }

  // If manga tag detected, always add a manga link too (unless already added)
  const hasManga = tags.some(t => t.toLowerCase().includes('manga') || t.toLowerCase().includes('volume'));
  if (hasManga && primaryType !== 'manga') {
    const q = override?.[1]?.manga || `${title} manga`;
    links.push({
      type:    'manga',
      label:   'Buy Manga on Amazon',
      url:     amazonSearchUrl(q, 'Books'),
      icon:    '📚',
      cta:     'Read the original manga',
      ...TYPE_STYLE.manga,
    });
  }

  return links.slice(0, 3); // max 3 links
}

/**
 * Generate the full merch page sections for a given anime title.
 */
export function getMerchSections(animeTitle: string, malId?: number): MerchSection[] {
  const title = animeTitle.toLowerCase();
  const override = findAnimeOverride([title])?.[1];

  const mangaQuery   = override?.manga   || `${animeTitle} manga`;
  const bluerayQuery = override?.bluray  || `${animeTitle} blu-ray`;
  const merchQuery   = override?.merch   || `${animeTitle} merchandise`;
  const figureQuery  = override?.figures || `${animeTitle} figure nendoroid`;

  return [
    {
      title: '▶️ Watch & Stream',
      subtitle: 'Stream legally and support the creators',
      links: [
        {
          type:     'streaming',
          label:    'Watch on Crunchyroll',
          url:      malId
            ? crunchyrollUrl(`/search?q=${encodeURIComponent(animeTitle)}`)
            : crunchyrollUrl('/'),
          icon:     '▶️',
          cta:      'Stream for free with ads',
          ...TYPE_STYLE.streaming,
        },
      ],
    },
    {
      title: '📚 Manga & Light Novels',
      subtitle: 'Read the original source material',
      links: [
        {
          type:    'manga',
          label:   'Shop on Amazon',
          url:     amazonSearchUrl(mangaQuery, 'Books'),
          icon:    '📚',
          cta:     'All volumes available',
          ...TYPE_STYLE.manga,
        },
        {
          type:    'manga',
          label:   'Shop on RightStuf',
          url:     rightStufUrl(mangaQuery),
          icon:    '🛒',
          cta:     'Anime specialist store',
          ...TYPE_STYLE.manga,
        },
      ],
    },
    {
      title: '💿 Blu-ray & DVD',
      subtitle: 'Own the complete series in HD',
      links: [
        {
          type:    'bluray',
          label:   'Shop Blu-ray on Amazon',
          url:     amazonSearchUrl(bluerayQuery, 'Movies'),
          icon:    '💿',
          cta:     'Complete collection sets',
          ...TYPE_STYLE.bluray,
        },
      ],
    },
    {
      title: '🎭 Figures & Collectibles',
      subtitle: 'Official figures, nendoroids, and statues',
      links: [
        {
          type:    'figures',
          label:   'Browse Figures on Amazon',
          url:     amazonSearchUrl(figureQuery, 'Toys'),
          icon:    '🎭',
          cta:     'Nendoroids, scale figures & more',
          ...TYPE_STYLE.figures,
        },
        {
          type:    'figures',
          label:   'Shop on RightStuf',
          url:     rightStufUrl(figureQuery),
          icon:    '🛒',
          cta:     'Import & limited figures',
          ...TYPE_STYLE.figures,
        },
      ],
    },
    {
      title: '👕 Clothing & Accessories',
      subtitle: 'Official merchandise and apparel',
      links: [
        {
          type:    'merch',
          label:   'Shop Merch on Amazon',
          url:     amazonSearchUrl(merchQuery, 'Apparel'),
          icon:    '👕',
          cta:     'T-shirts, hoodies, accessories',
          ...TYPE_STYLE.merch,
        },
      ],
    },
  ];
}
