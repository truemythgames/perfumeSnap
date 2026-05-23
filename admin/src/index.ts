import { ADMIN_HTML } from './adminHtml';

interface Env {
  ADMIN_USER: string;
  ADMIN_PASS: string;
  DB: D1Database;
  IMAGES: R2Bucket;
  MEDIA_BASE_URL?: string;
}

function unauthorized(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="PerfumeSnap Admin"' },
  });
}

function checkBasicAuth(request: Request, env: Env): boolean {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  const decoded = atob(header.slice(6));
  const [user, pass] = [decoded.slice(0, decoded.indexOf(':')), decoded.slice(decoded.indexOf(':') + 1)];
  return user === env.ADMIN_USER && pass === env.ADMIN_PASS;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function publicImageUrl(request: Request, env: Env, key: string): string {
  const base = env.MEDIA_BASE_URL?.replace(/\/$/, '') || new URL(request.url).origin;
  return `${base}/${key}`;
}

async function ensureFeedbackTable(env: Env): Promise<void> {
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
  try { await env.DB.prepare('ALTER TABLE feedback ADD COLUMN category TEXT').run(); } catch { /* exists */ }
  try { await env.DB.prepare('ALTER TABLE feedback ADD COLUMN message TEXT').run(); } catch { /* exists */ }
}

async function handleFeedback(url: URL, env: Env): Promise<Response> {
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
  const offset = Number(url.searchParams.get('offset')) || 0;
  const category = url.searchParams.get('category')?.trim() || '';

  await ensureFeedbackTable(env);

  const totalRow = category
    ? await env.DB.prepare('SELECT COUNT(*) as c FROM feedback WHERE category = ?').bind(category).first<{ c: number }>()
    : await env.DB.prepare('SELECT COUNT(*) as c FROM feedback').first<{ c: number }>();

  const rows = category
    ? await env.DB.prepare(
        'SELECT id, user_id, perfume_name, perfume_brand, satisfied, category, message, created_at FROM feedback WHERE category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(category, limit, offset).all()
    : await env.DB.prepare(
        'SELECT id, user_id, perfume_name, perfume_brand, satisfied, category, message, created_at FROM feedback ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(limit, offset).all();

  return jsonResponse({
    items: rows.results,
    count: rows.results?.length ?? 0,
    total: totalRow?.c ?? 0,
    offset,
    limit,
  });
}

async function handleFeedbackStats(env: Env): Promise<Response> {
  await ensureFeedbackTable(env);

  const total = await env.DB.prepare('SELECT COUNT(*) as c FROM feedback').first<{ c: number }>();

  const byCategory = await env.DB.prepare(`
    SELECT COALESCE(NULLIF(category, ''), CASE WHEN satisfied = 1 THEN 'like' ELSE 'incorrect' END) as category,
           COUNT(*) as count
    FROM feedback GROUP BY 1 ORDER BY count DESC
  `).all();

  const topPerfumes = await env.DB.prepare(`
    SELECT perfume_brand, perfume_name, COUNT(*) as total
    FROM feedback GROUP BY perfume_brand, perfume_name ORDER BY total DESC LIMIT 20
  `).all();

  return jsonResponse({
    total: total?.c ?? 0,
    byCategory: byCategory.results,
    byPerfume: topPerfumes.results,
  });
}

async function handleImages(url: URL, env: Env, request: Request): Promise<Response> {
  const cursor = url.searchParams.get('cursor') || undefined;
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);

  const listed = await env.IMAGES.list({ limit: limit + 50, cursor });

  const filtered = listed.objects.filter((obj) => !obj.key.startsWith('articles/'));
  const sliced = filtered.slice(0, limit);

  const keys = sliced.map((o) => o.key);
  const perfumeNames: Record<string, string> = {};
  if (keys.length > 0) {
    const placeholders = keys.map(() => '?').join(',');
    const rows = await env.DB.prepare(
      `SELECT perfume_json FROM collection_items WHERE json_extract(perfume_json, '$.imageKey') IN (${placeholders})`
    ).bind(...keys).all<{ perfume_json: string }>();
    for (const row of rows.results ?? []) {
      try {
        const p = JSON.parse(row.perfume_json);
        if (p.imageKey && p.name) perfumeNames[p.imageKey] = `${p.brand || ''} ${p.name}`.trim();
      } catch { /* skip */ }
    }
  }

  const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' };
  const items = sliced.map((obj) => {
    const ext = obj.key.split('.').pop()?.toLowerCase() || '';
    return {
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded.toISOString(),
      url: publicImageUrl(request, env, obj.key),
      contentType: obj.httpMetadata?.contentType || mimeMap[ext] || 'image/jpeg',
      perfume: perfumeNames[obj.key] || null,
    };
  });

  return jsonResponse({
    items,
    cursor: listed.truncated ? listed.cursor : null,
    truncated: listed.truncated,
  });
}

async function handleImageProxy(key: string, env: Env): Promise<Response> {
  const obj = await env.IMAGES.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!env.ADMIN_USER || !env.ADMIN_PASS) {
      return new Response('Admin credentials not configured', { status: 503 });
    }

    // Images are public (referenced by URL in the dashboard)
    const url = new URL(request.url);
    if (url.pathname.startsWith('/images/') && request.method === 'GET') {
      const key = decodeURIComponent(url.pathname.slice('/images/'.length));
      return handleImageProxy(key, env);
    }

    // Everything else requires authentication
    if (!checkBasicAuth(request, env)) return unauthorized();

    if ((url.pathname === '/' || url.pathname === '') && request.method === 'GET') {
      return new Response(ADMIN_HTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (url.pathname === '/admin/feedback' && request.method === 'GET') {
      return handleFeedback(url, env);
    }
    if (url.pathname === '/admin/feedback/stats' && request.method === 'GET') {
      return handleFeedbackStats(env);
    }
    if (url.pathname === '/admin/images' && request.method === 'GET') {
      return handleImages(url, env, request);
    }
    if (url.pathname === '/admin/images' && request.method === 'DELETE') {
      const body = await request.json<{ key?: string }>().catch(() => ({}));
      const key = (body as { key?: string }).key;
      if (!key) return jsonResponse({ error: 'Missing key' }, 400);
      await env.IMAGES.delete(key);
      return jsonResponse({ ok: true, deleted: key });
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
} satisfies ExportedHandler<Env>;
