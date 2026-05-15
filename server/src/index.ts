interface Env {
  OPENAI_API_KEY: string;
  DB: D1Database;
  IMAGES: R2Bucket;
  SERPAPI_KEY?: string;
  PRICES_API_KEY?: string;
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
  // basic key validation: must look like "<uuid>/<uuid>.<ext>"
  if (!/^[0-9a-f-]+\/[0-9a-f-]+\.[a-z0-9]+$/i.test(key)) {
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
