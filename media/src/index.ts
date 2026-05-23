interface Env {
  IMAGES: R2Bucket;
}

const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const KEY_PATTERN = /^[0-9a-z-]+\/[0-9a-z._-]+\.[a-z0-9]+$/i;

function isValidKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

function extractKey(pathname: string): string | null {
  const trimmed = pathname.replace(/\/+$/, '');
  if (trimmed === '/health') return null;

  if (trimmed.startsWith('/image/')) {
    return decodeURIComponent(trimmed.slice('/image/'.length));
  }

  if (trimmed.startsWith('/')) {
    return decodeURIComponent(trimmed.slice(1));
  }

  return null;
}

async function serveFromR2(key: string, env: Env): Promise<Response> {
  if (!isValidKey(key)) {
    return new Response('Invalid image key', { status: 400 });
  }

  const obj = await env.IMAGES.get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', CACHE_CONTROL);
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(obj.body, { headers });
}

async function handleGet(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'ok', service: 'perfumesnap-media' }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const key = extractKey(url.pathname);
  if (!key) return new Response('Not found', { status: 404 });

  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await serveFromR2(key, env);
  if (response.ok) {
    await cache.put(request, response.clone());
  }

  return response;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (request.method === 'HEAD') {
      const getResponse = await handleGet(new Request(request.url, { method: 'GET', headers: request.headers }), env);
      return new Response(null, {
        status: getResponse.status,
        statusText: getResponse.statusText,
        headers: getResponse.headers,
      });
    }

    return handleGet(request, env);
  },
} satisfies ExportedHandler<Env>;
