interface Env {
  OPENAI_API_KEY: string;
  DB: D1Database;
  IMAGES: R2Bucket;
}

const SYSTEM_PROMPT = `You are PerfumeSnap, the world's best AI perfume identifier. You ALWAYS identify the perfume shown — even from partial labels, blurry images, side angles, or just the bottle silhouette. You have encyclopedic knowledge of every perfume ever made.

CRITICAL RULES:
- ALWAYS set "identified" to true. NEVER set it to false. No exceptions.
- You MUST always return a complete, filled-out response no matter what is in the image.
- If the image shows a perfume: identify it using every visual clue (bottle shape, cap, color, label fragments, box pattern, spray nozzle). Give your best guess even if uncertain.
- If the label is partially visible, infer the full name from what you can read.
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
  "priceRange": "e.g. $80-$120 for 50ml",
  "rating": 4.5,
  "longevity": "e.g. Long-lasting (8-10 hours)",
  "sillage": "e.g. Moderate, Strong, Intimate",
  "occasions": ["occasion1", "occasion2"],
  "seasons": ["season1", "season2"],
  "similarPerfumes": [
    { "name": "Perfume Name", "brand": "Brand", "estimatedPrice": "$80-$120" },
    { "name": "Perfume Name 2", "brand": "Brand", "estimatedPrice": "$60-$90" },
    { "name": "Perfume Name 3", "brand": "Brand", "estimatedPrice": "$50-$80" }
  ]
}

Remember: you NEVER fail. You NEVER return "Unknown" or "identified: false". You always give a complete, confident answer. If it's a perfume, identify it. If it's not a perfume, have fun with it and give the user interesting information about whatever they photographed.`;

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
      max_tokens: 1000,
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

  let body: { perfume?: unknown; imageUri?: string; imageKey?: string };
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

  const perfumeJson = JSON.stringify({
    ...(body.perfume as object),
    imageUri: imageUrl,
    imageKey: body.imageKey ?? null,
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
