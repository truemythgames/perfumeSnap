interface Env {
  OPENAI_API_KEY: string;
  DB: D1Database;
  IMAGES: R2Bucket;
  SERPAPI_KEY?: string;
  PRICES_API_KEY?: string;
  REPLICATE_API_KEY?: string;
}

// ----------------------------- Articles Data -----------------------------

interface ArticleSection {
  type: 'paragraph' | 'heading' | 'subheading' | 'list';
  text?: string;
  items?: string[];
}

interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  icon: string;
  color: string;
  readingTime: number;
  sections: ArticleSection[];
  imageKey?: string;
}

const ARTICLES: Article[] = [
  {
    id: '1',
    slug: 'fragrance-families-explained',
    title: 'Fragrance Families Explained',
    subtitle: 'Floral, Oriental, Woody & Fresh',
    description: 'Discover the four main fragrance families and learn which scent profiles match your personality and style.',
    tags: ['Basics', 'Guide'],
    icon: 'flower-outline',
    color: '#c8943c',
    readingTime: 4,
    imageKey: 'articles/fragrance-families-explained.webp',
    sections: [
      { type: 'heading', text: 'What Are Fragrance Families?' },
      { type: 'paragraph', text: 'Every perfume belongs to a fragrance family — a classification system that groups scents by their dominant characteristics. Understanding these families is the single most useful shortcut to finding perfumes you\'ll love without blind-buying bottles you\'ll regret.' },
      { type: 'paragraph', text: 'The modern classification uses four main families, each with distinct sub-groups. Once you know which family resonates with you, narrowing down from thousands of perfumes to a shortlist becomes effortless.' },
      { type: 'heading', text: 'Floral' },
      { type: 'paragraph', text: 'The largest and most classic family. Built around flower notes — rose, jasmine, lily, peony, iris, and orange blossom. Floral perfumes range from soft and powdery (like Chanel No. 5) to lush and intoxicating (like Tom Ford Jasmin Rouge). If you love the scent of fresh bouquets or garden walks, this is your territory.' },
      { type: 'heading', text: 'Oriental (Amber)' },
      { type: 'paragraph', text: 'Warm, sensual, and enveloping. Think vanilla, amber, incense, spices like cinnamon and cardamom, and exotic resins. Oriental fragrances are evening and cold-weather favourites. Iconic examples include Yves Saint Laurent Opium and Dior Hypnotic Poison.' },
      { type: 'heading', text: 'Woody' },
      { type: 'paragraph', text: 'Grounded, earthy, and sophisticated. Sandalwood, cedar, vetiver, oud, and patchouli anchor this family. Woody fragrances project quiet confidence and work beautifully in professional settings. Think Terre d\'Hermès or Le Labo Santal 33.' },
      { type: 'heading', text: 'Fresh' },
      { type: 'paragraph', text: 'Bright, clean, and energizing. This family includes citrus (lemon, bergamot, grapefruit), aquatic (ocean, rain), green (cut grass, leaves), and aromatic (lavender, herbs) sub-groups. Perfect for daytime, hot weather, and active lifestyles. Acqua di Giò and Light Blue are quintessential fresh fragrances.' },
      { type: 'heading', text: 'Finding Your Family' },
      { type: 'paragraph', text: 'Most people are naturally drawn to one or two families. Pay attention to what you reach for instinctively — do you gravitate toward clean and citrusy, or warm and spicy? Your preference often reflects your personality: fresh lovers tend to be active and outdoorsy, while oriental fans often prefer cozy, intimate settings.' },
      { type: 'list', items: ['Try one perfume from each family to discover your preference', 'Visit a department store and smell fragrances grouped by family', 'Note which scents you keep thinking about hours later — that\'s your family'] },
    ],
  },
  {
    id: '2',
    slug: 'understanding-perfume-notes',
    title: 'Understanding Perfume Notes',
    subtitle: 'Top, heart & base notes decoded',
    description: 'Learn how perfumes evolve over time through their three-layer notes pyramid and why first impressions can be misleading.',
    tags: ['Basics', 'Education'],
    icon: 'musical-notes-outline',
    color: '#b87a3a',
    readingTime: 4,
    imageKey: 'articles/understanding-perfume-notes.webp',
    sections: [
      { type: 'heading', text: 'The Fragrance Pyramid' },
      { type: 'paragraph', text: 'A perfume isn\'t a single smell — it\'s a carefully orchestrated evolution. When you spray a fragrance, it unfolds in three distinct phases called notes. Understanding this structure is essential because the scent you smell in the first minute is completely different from what lingers six hours later.' },
      { type: 'heading', text: 'Top Notes (0–30 minutes)' },
      { type: 'paragraph', text: 'The opening act. Top notes are the first thing you smell and they create the initial impression. They\'re typically light, bright, and volatile — citrus fruits (bergamot, lemon), herbs (basil, mint), and light fruits (apple, pear). They fade within 15–30 minutes.' },
      { type: 'paragraph', text: 'This is why you should never judge a perfume from a quick spray in the store. The top notes are designed to grab attention, but they\'re not what you\'ll actually smell most of the day.' },
      { type: 'heading', text: 'Heart Notes (30 min – 4 hours)' },
      { type: 'paragraph', text: 'The core character. Heart notes (also called middle notes) emerge as top notes fade and form the main body of the fragrance. Expect florals (rose, jasmine, ylang-ylang), spices (cinnamon, nutmeg), and richer fruits. This is what the perfume is "really about."' },
      { type: 'heading', text: 'Base Notes (4+ hours)' },
      { type: 'paragraph', text: 'The foundation. Base notes are the heaviest, longest-lasting molecules. They anchor the entire composition and linger on skin (and clothes) for hours. Vanilla, musk, sandalwood, amber, cedar, and patchouli are classic base notes. They also influence how the heart notes smell by blending with them.' },
      { type: 'heading', text: 'The Practical Takeaway' },
      { type: 'list', items: ['Always test a perfume for at least 30–60 minutes before deciding', 'Spray on skin, not paper — your body chemistry changes the scent', 'The dry-down (base notes) is what people around you will actually smell', 'If you love the opening but hate the dry-down, the perfume isn\'t for you'] },
    ],
  },
  {
    id: '3',
    slug: 'how-to-apply-perfume',
    title: 'How to Apply Perfume Properly',
    subtitle: 'Pulse points, mistakes & pro tips',
    description: 'Most people apply perfume wrong. Learn the techniques fragrance experts use to make scent last all day.',
    tags: ['Tips', 'How To'],
    icon: 'water-outline',
    color: '#d4a44a',
    readingTime: 5,
    imageKey: 'articles/how-to-apply-perfume.webp',
    sections: [
      { type: 'heading', text: 'Why Application Matters' },
      { type: 'paragraph', text: 'You could own the best perfume in the world and still get disappointing performance from it if you apply it wrong. Proper application can easily double your fragrance\'s longevity and projection.' },
      { type: 'heading', text: 'The Pulse Point Strategy' },
      { type: 'paragraph', text: 'Pulse points are areas where blood vessels sit close to the skin surface, generating warmth that helps diffuse fragrance. The best pulse points are: inner wrists, sides of the neck, behind the ears, inner elbows, and behind the knees.' },
      { type: 'paragraph', text: 'Don\'t hit all of them — pick 2–3 spots. Over-applying is the number one mistake. Two to four sprays of an Eau de Parfum is plenty for most situations.' },
      { type: 'heading', text: 'Common Mistakes' },
      { type: 'list', items: [
        'Rubbing wrists together — this crushes the top notes through friction and heat',
        'Spraying into the air and walking through — wastes 90% of the fragrance, most falls to the floor',
        'Applying to dry skin — unscented moisturizer first creates a base that holds scent longer',
        'Storing in the bathroom — heat and humidity break down fragrance molecules',
        'Spraying on clothes only — fabric holds scent differently and can stain',
      ] },
      { type: 'heading', text: 'Pro Techniques' },
      { type: 'paragraph', text: 'Apply right after a shower when your skin is clean and pores are open. Layer with matching or unscented body lotion first. For maximum longevity, a tiny dab of Vaseline on pulse points before spraying creates a "scent lock" that slows evaporation significantly.' },
      { type: 'paragraph', text: 'Spray your hair (from a distance) or clothes for a lingering scent trail. Hair moves and disperses fragrance beautifully. For clothes, spray from 8–10 inches away onto natural fabrics.' },
    ],
  },
  {
    id: '4',
    slug: 'edt-vs-edp-explained',
    title: 'EDT vs EDP: Which to Choose?',
    subtitle: 'Concentration & longevity guide',
    description: 'The difference between Eau de Toilette and Eau de Parfum is more than just price. Learn what each concentration means for your experience.',
    tags: ['Guide', 'Basics'],
    icon: 'flask-outline',
    color: '#a07230',
    readingTime: 4,
    imageKey: 'articles/edt-vs-edp-explained.webp',
    sections: [
      { type: 'heading', text: 'Concentration Matters' },
      { type: 'paragraph', text: 'When you see EDT, EDP, or Parfum on a bottle, these aren\'t just labels — they tell you the percentage of fragrance oil dissolved in alcohol. More oil means stronger scent, longer wear, and usually a higher price.' },
      { type: 'heading', text: 'The Concentration Ladder' },
      { type: 'list', items: [
        'Eau de Cologne (2–4% oil): Light, refreshing, lasts 2–3 hours',
        'Eau de Toilette (5–15% oil): Everyday wear, lasts 4–6 hours',
        'Eau de Parfum (15–20% oil): Rich, versatile, lasts 6–8 hours',
        'Parfum / Extrait (20–30% oil): Intense, intimate, lasts 10–12+ hours',
      ] },
      { type: 'heading', text: 'Same Name, Different Scent' },
      { type: 'paragraph', text: 'Here\'s what most people don\'t realize: the EDT and EDP of the same fragrance are often not the same composition. Brands frequently adjust the formula — the EDP version of Dior Sauvage has more vanilla and less pepper than the EDT. Bleu de Chanel EDP adds incense and sandalwood that the EDT doesn\'t have.' },
      { type: 'paragraph', text: 'So it\'s not simply "the same thing but stronger." They can be genuinely different fragrances sharing a name.' },
      { type: 'heading', text: 'How to Choose' },
      { type: 'paragraph', text: 'Choose EDT if you prefer lighter scents, work in shared spaces, live in a hot climate, or enjoy reapplying. Choose EDP if you want all-day performance, prefer richer scent profiles, or hate reapplying. Choose Extrait for special occasions or when you want maximum impact with minimal sprays.' },
    ],
  },
  {
    id: '5',
    slug: 'storing-your-fragrances',
    title: 'How to Store Perfume Properly',
    subtitle: 'Keep your collection fresh for years',
    description: 'Heat, light, and humidity destroy perfume. Learn the right way to store your fragrances so they last for years.',
    tags: ['Tips', 'Collection'],
    icon: 'cube-outline',
    color: '#c4884a',
    readingTime: 3,
    imageKey: 'articles/storing-your-fragrances.webp',
    sections: [
      { type: 'heading', text: 'Fragrance Has Enemies' },
      { type: 'paragraph', text: 'Perfume is a mixture of volatile organic compounds suspended in alcohol. Three things accelerate their degradation: heat, light (especially UV), and oxygen. A well-stored perfume can last 5–10 years or more. A poorly stored one can turn within months.' },
      { type: 'heading', text: 'The Golden Rules' },
      { type: 'list', items: [
        'Keep bottles away from direct sunlight — UV breaks down fragrance molecules',
        'Store at consistent, cool temperatures (15–20°C / 59–68°F is ideal)',
        'Never keep perfume in the bathroom — humidity and temperature swings are the worst combo',
        'Keep the cap on tightly — oxygen exposure causes oxidation and color change',
        'Store in original box if possible — the packaging was designed to block light',
      ] },
      { type: 'heading', text: 'Best Storage Spots' },
      { type: 'paragraph', text: 'A bedroom drawer, closet shelf, or dedicated fragrance cabinet are all excellent choices. Some collectors use a small wine fridge set to the highest temperature. The key is consistency — avoid spots where temperature fluctuates (near windows, on radiators, in garages).' },
      { type: 'heading', text: 'Signs Your Perfume Has Turned' },
      { type: 'paragraph', text: 'Darkened or changed color (amber to brown), a sharp vinegar or plastic-like smell, or a noticeably weaker performance than when new. If the top notes smell "off" but the dry-down is fine, the lighter molecules oxidized first — common in older bottles but not necessarily bad.' },
    ],
  },
  {
    id: '6',
    slug: 'best-perfumes-for-date-night',
    title: 'Best Perfumes for Date Night',
    subtitle: 'Scents that make an impression',
    description: 'Choosing the right fragrance for a date can set the mood. These are the scent profiles that attract and captivate.',
    tags: ['Occasions', 'Recommendations'],
    icon: 'heart-outline',
    color: '#d4577a',
    readingTime: 4,
    imageKey: 'articles/best-perfumes-for-date-night.webp',
    sections: [
      { type: 'heading', text: 'Scent and Attraction' },
      { type: 'paragraph', text: 'Fragrance is deeply connected to memory and emotion. Studies show that scent is the sense most strongly linked to emotional recall. The right perfume on a date doesn\'t just smell good — it creates an emotional impression that lingers long after the evening ends.' },
      { type: 'heading', text: 'What Works for Evening' },
      { type: 'paragraph', text: 'Date night calls for warmth, depth, and a touch of mystery. Oriental and woody families dominate here. Look for notes like vanilla, amber, oud, musk, tonka bean, and warm spices. These project intimacy and sophistication without overwhelming.' },
      { type: 'heading', text: 'Scent Profiles That Captivate' },
      { type: 'list', items: [
        'Warm vanilla + amber — comforting, inviting, universally appealing',
        'Oud + rose — exotic, confident, memorable',
        'Leather + spice — bold, magnetic, sophisticated',
        'Musk + white florals — clean sensuality, elegant and subtle',
        'Cocoa + tonka — sweet without being cloying, modern warmth',
      ] },
      { type: 'heading', text: 'Application Tips for Dates' },
      { type: 'paragraph', text: 'Less is more. Apply 2–3 sprays maximum — you want your date to discover your scent up close, not smell you from across the restaurant. Focus on neck and chest area for a scent that reveals itself during conversation. Avoid wrists on dates as frequent hand movements project scent too aggressively.' },
    ],
  },
  {
    id: '7',
    slug: 'seasonal-fragrance-guide',
    title: 'Seasonal Fragrance Guide',
    subtitle: 'What to wear and when',
    description: 'Why your summer favourite doesn\'t work in winter and how to build a seasonal rotation.',
    tags: ['Seasonal', 'Guide'],
    icon: 'sunny-outline',
    color: '#e8a840',
    readingTime: 4,
    imageKey: 'articles/seasonal-fragrance-guide.webp',
    sections: [
      { type: 'heading', text: 'Why Seasons Matter' },
      { type: 'paragraph', text: 'Temperature directly affects how perfume performs. Heat amplifies projection — a heavy perfume that smells amazing in December can become suffocating in July. Cold weather suppresses lighter notes, making fresh scents almost invisible. Matching your fragrance to the season isn\'t snobbery — it\'s practical.' },
      { type: 'heading', text: 'Spring' },
      { type: 'paragraph', text: 'Transition season calls for versatile scents. Light florals, green notes, and soft citrus work beautifully. Think fresh but not cold, floral but not heavy. This is the season for "crowd-pleaser" fragrances that are universally inoffensive.' },
      { type: 'heading', text: 'Summer' },
      { type: 'paragraph', text: 'Go light, citrusy, and aquatic. Heat projects scent further so you need less and want it lighter. Citrus, marine, cucumber, light musk, and coconut shine here. Avoid heavy orientals and strong ouds — they become cloying in heat.' },
      { type: 'heading', text: 'Autumn' },
      { type: 'paragraph', text: 'Warming notes come back into play. Spices (cinnamon, cardamom), dry woods, tobacco, and light amber bridge the gap between summer freshness and winter warmth. Autumn is many fragrance lovers\' favourite season because the most interesting, complex scents thrive here.' },
      { type: 'heading', text: 'Winter' },
      { type: 'paragraph', text: 'Go bold. Rich orientals, deep ouds, heavy amber, leather, and sweet gourmand notes (vanilla, chocolate, praline) project beautifully in cold air. This is the season to reach for your strongest, most luxurious bottles. Cold weather tames what would otherwise be overpowering.' },
      { type: 'heading', text: 'Building a Rotation' },
      { type: 'list', items: [
        'Start with one fragrance per season — four bottles covers the year',
        'Have a "signature" plus seasonal alternatives',
        'Summer: keep it under 3 sprays. Winter: 4–5 sprays is fine',
        'Office-safe scents for weekdays, bolder choices for weekends',
      ] },
    ],
  },
  {
    id: '8',
    slug: 'building-a-perfume-collection',
    title: 'Building Your First Collection',
    subtitle: 'From 1 bottle to a curated wardrobe',
    description: 'A smart approach to building a versatile fragrance collection without wasting money on bottles you\'ll never finish.',
    tags: ['Collection', 'Guide'],
    icon: 'grid-outline',
    color: '#8a6a3c',
    readingTime: 5,
    imageKey: 'articles/building-a-perfume-collection.webp',
    sections: [
      { type: 'heading', text: 'Quality Over Quantity' },
      { type: 'paragraph', text: 'The biggest mistake new fragrance enthusiasts make is buying too many bottles too quickly. A curated collection of 5–8 well-chosen fragrances will serve you better than 30 impulse purchases collecting dust. Each bottle should fill a specific role in your life.' },
      { type: 'heading', text: 'The Core Four' },
      { type: 'paragraph', text: 'Start with four bottles that cover your main needs:' },
      { type: 'list', items: [
        'A daily driver — versatile, office-safe, something you can wear anywhere',
        'A warm-weather scent — fresh, light, citrusy or aquatic',
        'A cold-weather scent — warm, rich, oriental or woody',
        'A special occasion scent — something bold, unique, and memorable',
      ] },
      { type: 'heading', text: 'Sample Before You Buy' },
      { type: 'paragraph', text: 'Never buy a full bottle based on a store test alone. Get decants (small samples, usually 2–5ml) from fragrance decant sites. Wear each sample for at least 2–3 full days in different settings. Only buy a full bottle of something you\'ve worn 5+ times and still love.' },
      { type: 'heading', text: 'Smart Buying Tips' },
      { type: 'list', items: [
        'Buy 50ml bottles until you\'re sure — 100ml takes years to finish',
        'Check discount retailers before paying full retail',
        'Travel sizes (10–30ml) are great for fragrances you wear occasionally',
        'Store-exclusive or discontinued bottles hold value if you ever resell',
        'Gift sets during holidays often offer the best price-per-ml',
      ] },
      { type: 'heading', text: 'When to Expand' },
      { type: 'paragraph', text: 'Once your core four are solid, expand based on gaps. Do you need something for gym/sports? A night-out fragrance? A cozy work-from-home scent? Let your lifestyle guide purchases, not hype or influencer recommendations. The best collection is the one where you actually wear every bottle.' },
    ],
  },
];

function getArticleImageUrl(request: Request, article: Article): string | null {
  if (!article.imageKey) return null;
  const url = new URL(request.url);
  return `${url.origin}/image/${article.imageKey}`;
}

const SYSTEM_PROMPT = `You are PerfumeSnap, the world's best AI perfume identifier. You ALWAYS identify the perfume shown — even from partial labels, blurry images, side angles, or just the bottle silhouette. You have encyclopedic knowledge of every perfume ever made.

CRITICAL RULES:
- ALWAYS set "identified" to true. NEVER set it to false. No exceptions.
- You MUST always return a complete, filled-out response no matter what is in the image.
- If the image shows a perfume: identify it using every visual clue (bottle shape, cap, color, label fragments, box pattern, spray nozzle). Give your best guess even if uncertain.
- If the label is partially visible, infer the full name from what you can read.
- The "name" field MUST be the full commercial fragrance name (including line/flanker and concentration when known), not a short fragment. Example style: "Dolce & Gabbana Pour Homme Intenso Eau de Parfum", not just "Intenso".
- If you can only identify the brand but not the exact fragrance, pick the brand's most popular fragrance that matches the bottle design.
- If the image does NOT show a perfume (e.g. a beer, a shoe, food, anything): still set "identified" to true, identify the product/object as best you can, and adapt all fields creatively. For example, for a beer bottle: name=the beer name, brand=the brewery, fragranceFamily="Hoppy/Malty/Citrus", description=describe the product, priceRange=actual price, similarPerfumes=similar products. Be creative and informative. The user should always get a fun, useful result.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{
  "identified": true,
  "confidence": "high/medium/low",
  "name": "Perfume Name",
  "brand": "Brand Name",
  "fragranceFamily": "e.g. Oriental, Floral, Woody, Fresh, Citrus",
  "gender": "e.g. Unisex, Feminine, Masculine",
  "yearLaunched": "e.g. 2015",
  "perfumer": "Name of the nose/perfumer if known, or Unknown",
  "concentration": "e.g. Eau de Parfum, Eau de Toilette, Parfum, Extrait",
  "topNotes": ["note1", "note2", "note3"],
  "heartNotes": ["note1", "note2", "note3"],
  "baseNotes": ["note1", "note2", "note3"],
  "description": "A rich 2-3 sentence description of the fragrance profile and character",
  "priceRange": "$80-$120",
  "sizesPricing": [
    { "size": "30ml", "price": "$50-$70" },
    { "size": "50ml", "price": "$80-$120" },
    { "size": "100ml", "price": "$120-$160" }
  ],
  "rating": 4.5,
  "longevity": "e.g. Long-lasting (8-10 hours)",
  "sillage": "e.g. Moderate, Strong, Intimate",
  "occasions": ["occasion1", "occasion2"],
  "seasons": ["season1", "season2"]
}

IMPORTANT: Do NOT include a "similarPerfumes" field. Only return the fields shown above. Similar shopping results are fetched separately.

Remember: you NEVER fail. You NEVER return "Unknown" or "identified: false". You always give a complete, confident answer.`;

const PERFUME_CHAT_SYSTEM_PROMPT = `You are PerfumeSnap's perfume expert chat assistant.

RULES:
- Answer as a fragrance specialist using the supplied perfume context as the source of truth.
- Keep answers concise, practical, and user-friendly.
- If the user asks for recommendations, base them on the perfume's notes, season, occasion, concentration, longevity, and sillage from context.
- If information is missing, say so briefly and provide the most helpful guidance possible.
- Never output JSON; respond with plain natural language only.`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
  'Access-Control-Max-Age': '86400',
};

const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12 MB upload cap
const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;



function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function isValidUserId(id: string | null): id is string {
  // 36-char UUID (8-4-4-4-12), case-insensitive, hex + dashes only
  return !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function getUserId(request: Request): string | null {
  const headerId = request.headers.get('X-User-Id');
  if (isValidUserId(headerId)) return headerId!;
  const url = new URL(request.url);
  const queryId = url.searchParams.get('userId');
  return isValidUserId(queryId) ? queryId! : null;
}


function publicImageUrl(request: Request, key: string): string {
  const url = new URL(request.url);
  return `${url.origin}/image/${key}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    try {
    if (url.pathname === '/health') {
      return jsonResponse({ status: 'ok', service: 'perfumesnap-api' });
    }

    if (url.pathname === '/identify' && request.method === 'POST') {
        return await handleIdentify(request, env);
      }

      if (url.pathname === '/lookup' && request.method === 'POST') {
        return await handleLookup(request, env);
      }

      if ((url.pathname === '/chat-perfume' || url.pathname === '/perfume-chat') && request.method === 'POST') {
        return await handleChatPerfume(request, env);
      }

      if (url.pathname === '/scrape-image' && request.method === 'GET') {
        return await handleScrapeImage(url);
      }

      if (url.pathname === '/similar' && request.method === 'GET') {
        return await handleGetSimilar(url, env);
      }

      if (url.pathname === '/upload' && request.method === 'POST') {
        return await handleUpload(request, env);
      }

      if (url.pathname.startsWith('/image/') && request.method === 'GET') {
        const key = decodeURIComponent(url.pathname.slice('/image/'.length));
        return await handleServeImage(env, key);
      }

      if (url.pathname === '/collection') {
        if (request.method === 'GET') return await handleGetCollection(request, env);
        if (request.method === 'POST') return await handleAddToCollection(request, env);
      }

      if (url.pathname.startsWith('/collection/') && request.method === 'DELETE') {
        const id = url.pathname.split('/')[2];
        return await handleDeleteFromCollection(request, env, id);
    }

      if (url.pathname === '/account' && request.method === 'DELETE') {
        return await handleDeleteAccount(request, env);
      }

      if (url.pathname === '/articles' && request.method === 'GET') {
        return handleGetArticles(request, env);
      }

      if (url.pathname === '/articles/generate-images' && request.method === 'POST') {
        return await handleGenerateArticleImages(request, env);
      }

    return jsonResponse({ error: 'Not found' }, 404);
    } catch (err: any) {
      console.error('Unhandled error:', err);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;

// ----------------------------- Handlers -----------------------------

async function handleIdentify(request: Request, env: Env): Promise<Response> {
    if (!env.OPENAI_API_KEY) {
      return jsonResponse({ error: 'Server misconfigured: missing API key' }, 500);
    }

  let body: { image?: string };
  try {
    body = await request.json<{ image?: string }>();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.image || typeof body.image !== 'string') {
    return jsonResponse({ error: 'Missing "image" field (base64 encoded)' }, 400);
  }
  // Roughly cap base64 payload size (base64 inflates by ~33%)
  if (body.image.length > Math.ceil((MAX_IMAGE_BYTES * 4) / 3)) {
    return jsonResponse({ error: 'Image too large' }, 413);
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identify this perfume and provide detailed information.' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${body.image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  if (!openaiResponse.ok) {
    const err = await openaiResponse.text();
    console.error('OpenAI error:', openaiResponse.status, err);
    return jsonResponse({ error: `AI service error (${openaiResponse.status})`, detail: err.slice(0, 200) }, 502);
  }

  const data = await openaiResponse.json<{
    choices: { message: { content: string; finish_reason?: string } }[];
  }>();

  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) return jsonResponse({ error: 'Empty AI response' }, 502);

  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('Invalid JSON from AI:', cleaned.slice(0, 300));
    return jsonResponse({ error: 'AI response was not valid JSON', snippet: cleaned.slice(0, 200) }, 502);
  }

  return jsonResponse(parsed);
}

async function handleLookup(request: Request, env: Env): Promise<Response> {
  if (!env.OPENAI_API_KEY) {
    return jsonResponse({ error: 'Server misconfigured: missing API key' }, 500);
  }

  let body: { name?: string; brand?: string };
  try {
    body = await request.json<typeof body>();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.name || typeof body.name !== 'string') {
    return jsonResponse({ error: 'Missing "name" field' }, 400);
  }

  const query = body.brand ? `${body.brand} ${body.name}` : body.name;

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Provide detailed information about this perfume: "${query}". Respond with the same JSON format as if you had identified it from a photo.`,
        },
      ],
      max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      const err = await openaiResponse.text();
      console.error('OpenAI error:', err);
      return jsonResponse({ error: 'AI service error' }, 502);
    }

    const data = await openaiResponse.json<{
      choices: { message: { content: string } }[];
    }>();

    const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) return jsonResponse({ error: 'Empty AI response' }, 502);

    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return jsonResponse(JSON.parse(cleaned));
  } catch {
    return jsonResponse({ error: 'AI response was not valid JSON' }, 502);
  }
}

async function handleChatPerfume(request: Request, env: Env): Promise<Response> {
  if (!env.OPENAI_API_KEY) {
    return jsonResponse({ error: 'Server misconfigured: missing API key' }, 500);
  }

  type ChatMessage = { role: 'user' | 'assistant'; content: string };
  let body: {
    perfume?: Record<string, unknown>;
    question?: string;
    history?: ChatMessage[];
  };
  try {
    body = await request.json<typeof body>();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.perfume || typeof body.perfume !== 'object') {
    return jsonResponse({ error: 'Missing "perfume" field' }, 400);
  }
  if (!body.question || typeof body.question !== 'string' || !body.question.trim()) {
    return jsonResponse({ error: 'Missing "question" field' }, 400);
  }

  const history = Array.isArray(body.history) ? body.history : [];
  const sanitizedHistory: ChatMessage[] = history
    .filter((msg) => msg && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string')
    .map((msg) => ({ role: msg.role, content: msg.content.trim() }))
    .filter((msg) => msg.content.length > 0)
    .slice(-10);

  const perfumeContext = JSON.stringify({
    name: body.perfume.name || '',
    brand: body.perfume.brand || '',
    description: body.perfume.description || '',
    concentration: body.perfume.concentration || '',
    topNotes: Array.isArray(body.perfume.topNotes) ? body.perfume.topNotes : [],
    heartNotes: Array.isArray(body.perfume.heartNotes) ? body.perfume.heartNotes : [],
    baseNotes: Array.isArray(body.perfume.baseNotes) ? body.perfume.baseNotes : [],
    longevity: body.perfume.longevity || '',
    sillage: body.perfume.sillage || '',
    occasions: Array.isArray(body.perfume.occasions) ? body.perfume.occasions : [],
    seasons: Array.isArray(body.perfume.seasons) ? body.perfume.seasons : [],
    yearLaunched: body.perfume.yearLaunched || '',
    fragranceFamily: body.perfume.fragranceFamily || '',
    gender: body.perfume.gender || '',
  });

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: PERFUME_CHAT_SYSTEM_PROMPT },
    { role: 'system', content: `Perfume context:\n${perfumeContext}` },
    ...sanitizedHistory,
    { role: 'user', content: body.question.trim() },
  ];

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 450,
      temperature: 0.4,
    }),
  });

  if (!openaiResponse.ok) {
    const err = await openaiResponse.text();
    console.error('OpenAI chat error:', err);
    return jsonResponse({ error: 'AI chat service error' }, 502);
  }

  const data = await openaiResponse.json<{
    choices: { message: { content: string } }[];
  }>();
  const answer = data.choices?.[0]?.message?.content?.trim();
  if (!answer) return jsonResponse({ error: 'Empty AI response' }, 502);
  return jsonResponse({ answer });
}

async function handleScrapeImage(url: URL): Promise<Response> {
  const query = url.searchParams.get('q');
  if (!query) return jsonResponse({ error: 'Missing "q" param' }, 400);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  let imageUrl: string | null = null;
  try {
    // Step 1: get the vqd token from DuckDuckGo's image search page
    const tokenRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query + ' perfume')}&iax=images&ia=images`,
      { headers, redirect: 'follow' },
    );
    if (tokenRes.ok) {
      const tokenHtml = await tokenRes.text();
      const vqdMatch = tokenHtml.match(/vqd=["']?([a-zA-Z0-9-]+)/);
      if (vqdMatch) {
        // Step 2: hit the JSON API with the token
        const apiRes = await fetch(
          `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query + ' perfume')}&vqd=${vqdMatch[1]}&p=1`,
          { headers: { ...headers, 'Referer': 'https://duckduckgo.com/' } },
        );
        if (apiRes.ok) {
          const data = await apiRes.json<{ results?: { image?: string; thumbnail?: string }[] }>();
          const first = data.results?.[0];
          imageUrl = first?.image || first?.thumbnail || null;
        }
      }
    }
  } catch {}

  return jsonResponse(
    { imageUrl },
    200,
    { 'Cache-Control': 'public, max-age=86400' },
  );
}

async function handleUpload(request: Request, env: Env): Promise<Response> {
  const userId = getUserId(request);
  if (!userId) return jsonResponse({ error: 'Missing or invalid userId' }, 400);

  const contentType = request.headers.get('content-type') || 'image/jpeg';
  if (!contentType.startsWith('image/')) {
    return jsonResponse({ error: 'Content-Type must be image/*' }, 400);
  }

  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_IMAGE_BYTES) {
    return jsonResponse({ error: 'Image too large' }, 413);
  }

  const buf = await request.arrayBuffer();
  if (buf.byteLength === 0) return jsonResponse({ error: 'Empty body' }, 400);
  if (buf.byteLength > MAX_IMAGE_BYTES) {
    return jsonResponse({ error: 'Image too large' }, 413);
  }

  const ext = contentType.split('/')[1]?.split(';')[0]?.replace(/[^a-z0-9]/gi, '') || 'jpg';
  const key = `${userId}/${crypto.randomUUID()}.${ext}`;

  await env.IMAGES.put(key, buf, {
    httpMetadata: { contentType },
    customMetadata: { userId },
  });

  return jsonResponse({ key, url: publicImageUrl(request, key) }, 201);
}

async function handleServeImage(env: Env, key: string): Promise<Response> {
  if (!/^[0-9a-z-]+\/[0-9a-z._-]+\.[a-z0-9]+$/i.test(key)) {
    return jsonResponse({ error: 'Invalid image key' }, 400);
  }
  const obj = await env.IMAGES.get(key);
  if (!obj) return jsonResponse({ error: 'Not found' }, 404);

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(obj.body, { headers });
}

async function handleGetCollection(request: Request, env: Env): Promise<Response> {
  const userId = getUserId(request);
  if (!userId) return jsonResponse({ error: 'Missing or invalid userId' }, 400);

  const url = new URL(request.url);
  const rawLimit = parseInt(url.searchParams.get('limit') || '', 10);
  const limit = Math.min(
    Math.max(Number.isFinite(rawLimit) ? rawLimit : DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE,
  );
  const cursor = url.searchParams.get('cursor');
  const cursorTs = cursor ? parseInt(cursor, 10) : null;

  let query: D1PreparedStatement;
  if (cursorTs && Number.isFinite(cursorTs)) {
    query = env.DB.prepare(
      'SELECT id, perfume_json, created_at FROM collection_items WHERE user_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?'
    ).bind(userId, cursorTs, limit);
  } else {
    query = env.DB.prepare(
      'SELECT id, perfume_json, created_at FROM collection_items WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(userId, limit);
  }

  const result = await query.all<{
    id: string;
    perfume_json: string;
    created_at: number;
  }>();

  const rows = result.results ?? [];
  const items = rows.map((row) => {
    let perfume: unknown = {};
    try {
      perfume = JSON.parse(row.perfume_json);
    } catch {
      // corrupted row — skip but keep id
    }
    return { id: row.id, createdAt: row.created_at, perfume };
  });

  const nextCursor = rows.length === limit ? String(rows[rows.length - 1].created_at) : null;

  return jsonResponse({ items, nextCursor });
}

async function handleAddToCollection(request: Request, env: Env): Promise<Response> {
  const userId = getUserId(request);
  if (!userId) return jsonResponse({ error: 'Missing or invalid userId' }, 400);

  type SimilarListing = {
    name: string;
    brand: string;
    estimatedPrice: string;
    retailer?: string;
    imageUrl?: string | null;
    productUrl?: string | null;
    condition?: string | null;
  };
  let body: { perfume?: unknown; imageUri?: string; imageKey?: string; similarListings?: unknown };
  try {
    body = await request.json<typeof body>();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }
  if (!body.perfume || typeof body.perfume !== 'object') {
    return jsonResponse({ error: 'Missing "perfume"' }, 400);
  }

  const perfumeStr = JSON.stringify(body.perfume);
  if (perfumeStr.length > 16 * 1024) {
    return jsonResponse({ error: 'Perfume payload too large' }, 413);
  }

  const id = crypto.randomUUID();
  const createdAt = Date.now();

  // Prefer the R2-hosted URL; fall back to whatever client sent (may be a file:// uri)
  const imageUrl = body.imageKey
    ? publicImageUrl(request, body.imageKey)
    : (typeof body.imageUri === 'string' ? body.imageUri : null);

  const sanitizeListings = (input: unknown): SimilarListing[] => {
    if (!Array.isArray(input)) return [];
    const out: SimilarListing[] = [];
    for (const row of input) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const imageUrl = typeof r.imageUrl === 'string' ? r.imageUrl : null;
      const productUrl = typeof r.productUrl === 'string' ? r.productUrl : null;
      if (!imageUrl || !productUrl) continue;
      out.push({
        name: typeof r.name === 'string' ? r.name : '',
        brand: typeof r.brand === 'string' ? r.brand : '',
        estimatedPrice: typeof r.estimatedPrice === 'string' ? r.estimatedPrice : '',
        retailer: typeof r.retailer === 'string' ? r.retailer : undefined,
        imageUrl,
        productUrl,
        condition: typeof r.condition === 'string' ? r.condition : null,
      });
      if (out.length >= 20) break;
    }
    return out;
  };

  let cachedSimilarListings = sanitizeListings(body.similarListings);
  if (cachedSimilarListings.length === 0) {
    try {
      const perfumeObj = body.perfume as Record<string, unknown>;
      const n = typeof perfumeObj?.name === 'string' ? perfumeObj.name : '';
      const b = typeof perfumeObj?.brand === 'string' ? perfumeObj.brand : '';
      const q = `${b} ${n} perfume`.trim().toLowerCase();
      if (q) {
        const cacheKeyV5Pattern = `v5:%:${q}`;
        const cacheKeyV4 = `v4:${q}`;
        const cached = await env.DB.prepare(
          'SELECT response_json FROM similar_cache WHERE query = ? OR query LIKE ? ORDER BY created_at DESC LIMIT 1'
        ).bind(cacheKeyV4, cacheKeyV5Pattern).first<{ response_json: string }>();
        if (cached?.response_json) {
          const parsed = JSON.parse(cached.response_json) as { results?: unknown };
          cachedSimilarListings = sanitizeListings(parsed.results);
        }
      }
    } catch {
      // ignore; saving item should still succeed without cached similar listings
    }
  }

  const perfumeJson = JSON.stringify({
    ...(body.perfume as object),
    imageUri: imageUrl,
    imageKey: body.imageKey ?? null,
    cachedSimilarListings,
  });

  await env.DB.prepare(
    'INSERT INTO collection_items (id, user_id, perfume_json, created_at) VALUES (?, ?, ?, ?)'
  )
    .bind(id, userId, perfumeJson, createdAt)
    .run();

  return jsonResponse({ id, createdAt, imageUri: imageUrl }, 201);
}

async function handleDeleteFromCollection(
  request: Request,
  env: Env,
  itemId: string,
): Promise<Response> {
  const userId = getUserId(request);
  if (!userId) return jsonResponse({ error: 'Missing or invalid userId' }, 400);
  if (!itemId || !/^[0-9a-f-]{36}$/i.test(itemId)) {
    return jsonResponse({ error: 'Invalid item id' }, 400);
  }

  // Fetch the row first so we know which R2 object to delete
  const row = await env.DB.prepare(
    'SELECT perfume_json FROM collection_items WHERE id = ? AND user_id = ?'
  )
    .bind(itemId, userId)
    .first<{ perfume_json: string }>();

  if (row) {
    try {
      const data = JSON.parse(row.perfume_json) as { imageKey?: string | null };
      if (data.imageKey) {
        await env.IMAGES.delete(data.imageKey);
      }
    } catch {
      // ignore; orphaned image is not fatal
    }
  }

  await env.DB.prepare('DELETE FROM collection_items WHERE id = ? AND user_id = ?')
    .bind(itemId, userId)
    .run();

  return jsonResponse({ ok: true });
}

// ----------------------------- Delete Account -----------------------------

async function handleDeleteAccount(request: Request, env: Env): Promise<Response> {
  const userId = getUserId(request);
  if (!userId) return jsonResponse({ error: 'Missing or invalid userId' }, 400);

  const rows = await env.DB.prepare(
    'SELECT perfume_json FROM collection_items WHERE user_id = ?'
  )
    .bind(userId)
    .all<{ perfume_json: string }>();

  for (const row of rows.results || []) {
    try {
      const data = JSON.parse(row.perfume_json) as { imageKey?: string | null };
      if (data.imageKey) {
        await env.IMAGES.delete(data.imageKey);
      }
    } catch {}
  }

  await env.DB.prepare('DELETE FROM collection_items WHERE user_id = ?')
    .bind(userId)
    .run();

  return jsonResponse({ ok: true });
}

// ----------------------------- Similar Listings (SerpAPI) -----------------------------

async function handleGetSimilar(url: URL, env: Env): Promise<Response> {
  if (!env.SERPAPI_KEY) {
    return jsonResponse({ error: 'SerpAPI key not configured' }, 501);
  }
  const serpApiKey = env.SERPAPI_KEY;

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS similar_cache (
      query TEXT PRIMARY KEY,
      response_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `).run();

  const q = url.searchParams.get('q');
  if (!q) {
    return jsonResponse({ error: 'Missing q parameter' }, 400);
  }
  const countryParam = (url.searchParams.get('country') || 'us').toLowerCase();
  const hlParam = (url.searchParams.get('hl') || 'en').toLowerCase();
  const gl = /^[a-z]{2}$/.test(countryParam) ? countryParam : 'us';
  const hl = /^[a-z]{2}$/.test(hlParam) ? hlParam : 'en';

  const cacheKey = `v5:${gl}:${hl}:${q.toLowerCase().trim()}`;
  const noCache = url.searchParams.get('nocache') === '1';

  if (!noCache) {
    const cached = await env.DB.prepare(
      'SELECT response_json, created_at FROM similar_cache WHERE query = ? AND created_at > ?'
    ).bind(cacheKey, Date.now() - 24 * 60 * 60 * 1000).first<{ response_json: string }>();

    if (cached) {
      try {
        return jsonResponse({ ...JSON.parse(cached.response_json), cached: true });
      } catch {}
    }
  }

  const nameHint = url.searchParams.get('name')?.toLowerCase().trim() || '';

  const organicQueries = [
    `${q} where to buy`,
    `${q} site:amazon.com`,
    `${q} site:ebay.com`,
    `${q} (site:walmart.com OR site:sephora.com OR site:ulta.com OR site:nordstrom.com OR site:macys.com OR site:fragrancenet.com)`,
  ];

  // Parallel calls: shopping (images+prices) + multiple organic (direct URLs)
  const [shoppingRes, ...organicResponses] = await Promise.all([
    fetch(`https://serpapi.com/search.json?${new URLSearchParams({
      engine: 'google_shopping', q, api_key: serpApiKey, num: '40', gl, hl,
    })}`),
    ...organicQueries.map((oq) =>
      fetch(`https://serpapi.com/search.json?${new URLSearchParams({
        engine: 'google',
        q: oq,
        api_key: serpApiKey,
        num: '40',
        gl,
        hl,
      })}`),
    ),
  ]);

  if (!shoppingRes.ok) {
    return jsonResponse({ error: 'SerpAPI request failed' }, 502);
  }

  type ShopItem = { title?: string; price?: string; source?: string; thumbnail?: string; condition?: string; product_link?: string; link?: string };
  const shoppingData = await shoppingRes.json<{ shopping_results?: ShopItem[] }>();

  if (url.searchParams.get('debug') === '1') {
    return jsonResponse({
      shopping_count: shoppingData.shopping_results?.length || 0,
      shopping_sources: (shoppingData.shopping_results || []).map(s => ({
        source: s.source, product_link: s.product_link || null, has_link: !!s.link,
      })),
    });
  }

  type OI = { title?: string; link?: string; displayed_link?: string };
  const organicSets = await Promise.all(
    organicResponses.map(async (res) => {
      if (!res.ok) return [] as OI[];
      const data = await res.json<{ organic_results?: OI[] }>();
      return data.organic_results || [];
    }),
  );
  const organicCandidates: OI[] = organicSets.flat();

  const skipDomains = ['fragrantica.com', 'wikipedia.org', 'youtube.com', 'reddit.com', 'basenotes.com', 'parfumo.com'];
  function isSkippedDomain(link: string): boolean {
    try {
      const host = new URL(link).hostname.toLowerCase();
      return skipDomains.some(d => host.includes(d));
    } catch { return false; }
  }

  function getDomainKey(hostname: string): string {
    const parts = hostname.toLowerCase().replace(/^www\./, '').split('.').filter(Boolean);
    if (parts.length <= 1) return parts[0] || hostname.toLowerCase();
    const tld2 = parts[parts.length - 2];
    if (['co', 'com', 'net', 'org'].includes(tld2) && parts.length >= 3) return parts[parts.length - 3];
    return parts[parts.length - 2];
  }

  function getSourceKey(source?: string): string {
    if (!source) return '';
    const primary = source.split('|')[0].split('-')[0].trim().toLowerCase();
    const cleaned = primary.replace(/^www\./, '').replace(/\.(com|net|org|co\.uk)$/g, '');
    return cleaned.replace(/[^a-z0-9]/g, '');
  }

  function scoreOrganicResult(item: OI, queryWords: string[]): number {
    const text = `${item.title || ''} ${item.link || ''}`.toLowerCase();
    let score = 0;
    for (const w of queryWords) {
      if (text.includes(w)) score += 2;
    }
    if (text.includes('amazon.com') || text.includes('ebay.com')) score += 2;
    return score;
  }

  function isLikelyProductUrl(link: string): boolean {
    try {
      const u = new URL(link);
      const host = u.hostname.toLowerCase();
      const path = u.pathname.toLowerCase();

      if (host.includes('amazon.')) return path.includes('/dp/') || path.includes('/gp/product/');
      if (host.includes('ebay.')) return path.includes('/itm/');
      if (host.includes('walmart.')) return path.includes('/ip/');

      if (path.includes('/search') || path === '/s' || path === '/shop' || path.endsWith('/category')) return false;
      return true;
    } catch {
      return false;
    }
  }

  type R = { name: string; brand: string; estimatedPrice: string; retailer: string; imageUrl: string | null; productUrl: string | null; condition: string | null };
  const queryWords = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && w !== 'perfume' && w !== 'buy' && w !== 'online');
  const nameWords = nameHint.split(/\s+/).filter((w) => w.length > 2);
  const strongWords = nameWords.length > 0 ? nameWords : queryWords;
  const requiredTokenHits = Math.min(2, Math.max(1, strongWords.length));
  function isMajorRetailerDomain(domain: string): boolean {
    const d = domain.toLowerCase();
    return d.includes('amazon.') || d.includes('ebay.');
  }

  function normalizeRetailerName(source: string | undefined, domain: string): string {
    const d = domain.toLowerCase();
    if (d.includes('amazon.')) return 'Amazon';
    if (d.includes('ebay.')) return 'eBay';
    if (d.includes('walmart.')) return 'Walmart';
    return source || domain;
  }

  function countTokenHits(text: string, tokens: string[]): number {
    const normalized = text.toLowerCase();
    let hits = 0;
    for (const t of tokens) {
      if (normalized.includes(t)) hits += 1;
    }
    return hits;
  }

  type PreparedShop = ShopItem & { _id: string; _hits: number; _titleText: string };
  const preparedShopping: PreparedShop[] = (shoppingData.shopping_results || []).map((s, i) => {
    const titleText = `${s.title || ''} ${s.source || ''}`.toLowerCase();
    return {
      ...s,
      _id: `${i}:${s.title || ''}:${s.source || ''}`,
      _hits: countTokenHits(titleText, strongWords),
      _titleText: titleText,
    };
  });

  const relevantShopping = preparedShopping.filter((s) => Boolean(s.thumbnail) && s._hits >= requiredTokenHits);
  const bySourceKey = new Map<string, ShopItem[]>();
  function isRelevantProductText(text: string): boolean {
    return countTokenHits(text, strongWords) >= requiredTokenHits;
  }

  for (const s of shoppingData.shopping_results || []) {
    const key = getSourceKey(s.source);
    if (!key) continue;
    if (!bySourceKey.has(key)) bySourceKey.set(key, []);
    bySourceKey.get(key)!.push(s);
  }

  const usedSourceKeys = new Set<string>();
  const usedShoppingIds = new Set<string>();
  const seenUrls = new Set<string>();
  const domainCounts = new Map<string, number>();
  const MAX_PER_DOMAIN = 2;
  const all: Array<R & { _score: number }> = [];

  for (const item of organicCandidates) {
    const link = item.link || '';
    if (!link || isSkippedDomain(link)) continue;

    let domain = '';
    let domainKey = '';
    try {
      domain = new URL(link).hostname.replace('www.', '').toLowerCase();
      domainKey = getDomainKey(domain);
    } catch {
      continue;
    }
    if (!isLikelyProductUrl(link)) continue;
    if (seenUrls.has(link)) continue;
    if ((domainCounts.get(domain) || 0) >= MAX_PER_DOMAIN) continue;
    if (link.includes('https:/www.') || link.includes('http:/www.')) continue;

    const titleText = (item.title || '').toLowerCase();
    const text = `${titleText} ${domain} ${link}`.toLowerCase();
    const nameMatch = nameWords.length === 0 ? true : nameWords.some((w) => text.includes(w));
    const queryMatch = queryWords.some((w) => text.includes(w));
    const isMajor = domain.includes('amazon.') || domain.includes('ebay.');

    const domainRequiredHits = isMajorRetailerDomain(domain) ? 1 : requiredTokenHits;
    const shoppingMatches = preparedShopping
      .filter((m) => Boolean(m.thumbnail))
      .filter((m) => m._hits >= domainRequiredHits)
      .filter((m) => getSourceKey(m.source) === domainKey);
    let shopping = shoppingMatches.find((m) => !usedShoppingIds.has(m._id)) || shoppingMatches[0];

    // If domain has no product image match, use best globally relevant product image.
    if (!shopping) {
      const organicText = `${item.title || ''} ${domain}`.toLowerCase();
      const bestGlobal = relevantShopping
        .filter((m) => !usedShoppingIds.has(m._id))
        .map((m) => {
          const overlap = countTokenHits(`${m._titleText} ${organicText}`, strongWords);
          return { m, overlap };
        })
        .sort((a, b) => b.overlap - a.overlap)[0];
      if (bestGlobal && bestGlobal.overlap >= domainRequiredHits) {
        shopping = bestGlobal.m;
      }
    }

    if (shopping) {
      usedSourceKeys.add(`${domainKey}:${shopping.title || ''}`);
      usedShoppingIds.add(shopping._id);
    }

    seenUrls.add(link);
    domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
    all.push({
      name: shopping?.title || item.title || '',
      brand: '',
      estimatedPrice: shopping?.price || '',
      retailer: normalizeRetailerName(shopping?.source, domain),
      imageUrl: shopping?.thumbnail || null,
      productUrl: link,
      condition: shopping?.condition || null,
      _score: scoreOrganicResult(item, queryWords) + (nameMatch ? 2 : 0) + (queryMatch ? 1 : 0) + (isMajor ? 2 : 0) + (shopping?.price ? 3 : 0) + (shopping?.thumbnail ? 2 : 0),
    });
  }

  // Add shopping rows when SerpAPI gives non-Google direct links.
  for (const s of shoppingData.shopping_results || []) {
    const candidate = s.product_link || s.link || '';
    if (!candidate || isSkippedDomain(candidate)) continue;
    if (!isLikelyProductUrl(candidate)) continue;
    let parsed: URL;
    try {
      parsed = new URL(candidate);
    } catch {
      continue;
    }
    const prepared = preparedShopping.find((p) => p.title === s.title && p.source === s.source && p.thumbnail === s.thumbnail);
    if (!prepared?.thumbnail) continue;
    const minHits = isMajorRetailerDomain(parsed.hostname) ? 1 : requiredTokenHits;
    if (prepared._hits < minHits) continue;
    const host = parsed.hostname.toLowerCase();
    if (host.includes('google.com') || host.includes('google.co.')) continue;
    const domain = host.replace(/^www\./, '');
    if (seenUrls.has(candidate)) continue;
    if ((domainCounts.get(domain) || 0) >= MAX_PER_DOMAIN) continue;
    seenUrls.add(candidate);
    domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
    all.push({
      name: s.title || '',
      brand: '',
      estimatedPrice: s.price || '',
      retailer: normalizeRetailerName(s.source, domain),
      imageUrl: prepared.thumbnail,
      productUrl: candidate,
      condition: s.condition || null,
      _score: 8 + (s.price ? 3 : 0) + (prepared.thumbnail ? 2 : 0) + prepared._hits,
    });
  }

  const results = all
    .sort((a, b) => b._score - a._score)
    .filter((r) => Boolean(r.productUrl) && Boolean(r.imageUrl))
    .slice(0, 20)
    .map(({ _score, ...row }) => row);

  try {
    await env.DB.prepare(
      'INSERT OR REPLACE INTO similar_cache (query, response_json, created_at) VALUES (?, ?, ?)'
    ).bind(cacheKey, JSON.stringify({ results }), Date.now()).run();
  } catch (e) {
    console.error('Cache write failed:', e);
  }

  return jsonResponse({ results });
}

// ----------------------------- Articles Handlers -----------------------------

function handleGetArticles(request: Request, _env: Env): Response {
  const mapped = ARTICLES.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle,
    description: a.description,
    tags: a.tags,
    icon: a.icon,
    color: a.color,
    readingTime: a.readingTime,
    imageUrl: getArticleImageUrl(request, a),
    sections: a.sections,
  }));
  return jsonResponse(
    { articles: mapped },
    200,
    { 'Cache-Control': 'public, max-age=300' },
  );
}

async function handleGenerateArticleImages(request: Request, env: Env): Promise<Response> {
  if (!env.REPLICATE_API_KEY) {
    return jsonResponse({ error: 'REPLICATE_API_KEY not configured' }, 501);
  }

  const articlesNeedingImages = ARTICLES.filter((a) => !a.imageKey);
  if (articlesNeedingImages.length === 0) {
    return jsonResponse({ message: 'All articles already have images', count: 0 });
  }

  const results: Array<{ id: string; slug: string; status: string; imageKey?: string }> = [];

  for (const article of articlesNeedingImages) {
    try {
      const prompt = buildImagePrompt(article);

      // Create a prediction using FLUX Schnell (fast, high quality)
      const createRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          input: {
            prompt,
            num_outputs: 1,
            aspect_ratio: '16:9',
            output_format: 'webp',
            output_quality: 85,
          },
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.text();
        console.error(`Replicate error for ${article.slug}:`, err);
        results.push({ id: article.id, slug: article.slug, status: 'replicate_error' });
        continue;
      }

      const prediction = await createRes.json<{
        status: string;
        output?: string[];
        error?: string;
      }>();

      if (prediction.status !== 'succeeded' || !prediction.output?.[0]) {
        console.error(`Prediction not ready for ${article.slug}:`, prediction.status, prediction.error);
        results.push({ id: article.id, slug: article.slug, status: prediction.status || 'no_output' });
        continue;
      }

      const imageUrl = prediction.output[0];
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        results.push({ id: article.id, slug: article.slug, status: 'download_failed' });
        continue;
      }

      const imgBuf = await imgRes.arrayBuffer();
      const key = `articles/${article.slug}.webp`;
      await env.IMAGES.put(key, imgBuf, {
        httpMetadata: { contentType: 'image/webp' },
        customMetadata: { articleId: article.id },
      });

      article.imageKey = key;
      results.push({ id: article.id, slug: article.slug, status: 'ok', imageKey: key });
    } catch (err: any) {
      console.error(`Error generating image for ${article.slug}:`, err);
      results.push({ id: article.id, slug: article.slug, status: 'error' });
    }
  }

  return jsonResponse({ generated: results });
}

function buildImagePrompt(article: Article): string {
  const prompts: Record<string, string> = {
    'fragrance-families-explained':
      'Elegant flat-lay of four distinct perfume bottles arranged on marble, each representing a fragrance family: a floral pink bottle with rose petals, a warm amber bottle with spices, a woody dark bottle with cedar chips, and a fresh glass bottle with citrus slices. Luxury product photography, soft warm lighting, editorial style, 4k',
    'understanding-perfume-notes':
      'Artistic visualization of a perfume notes pyramid: fresh citrus and herbs floating at top, roses and jasmine in the middle, deep woods and vanilla at the base. Translucent layers, dreamy atmosphere, luxury fragrance art, warm gold tones, editorial photography, 4k',
    'how-to-apply-perfume':
      'Close-up of elegant hands spraying luxury perfume on the wrist, golden perfume mist visible in warm backlight, silk fabric in background, sophisticated beauty photography, soft bokeh, warm amber tones, editorial style, 4k',
    'edt-vs-edp-explained':
      'Three luxury perfume bottles of different sizes lined up showing concentration levels, from light to dark amber liquid, crystal clear glass, dramatic studio lighting with golden reflections, luxury product photography, minimalist composition, 4k',
    'storing-your-fragrances':
      'A beautiful dark wood fragrance cabinet with perfume bottles arranged neatly, warm accent lighting, leather and velvet interior, collector display, moody atmospheric photography, rich warm tones, luxury interior, 4k',
    'best-perfumes-for-date-night':
      'Romantic still life: a dark luxury perfume bottle surrounded by red rose petals and soft candlelight, silk fabric, gold accents, intimate evening atmosphere, luxury beauty photography, warm moody tones, 4k',
    'seasonal-fragrance-guide':
      'Four seasons perfume concept: a perfume bottle in the center with four quadrants showing spring flowers, summer citrus and ocean, autumn leaves and spices, winter snow and warm amber. Artistic editorial photography, warm rich colors, 4k',
    'building-a-perfume-collection':
      'A curated perfume collection of 6-8 luxury bottles arranged on a marble shelf, varying heights and designs, warm golden hour lighting, interior design photography, sophisticated and organized display, soft shadows, 4k',
  };
  return prompts[article.slug] || `Luxury perfume editorial photo for an article about "${article.title}", warm golden tones, sophisticated, 4k product photography`;
}
