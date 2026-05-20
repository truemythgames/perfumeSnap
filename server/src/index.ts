interface Env {
  OPENAI_API_KEY: string;
  DB: D1Database;
  IMAGES: R2Bucket;
  SERPER_API_KEY?: string;
  /** @deprecated use SERPER_API_KEY — kept for existing Cloudflare secret */
  PRICES_API_KEY?: string;
  REPLICATE_API_KEY?: string;
  ADMIN_KEY?: string;
  RESEND_API_KEY?: string;
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

const SYSTEM_PROMPT = `You are PerfumeSnap, the world's most accurate AI perfume identifier. You have encyclopedic knowledge of every perfume, cologne, and fragrance ever produced — including their bottle designs, packaging, cap styles, label typography, and color schemes.

IDENTIFICATION METHOD — Follow this exact process:
1. TEXT READING: First, read ALL visible text in the image — brand names, fragrance names, concentrations (EDP, EDT, Parfum), volume (ml/oz), any words on the box or bottle. Even partial or blurry text matters.
2. BOTTLE ANALYSIS: Examine the bottle shape, cap design, glass color/tint, spray mechanism, and any distinctive design elements (facets, curves, texturing).
3. PACKAGING: If a box is visible, note colors, patterns, fonts, embossing, and overall design language.
4. BRAND MATCHING: Match visual clues to known brand aesthetics (e.g. Chanel = minimalist black/white, Tom Ford = dark lacquered, Jo Malone = cream/black stripe).
5. CROSS-REFERENCE: Combine all clues to identify the exact fragrance, including the specific flanker/variant if applicable.
6. SELF-CHECK: Before responding, verify your identification. Does the bottle shape, color, cap, and text all consistently point to the same fragrance? If not, reconsider.

CRITICAL RULES:
- ALWAYS set "identified" to true. NEVER set it to false. No exceptions.
- You MUST always return a complete, filled-out response no matter what is in the image.
- Even from partial labels, side angles, blurry photos, or just a bottle silhouette — you MUST identify it. Use every visual clue available.
- The "name" field MUST be the full commercial fragrance name including line/flanker and concentration when distinguishable. Example: "Dior Sauvage Elixir", not just "Sauvage".
- If you see partial text, reconstruct the full name from what's visible combined with your knowledge of existing products.
- If you can only identify the brand but not the exact fragrance, pick the brand's fragrance that BEST matches the bottle design, color, and any visible text.
- If the image does NOT show a perfume (e.g. a beer, a shoe, food, anything): still set "identified" to true, identify the product/object as best you can, and adapt all fields creatively. The user should always get a fun, useful result.

QUALITY STANDARDS:
- "description" must be 4-6 rich sentences covering: the overall character, what makes this fragrance unique, who it's best for, how it performs, and the story/inspiration behind it.
- Notes must be accurate and comprehensive (4-6 notes per layer when available).
- DO NOT guess prices. Real prices are fetched separately from live retailer data.
- "rating" should reflect the community consensus (Fragrantica/Parfumo style, out of 5).
- Include accurate "perfumer" — this is a key detail enthusiasts care about.
- "accords" must list the dominant scent characteristics with percentage strength (0-100). Include 4-8 accords, sorted by strength descending. Use standard accord names: woody, citrus, fresh, sweet, floral, spicy, warm spicy, aromatic, powdery, musky, amber, green, fruity, aquatic, leather, smoky, balsamic, oud, earthy, etc.
- "longevityScore" is a number 1-10 (1=very weak, 10=beast mode).
- "sillageScore" is a number 1-10 (1=intimate skin scent, 10=fills a room).
- "dayNight" is "day", "night", or "versatile".
- "layeringNotes" should suggest 2-3 specific fragrances that pair well with this one.
- "dupes" should list 2-3 affordable alternatives that smell similar. Do NOT include prices for dupes — only name and brand.
- "popularityRank" should be a brief text like "Top 10 men's fragrance worldwide" or "Cult classic among niche enthusiasts" — be specific and honest.
- "reformulated" should note if the fragrance has been reformulated and what changed, or null if not applicable.
- "wearerProfile" should briefly describe who typically wears this (age range, style, occasion type).

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
  "topNotes": ["note1", "note2", "note3", "note4"],
  "heartNotes": ["note1", "note2", "note3", "note4"],
  "baseNotes": ["note1", "note2", "note3", "note4"],
  "accords": [
    { "name": "Woody", "strength": 85 },
    { "name": "Spicy", "strength": 70 },
    { "name": "Sweet", "strength": 45 }
  ],
  "description": "A rich 4-6 sentence description covering character, uniqueness, target audience, performance, and backstory",
  "rating": 4.5,
  "longevity": "e.g. Long-lasting (8-10 hours)",
  "longevityScore": 8,
  "sillage": "e.g. Moderate, Strong, Intimate",
  "sillageScore": 7,
  "dayNight": "versatile",
  "occasions": ["occasion1", "occasion2", "occasion3"],
  "seasons": ["season1", "season2"],
  "layeringNotes": ["Specific fragrance 1 for layering", "Specific fragrance 2"],
  "dupes": [
    { "name": "Affordable Alternative Name", "brand": "Brand" }
  ],
  "popularityRank": "Brief popularity/status description",
  "reformulated": "Description of reformulation changes, or null if not reformulated",
  "wearerProfile": "e.g. Confident men 25-40 who want a signature evening scent"
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

      if (url.pathname === '/history') {
        if (request.method === 'GET') return await handleGetHistory(request, env);
        if (request.method === 'POST') return await handleAddHistory(request, env);
        if (request.method === 'DELETE') return await handleClearHistory(request, env);
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

      // ---- Export ----
      if (url.pathname === '/export' && request.method === 'POST') {
        return await handleExportCollection(request, env);
      }

      // ---- Feedback ----
      if (url.pathname === '/feedback' && request.method === 'POST') {
        return await handleSubmitFeedback(request, env);
      }

      // ---- Admin routes (password-protected) ----
      if (url.pathname.startsWith('/admin')) {
        return await handleAdmin(request, url, env);
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

  let body: { image?: string; mimeType?: string };
  try {
    body = await request.json<{ image?: string; mimeType?: string }>();
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
              { type: 'text', text: 'Read all visible text in this image carefully. Pay close attention to any words, logos, brand markings, product shape, and design details. Then identify the product. Provide rich, accurate, and comprehensive details.' },
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
      max_tokens: 3000,
      temperature: 0.2,
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

  const aiRaw = data.choices?.[0]?.message?.content?.trim();
  if (!aiRaw) return jsonResponse({ error: 'Empty AI response' }, 502);

  const cleaned = aiRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
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
          content: `Provide detailed and comprehensive information about this perfume: "${query}". Include accurate current pricing, layering suggestions, affordable alternatives (dupes), and popularity status. Respond with the same JSON format as if you had identified it from a photo.`,
        },
      ],
      max_tokens: 3000,
        temperature: 0.2,
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
      const rawUrl = typeof r.productUrl === 'string' ? r.productUrl : null;
      if (!imageUrl || !rawUrl) continue;
      const name = typeof r.name === 'string' ? r.name : '';
      const brand = typeof r.brand === 'string' ? r.brand : '';
      const retailer = typeof r.retailer === 'string' ? r.retailer : undefined;
      const productUrl = resolveProductUrl(rawUrl, name, brand, retailer);
      out.push({
        name,
        brand,
        estimatedPrice: typeof r.estimatedPrice === 'string' ? r.estimatedPrice : '',
        retailer,
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

// ----------------------------- Scan History -----------------------------

async function handleGetHistory(request: Request, env: Env): Promise<Response> {
  const userId = request.headers.get('X-User-Id');
  if (!userId) return jsonResponse({ error: 'Missing user id' }, 401);

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS scan_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      perfume_json TEXT NOT NULL,
      image_uri TEXT,
      scanned_at INTEGER NOT NULL
    )
  `).run();

  const rows = await env.DB.prepare(
    'SELECT id, perfume_json, image_uri, scanned_at FROM scan_history WHERE user_id = ? ORDER BY scanned_at DESC LIMIT 200'
  ).bind(userId).all<{ id: string; perfume_json: string; image_uri: string | null; scanned_at: number }>();

  const items = (rows.results || []).map((r) => ({
    id: r.id,
    scannedAt: r.scanned_at,
    perfume: JSON.parse(r.perfume_json),
    imageUri: r.image_uri,
  }));

  return jsonResponse({ items });
}

async function handleAddHistory(request: Request, env: Env): Promise<Response> {
  const userId = request.headers.get('X-User-Id');
  if (!userId) return jsonResponse({ error: 'Missing user id' }, 401);

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS scan_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      perfume_json TEXT NOT NULL,
      image_uri TEXT,
      scanned_at INTEGER NOT NULL
    )
  `).run();

  let body: { perfume?: any; imageUri?: string };
  try {
    body = await request.json<{ perfume?: any; imageUri?: string }>();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  if (!body.perfume) return jsonResponse({ error: 'Missing perfume data' }, 400);

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const scannedAt = Date.now();

  await env.DB.prepare(
    'INSERT INTO scan_history (id, user_id, perfume_json, image_uri, scanned_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, userId, JSON.stringify(body.perfume), body.imageUri || null, scannedAt).run();

  return jsonResponse({ id, scannedAt });
}

async function handleClearHistory(request: Request, env: Env): Promise<Response> {
  const userId = request.headers.get('X-User-Id');
  if (!userId) return jsonResponse({ error: 'Missing user id' }, 401);

  await env.DB.prepare('DELETE FROM scan_history WHERE user_id = ?').bind(userId).run();
  return jsonResponse({ ok: true });
}

// ----------------------------- Similar Listings -----------------------------

type ProductListingRow = {
  name: string;
  brand: string;
  estimatedPrice: string;
  retailer: string;
  imageUrl: string | null;
  productUrl: string | null;
  condition: string | null;
};

type SerperShopRaw = {
  title?: string;
  price?: string;
  source?: string;
  thumbnail?: string;
  imageUrl?: string;
  link?: string;
  source_link?: string;
  vendor_link?: string;
  product_link?: string;
  condition?: string;
};

type SerperOrganicRaw = { title?: string; link?: string; displayed_link?: string };

async function serperRequest(
  endpoint: 'shopping' | 'search',
  apiKey: string,
  body: Record<string, string | number>,
): Promise<Response> {
  return fetch(`https://google.serper.dev/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify(body),
  });
}

function isGoogleListingUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname.toLowerCase().includes('google.');
  } catch {
    return false;
  }
}

function buildRetailerSearchUrl(name: string, brand: string, retailer?: string): string {
  const query = encodeURIComponent(`${brand} ${name} perfume`.trim());
  const key = (retailer || '').toLowerCase().replace(/[^a-z]/g, '');
  if (key.includes('amazon')) return `https://www.amazon.com/s?k=${query}`;
  if (key.includes('ebay')) return `https://www.ebay.com/sch/i.html?_nkw=${query}`;
  if (key.includes('sephora')) return `https://www.sephora.com/search?keyword=${query}`;
  if (key.includes('walmart')) return `https://www.walmart.com/search?q=${query}`;
  if (key.includes('fragrancenet')) return `https://www.fragrancenet.com/search?search=${query}`;
  if (key.includes('macys') || key.includes('macy')) return `https://www.macys.com/shop/search?keyword=${query}`;
  if (key.includes('nordstrom')) return `https://www.nordstrom.com/sr?keyword=${query}`;
  return `https://www.amazon.com/s?k=${query}`;
}

function resolveProductUrl(
  url: string | null | undefined,
  name: string,
  brand: string,
  retailer?: string,
): string {
  const trimmed = url?.trim();
  if (trimmed && !isGoogleListingUrl(trimmed)) return trimmed;
  return buildRetailerSearchUrl(name, brand, retailer);
}

function pickSerperProductLink(s: SerperShopRaw): string | undefined {
  for (const candidate of [s.source_link, s.vendor_link, s.product_link, s.link]) {
    if (!candidate || isGoogleListingUrl(candidate)) continue;
    return candidate;
  }
  return undefined;
}

function mapSerperShoppingItems(items: SerperShopRaw[]): Array<{
  title?: string;
  price?: string;
  source?: string;
  thumbnail?: string;
  condition?: string;
  product_link?: string;
  link?: string;
}> {
  return items.map((s) => ({
    title: s.title,
    price: s.price,
    source: s.source,
    thumbnail: s.thumbnail || s.imageUrl,
    condition: s.condition,
    product_link: pickSerperProductLink(s),
    link: s.link,
  }));
}

async function handleGetSimilar(url: URL, env: Env): Promise<Response> {
  const shoppingApiKey = env.SERPER_API_KEY || env.PRICES_API_KEY;
  if (!shoppingApiKey) {
    return jsonResponse({ error: 'Shopping API key not configured (set SERPER_API_KEY)' }, 501);
  }

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

  const cacheKey = `v10:serper:${gl}:${hl}:${q.toLowerCase().trim()}`;
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
  const brandHint = url.searchParams.get('brand')?.toLowerCase().trim() || '';

  const JUNK_PATTERNS = /\b(sample|decant|vial|travel spray|atomizer|mini\b|rollerball|gift set|body lotion|body wash|shower gel|deodorant|after.?shave|body cream|hair mist|candle|tester)\b/i;
  const STOP_WORDS = new Set(['perfume', 'parfum', 'fragrance', 'for', 'the', 'and', 'with', 'spray', 'eau', 'de', 'toilette', 'parfum', 'edp', 'edt']);
  const CONCENTRATION_TOKENS = [
    { token: 'elixir', aliases: ['elixir'] },
    { token: 'parfum', aliases: ['parfum', 'extrait'] },
    { token: 'edp', aliases: ['edp', 'eau de parfum'] },
    { token: 'edt', aliases: ['edt', 'eau de toilette'] },
    { token: 'cologne', aliases: ['cologne', 'eau de cologne'] },
  ];

  function normalizeText(v: string): string {
    return v.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function toTokens(v: string): string[] {
    return normalizeText(v).split(' ').filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  }

  function hasJunkProductWords(v: string): boolean {
    return JUNK_PATTERNS.test(v);
  }

  const nameTokens = toTokens(nameHint);
  const brandTokens = toTokens(brandHint);
  const concentrationNeeded = CONCENTRATION_TOKENS.filter((c) =>
    c.aliases.some((a) => nameHint.includes(a)),
  );

  function titleLooksRelevant(title: string): boolean {
    const t = normalizeText(title);
    if (!t) return false;
    if (hasJunkProductWords(t)) return false;

    if (brandTokens.length > 0 && !brandTokens.some((bt) => t.includes(bt))) return false;

    if (nameTokens.length > 0) {
      const hits = nameTokens.filter((nt) => t.includes(nt)).length;
      const minHits = Math.max(1, Math.ceil(nameTokens.length * 0.6));
      if (hits < minHits) return false;
    }

    for (const c of concentrationNeeded) {
      if (!c.aliases.some((a) => t.includes(a))) return false;
    }

    return true;
  }

  const organicQueries = [
    `${q} where to buy`,
    `${q} site:amazon.com`,
    `${q} site:ebay.com`,
    `${q} (site:walmart.com OR site:sephora.com OR site:ulta.com OR site:nordstrom.com OR site:macys.com OR site:fragrancenet.com)`,
  ];

  // Parallel calls: Serper shopping (images+prices) + organic search (direct retailer URLs)
  const [shoppingRes, ...organicResponses] = await Promise.all([
    serperRequest('shopping', shoppingApiKey, { q, gl, hl, num: 40 }),
    ...organicQueries.map((oq) =>
      serperRequest('search', shoppingApiKey, { q: oq, gl, hl, num: 40 }),
    ),
  ]);

  if (!shoppingRes.ok) {
    return jsonResponse({ error: 'Shopping search request failed' }, 502);
  }

  type ShopItem = { title?: string; price?: string; source?: string; thumbnail?: string; condition?: string; product_link?: string; link?: string };
  const shoppingPayload = await shoppingRes.json<{ shopping?: SerperShopRaw[]; shopping_results?: SerperShopRaw[] }>();
  const shoppingData = { shopping_results: mapSerperShoppingItems(shoppingPayload.shopping || shoppingPayload.shopping_results || []) };

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
      const data = await res.json<{ organic?: SerperOrganicRaw[]; organic_results?: SerperOrganicRaw[] }>();
      const rows = data.organic || data.organic_results || [];
      return rows.map((o) => ({ title: o.title, link: o.link, displayed_link: o.displayed_link }));
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
      if (host.includes('google.')) return false;
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

  type R = ProductListingRow;
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
  const preparedShopping: PreparedShop[] = (shoppingData.shopping_results || [])
    .filter((s) => Boolean(s.title) && titleLooksRelevant(s.title || ''))
    .map((s, i) => {
      const titleText = `${s.title || ''} ${s.source || ''}`.toLowerCase();
      return {
        ...s,
        _id: `${i}:${s.title || ''}:${s.source || ''}`,
        _hits: countTokenHits(titleText, strongWords),
        _titleText: titleText,
      };
    });

  const usedShoppingIds = new Set<string>();
  const seenUrls = new Set<string>();
  const domainCounts = new Map<string, number>();
  const MAX_PER_DOMAIN = 2;
  const all: Array<R & { _score: number }> = [];

  for (const item of organicCandidates) {
    const link = item.link || '';
    if (!link || isSkippedDomain(link)) continue;
    if (!titleLooksRelevant(item.title || '')) continue;

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

    if (shopping) {
      usedShoppingIds.add(shopping._id);
    }

    const rawPaired = shopping?.product_link || link;
    if (!rawPaired || isGoogleListingUrl(rawPaired) || !isLikelyProductUrl(rawPaired)) continue;
    const pairedUrl = rawPaired;
    if (seenUrls.has(pairedUrl)) continue;

    let pairedDomain = domain;
    try {
      pairedDomain = new URL(pairedUrl).hostname.replace('www.', '').toLowerCase();
    } catch {}

    seenUrls.add(pairedUrl);
    domainCounts.set(pairedDomain, (domainCounts.get(pairedDomain) || 0) + 1);
    all.push({
      name: shopping?.title || item.title || '',
      brand: '',
      estimatedPrice: shopping?.price || '',
      retailer: normalizeRetailerName(shopping?.source, domain),
      imageUrl: shopping?.thumbnail || null,
      productUrl: pairedUrl,
      condition: shopping?.condition || null,
      _score: scoreOrganicResult(item, queryWords) + (nameMatch ? 2 : 0) + (queryMatch ? 1 : 0) + (isMajor ? 2 : 0) + (shopping?.price ? 3 : 0) + (shopping?.thumbnail ? 2 : 0),
    });
  }

  // Add shopping rows with direct retailer links from shopping index.
  for (const s of preparedShopping) {
    const candidate = s.product_link || '';
    if (!candidate || isSkippedDomain(candidate) || isGoogleListingUrl(candidate)) continue;
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

  const ranked = all.sort((a, b) => b._score - a._score);

  const strict = ranked
    .filter((r) => Boolean(r.productUrl) && Boolean(r.imageUrl) && Boolean((r.estimatedPrice || '').trim()))
    .slice(0, 20);

  const relaxed = ranked
    .filter((r) => Boolean(r.productUrl) && Boolean(r.imageUrl))
    .slice(0, 20);

  const fallbackFromShopping: Array<R & { _score: number }> = preparedShopping
    .filter((s) => Boolean(s.thumbnail) && Boolean((s.price || '').trim()) && s._hits >= 1)
    .slice(0, 20)
    .map((s) => ({
      name: s.title || q,
      brand: '',
      estimatedPrice: s.price || '',
      retailer: normalizeRetailerName(s.source, ''),
      imageUrl: s.thumbnail || null,
      productUrl: resolveProductUrl(s.product_link, s.title || q, '', normalizeRetailerName(s.source, '')),
      condition: s.condition || null,
      _score: 6 + s._hits + (s.price ? 2 : 0) + (s.thumbnail ? 2 : 0),
    }));

  const merged: Array<R & { _score: number }> = [];
  const seenProductUrls = new Set<string>();
  const appendUnique = (rows: Array<R & { _score: number }>) => {
    for (const row of rows) {
      if (!row.productUrl) continue;
      if (seenProductUrls.has(row.productUrl)) continue;
      seenProductUrls.add(row.productUrl);
      merged.push(row);
      if (merged.length >= 20) break;
    }
  };

  appendUnique(strict);
  if (merged.length < 6) appendUnique(relaxed);
  if (merged.length < 6) appendUnique(fallbackFromShopping);

  const results = merged.map(({ _score, ...row }) => ({
    ...row,
    productUrl: resolveProductUrl(row.productUrl, row.name, row.brand, row.retailer),
  }));

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

// ----------------------------- Feedback -----------------------------

async function handleSubmitFeedback(request: Request, env: Env): Promise<Response> {
  const userId = request.headers.get('X-User-Id');
  if (!isValidUserId(userId)) {
    return jsonResponse({ error: 'Missing or invalid X-User-Id' }, 400);
  }

  const body = await request.json<{
    perfumeName?: string;
    perfumeBrand?: string;
    satisfied?: boolean;
    category?: string;
    message?: string;
  }>();

  if (!body.perfumeName) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const category = body.category || (body.satisfied === true ? 'like' : body.satisfied === false ? 'incorrect' : '');
  if (!category) {
    return jsonResponse({ error: 'Missing category or satisfied' }, 400);
  }

  const satisfied =
    category === 'like' ? 1 : category === 'incorrect' ? 0 : body.satisfied === true ? 1 : body.satisfied === false ? 0 : 1;
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      perfume_name TEXT NOT NULL,
      perfume_brand TEXT NOT NULL,
      satisfied INTEGER NOT NULL,
      category TEXT,
      message TEXT,
      created_at INTEGER NOT NULL
    )
  `).run();

  try {
    await env.DB.prepare('ALTER TABLE feedback ADD COLUMN category TEXT').run();
  } catch { /* column exists */ }
  try {
    await env.DB.prepare('ALTER TABLE feedback ADD COLUMN message TEXT').run();
  } catch { /* column exists */ }

  const brand = body.perfumeBrand || '';
  const createdAt = Date.now();
  try {
    await env.DB.prepare(
      'INSERT INTO feedback (user_id, perfume_name, perfume_brand, satisfied, category, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(userId, body.perfumeName, brand, satisfied, category, message || '', createdAt).run();
  } catch (e) {
    console.error('Feedback insert (extended) failed, using legacy columns:', e);
    const legacyBrand = message ? `${brand} [${category}] ${message}`.slice(0, 500) : brand;
    await env.DB.prepare(
      'INSERT INTO feedback (user_id, perfume_name, perfume_brand, satisfied, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, body.perfumeName, legacyBrand, satisfied, createdAt).run();
  }

  return jsonResponse({ ok: true });
}

// ----------------------------- Export --------------------------------

function escCsv(value: unknown): string {
  const s = String(value ?? '').replace(/\r?\n/g, ' ');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function handleExportCollection(request: Request, env: Env): Promise<Response> {
  const userId = getUserId(request);
  if (!userId) return jsonResponse({ error: 'Missing or invalid userId' }, 400);

  let body: { email?: string; itemIds?: string[] };
  try {
    body = await request.json<{ email?: string; itemIds?: string[] }>();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const email = (body.email || '').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: 'Invalid email address' }, 400);
  }

  const specificIds = Array.isArray(body.itemIds) && body.itemIds.length > 0
    ? body.itemIds.filter((id) => typeof id === 'string' && id.length > 0)
    : null;

  let rows: { perfume_json: string; created_at: number }[];
  if (specificIds && specificIds.length > 0) {
    const placeholders = specificIds.map(() => '?').join(',');
    const result = await env.DB.prepare(
      `SELECT perfume_json, created_at FROM collection_items WHERE user_id = ? AND id IN (${placeholders}) ORDER BY created_at DESC`
    ).bind(userId, ...specificIds).all<{ perfume_json: string; created_at: number }>();
    rows = result.results ?? [];
  } else {
    const result = await env.DB.prepare(
      'SELECT perfume_json, created_at FROM collection_items WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all<{ perfume_json: string; created_at: number }>();
    rows = result.results ?? [];
  }

  if (rows.length === 0) {
    return jsonResponse({ error: 'No items to export' }, 400);
  }

  const CSV_HEADERS = [
    'Photo', 'Name', 'Brand', 'Fragrance Family', 'Concentration',
    'Reference Price', 'Rating', 'Gender', 'Year Launched',
    'Top Notes', 'Heart Notes', 'Base Notes',
    'Longevity', 'Sillage', 'Occasions', 'Seasons', 'Description',
  ];

  const csvRows = [CSV_HEADERS.join(',')];
  for (const row of rows) {
    let p: Record<string, unknown> = {};
    try { p = JSON.parse(row.perfume_json); } catch { continue; }

    csvRows.push([
      escCsv(p.imageUri || ''),
      escCsv(p.name || ''),
      escCsv(p.brand || ''),
      escCsv(p.fragranceFamily || ''),
      escCsv(p.concentration || ''),
      escCsv(p.priceRange || ''),
      escCsv(p.rating || ''),
      escCsv(p.gender || ''),
      escCsv(p.yearLaunched || ''),
      escCsv(Array.isArray(p.topNotes) ? (p.topNotes as string[]).join(', ') : ''),
      escCsv(Array.isArray(p.heartNotes) ? (p.heartNotes as string[]).join(', ') : ''),
      escCsv(Array.isArray(p.baseNotes) ? (p.baseNotes as string[]).join(', ') : ''),
      escCsv(p.longevity || ''),
      escCsv(p.sillage || ''),
      escCsv(Array.isArray(p.occasions) ? (p.occasions as string[]).join(', ') : ''),
      escCsv(Array.isArray(p.seasons) ? (p.seasons as string[]).join(', ') : ''),
      escCsv(p.description || ''),
    ].join(','));
  }

  const csvContent = csvRows.join('\n');
  const now = new Date();
  const dateStr = now.toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' UTC';
  const fileDateStr = now.toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const fileName = `PerfumeSnap-Collection-${rows.length}items-${fileDateStr}.csv`;

  if (!env.RESEND_API_KEY) {
    return jsonResponse({ error: 'Email service not configured' }, 503);
  }

  const htmlBody = `
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; color: #2a1f0e;">
  <div style="background: linear-gradient(135deg, #f5ead4, #e8dcc4); padding: 32px 24px; border-radius: 12px;">
    <h2 style="margin: 0 0 20px; color: #2a1f0e; font-size: 22px;">Your Collection Export</h2>
    <p style="line-height: 1.6; margin: 0 0 16px;">Dear user,</p>
    <p style="line-height: 1.6; margin: 0 0 16px;">
      We're happy to let you know that your request on <strong>${dateStr}</strong> to export your perfume collection has been successfully processed.
      We've attached a CSV file containing the details of <strong>${rows.length} item${rows.length !== 1 ? 's' : ''}</strong> in your collection.
    </p>
    <p style="line-height: 1.6; margin: 0 0 16px; font-style: italic; color: #5c4f3f;">
      Please note that the "reference price" shown is an estimate based on recent market trends and should not be considered a formal appraisal.
    </p>
    <p style="line-height: 1.6; margin: 0 0 16px;">
      Please keep this file as a record of your collection. If you have any questions or need further assistance, reply to this email or contact our support team.
    </p>
    <p style="line-height: 1.6; margin: 0 0 16px;">
      Thank you for using PerfumeSnap. We look forward to continuing to support your fragrance journey!
    </p>
    <p style="line-height: 1.6; margin: 0 0 4px;">Happy collecting,</p>
    <p style="line-height: 1.6; margin: 0; font-weight: 700; color: #c8943c;">The PerfumeSnap Team</p>
  </div>
</div>`;

  const textBody = `Dear user,

We're happy to let you know that your request on ${dateStr} to export your perfume collection has been successfully processed. We've attached a CSV file containing the details of ${rows.length} item${rows.length !== 1 ? 's' : ''} in your collection.

Please note that the "reference price" shown is an estimate based on recent market trends and should not be considered a formal appraisal.

Please keep this file as a record of your collection. If you have any questions or need further assistance, reply to this email or contact our support team.

Thank you for using PerfumeSnap. We look forward to continuing to support your fragrance journey!

Happy collecting,
The PerfumeSnap Team`;

  const csvBase64 = btoa(unescape(encodeURIComponent(csvContent)));

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PerfumeSnap <noreply@perfumesnap.app>',
        to: [email],
        subject: `Your PerfumeSnap Collection Export (${rows.length} items)`,
        html: htmlBody,
        text: textBody,
        attachments: [
          {
            filename: fileName,
            content: csvBase64,
          },
        ],
      }),
    });

    if (!resendRes.ok) {
      const errData = await resendRes.text();
      console.error('Resend API error:', resendRes.status, errData);
      return jsonResponse({ error: 'Failed to send email' }, 502);
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    console.error('Export email error:', e);
    return jsonResponse({ error: 'Failed to send email' }, 500);
  }
}

// ----------------------------- Admin ---------------------------------

function checkAdmin(request: Request, env: Env): Response | null {
  const key = env.ADMIN_KEY;
  if (!key) return jsonResponse({ error: 'Admin not configured' }, 503);

  const url = new URL(request.url);
  const provided = url.searchParams.get('key') || request.headers.get('X-Admin-Key');
  if (provided !== key) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  return null;
}

async function handleAdmin(request: Request, url: URL, env: Env): Promise<Response> {
  // The dashboard page itself — serves HTML, key checked inside the page via JS
  if (url.pathname === '/admin' && request.method === 'GET') {
    const authErr = checkAdmin(request, env);
    if (authErr) return authErr;
    return new Response(ADMIN_HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS },
    });
  }

  // ---- API routes (all require key) ----
  const authErr = checkAdmin(request, env);
  if (authErr) return authErr;

  if (url.pathname === '/admin/feedback' && request.method === 'GET') {
    return await handleAdminFeedback(url, env);
  }

  if (url.pathname === '/admin/feedback/stats' && request.method === 'GET') {
    return await handleAdminFeedbackStats(env);
  }

  if (url.pathname === '/admin/images' && request.method === 'GET') {
    return await handleAdminImages(url, env, request);
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

async function handleAdminFeedback(url: URL, env: Env): Promise<Response> {
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
  const offset = Number(url.searchParams.get('offset')) || 0;

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      perfume_name TEXT NOT NULL,
      perfume_brand TEXT NOT NULL,
      satisfied INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `).run();

  const rows = await env.DB.prepare(
    'SELECT id, user_id, perfume_name, perfume_brand, satisfied, created_at FROM feedback ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all();

  return jsonResponse({ items: rows.results, count: rows.results.length });
}

async function handleAdminFeedbackStats(env: Env): Promise<Response> {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      perfume_name TEXT NOT NULL,
      perfume_brand TEXT NOT NULL,
      satisfied INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `).run();

  const total = await env.DB.prepare('SELECT COUNT(*) as c FROM feedback').first<{ c: number }>();
  const yes = await env.DB.prepare('SELECT COUNT(*) as c FROM feedback WHERE satisfied = 1').first<{ c: number }>();
  const no = await env.DB.prepare('SELECT COUNT(*) as c FROM feedback WHERE satisfied = 0').first<{ c: number }>();

  const topPerfumes = await env.DB.prepare(`
    SELECT perfume_brand, perfume_name,
           COUNT(*) as total,
           SUM(CASE WHEN satisfied = 1 THEN 1 ELSE 0 END) as positive,
           SUM(CASE WHEN satisfied = 0 THEN 1 ELSE 0 END) as negative
    FROM feedback
    GROUP BY perfume_brand, perfume_name
    ORDER BY total DESC
    LIMIT 20
  `).all();

  return jsonResponse({
    total: total?.c ?? 0,
    positive: yes?.c ?? 0,
    negative: no?.c ?? 0,
    byPerfume: topPerfumes.results,
  });
}

async function handleAdminImages(url: URL, env: Env, request: Request): Promise<Response> {
  const cursor = url.searchParams.get('cursor') || undefined;
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);

  const listed = await env.IMAGES.list({ limit, cursor });

  const items = listed.objects.map((obj) => ({
    key: obj.key,
    size: obj.size,
    uploaded: obj.uploaded.toISOString(),
    url: publicImageUrl(request, obj.key),
    contentType: obj.httpMetadata?.contentType || null,
  }));

  return jsonResponse({
    items,
    cursor: listed.truncated ? listed.cursor : null,
    truncated: listed.truncated,
  });
}

// ----------------------------- Admin Dashboard HTML --------------------

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PerfumeSnap Admin</title>
<style>
  :root { --bg: #0f0d0a; --card: #1a1710; --border: #2a2418; --gold: #c8943c; --gold-dim: #8a6e30; --text: #f5ead4; --text2: #a89878; --green: #5a9a5a; --red: #c44; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
  .header { padding: 24px 32px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 16px; }
  .header h1 { font-size: 20px; font-weight: 700; color: var(--gold); }
  .header .badge { font-size: 11px; background: var(--gold-dim); color: var(--text); padding: 3px 10px; border-radius: 99px; font-weight: 600; }
  .tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); padding: 0 32px; }
  .tab { padding: 14px 24px; font-size: 14px; font-weight: 600; color: var(--text2); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
  .tab:hover { color: var(--text); }
  .tab.active { color: var(--gold); border-bottom-color: var(--gold); }
  .content { padding: 32px; max-width: 1200px; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
  .stat-card .label { font-size: 12px; color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .stat-card .value { font-size: 32px; font-weight: 800; color: var(--gold); }
  .stat-card .sub { font-size: 13px; color: var(--text2); margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text2); border-bottom: 1px solid var(--border); }
  td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid var(--border); }
  tr:hover td { background: rgba(200,148,60,0.04); }
  .badge-yes { color: var(--green); font-weight: 600; }
  .badge-no { color: var(--red); font-weight: 600; }
  .img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
  .img-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; cursor: pointer; transition: border-color 0.2s; }
  .img-card:hover { border-color: var(--gold-dim); }
  .img-card img { width: 100%; aspect-ratio: 1; object-fit: cover; background: #111; }
  .img-card .img-info { padding: 10px 12px; }
  .img-card .img-key { font-size: 11px; color: var(--text2); word-break: break-all; }
  .img-card .img-date { font-size: 10px; color: var(--text2); margin-top: 4px; }
  .load-more { display: block; margin: 24px auto; padding: 12px 32px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; color: var(--gold); font-weight: 600; cursor: pointer; font-size: 14px; }
  .load-more:hover { border-color: var(--gold-dim); }
  .empty { text-align: center; padding: 60px 20px; color: var(--text2); font-size: 15px; }
  .section-title { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 16px; }
  .copy-toast { position: fixed; bottom: 24px; right: 24px; background: var(--gold); color: #000; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
  .copy-toast.show { opacity: 1; }
</style>
</head>
<body>
<div class="header">
  <h1>PerfumeSnap</h1>
  <span class="badge">Admin</span>
</div>
<div class="tabs">
  <div class="tab active" data-tab="feedback">Feedback</div>
  <div class="tab" data-tab="images">Images</div>
</div>
<div class="content" id="content"></div>
<div class="copy-toast" id="toast">Copied!</div>

<script>
const BASE = location.origin;
const KEY = new URLSearchParams(location.search).get('key') || '';
const api = (path) => fetch(BASE + path + (path.includes('?') ? '&' : '?') + 'key=' + KEY).then(r => r.json());

let currentTab = 'feedback';
let imageCursor = null;

document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    currentTab = t.dataset.tab;
    imageCursor = null;
    load();
  });
});

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000) return 'just now';
  if (d < 3600000) return Math.floor(d/60000) + 'm ago';
  if (d < 86400000) return Math.floor(d/3600000) + 'h ago';
  return Math.floor(d/86400000) + 'd ago';
}

async function loadFeedback() {
  const [stats, list] = await Promise.all([api('/admin/feedback/stats'), api('/admin/feedback?limit=100')]);
  const pct = stats.total > 0 ? Math.round(stats.positive / stats.total * 100) : 0;

  let html = '<div class="stats-grid">';
  html += '<div class="stat-card"><div class="label">Total Responses</div><div class="value">' + stats.total + '</div></div>';
  html += '<div class="stat-card"><div class="label">Satisfied</div><div class="value badge-yes">' + stats.positive + '</div><div class="sub">' + pct + '% positive</div></div>';
  html += '<div class="stat-card"><div class="label">Unsatisfied</div><div class="value badge-no">' + stats.negative + '</div></div>';
  html += '</div>';

  if (stats.byPerfume && stats.byPerfume.length > 0) {
    html += '<div class="section-title">By Perfume</div>';
    html += '<table><tr><th>Perfume</th><th>Total</th><th>Positive</th><th>Negative</th></tr>';
    stats.byPerfume.forEach(p => {
      html += '<tr><td>' + p.perfume_brand + ' ' + p.perfume_name + '</td><td>' + p.total + '</td><td class="badge-yes">' + p.positive + '</td><td class="badge-no">' + p.negative + '</td></tr>';
    });
    html += '</table><br><br>';
  }

  html += '<div class="section-title">Recent Feedback</div>';
  if (!list.items || list.items.length === 0) {
    html += '<div class="empty">No feedback yet</div>';
  } else {
    html += '<table><tr><th>Time</th><th>Perfume</th><th>Result</th></tr>';
    list.items.forEach(f => {
      html += '<tr><td>' + timeAgo(f.created_at) + '</td><td>' + f.perfume_brand + ' ' + f.perfume_name + '</td><td class="' + (f.satisfied ? 'badge-yes' : 'badge-no') + '">' + (f.satisfied ? 'Satisfied' : 'Unsatisfied') + '</td></tr>';
    });
    html += '</table>';
  }
  document.getElementById('content').innerHTML = html;
}

async function loadImages(append) {
  const params = 'limit=50' + (imageCursor ? '&cursor=' + encodeURIComponent(imageCursor) : '');
  const data = await api('/admin/images?' + params);

  let html = append ? document.getElementById('content').innerHTML.replace(/<button class="load-more".*?<\\/button>/, '') : '';

  if (!append) {
    html += '<div class="section-title">R2 Images (' + (data.items?.length || 0) + (data.truncated ? '+' : '') + ')</div>';
  }

  if (!data.items || data.items.length === 0) {
    html += '<div class="empty">No images found</div>';
  } else {
    if (!append) html += '<div class="img-grid" id="img-grid">';
    const cards = data.items.map(img => {
      const isImage = (img.contentType || '').startsWith('image/');
      return '<div class="img-card" onclick="copyUrl(\\'' + img.url.replace(/'/g, "\\\\'") + '\\')">'
        + (isImage ? '<img src="' + img.url + '" loading="lazy" alt="">' : '<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:#111;color:#555;font-size:12px;">No preview</div>')
        + '<div class="img-info"><div class="img-key">' + img.key + '</div><div class="img-date">' + new Date(img.uploaded).toLocaleDateString() + ' &middot; ' + (img.size/1024).toFixed(0) + ' KB</div></div></div>';
    }).join('');

    if (append) {
      html = html.replace(/<\\/div>\\s*$/, cards + '</div>');
    } else {
      html += cards + '</div>';
    }
  }

  imageCursor = data.cursor;
  if (data.truncated && data.cursor) {
    html += '<button class="load-more" onclick="loadImages(true)">Load More</button>';
  }

  document.getElementById('content').innerHTML = html;
}

function copyUrl(url) {
  navigator.clipboard.writeText(url).then(() => showToast('Image URL copied!'));
}

function load() {
  if (currentTab === 'feedback') loadFeedback();
  else loadImages(false);
}

load();
</script>
</body>
</html>`;

