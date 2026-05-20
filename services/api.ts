import { getOrCreateUserId } from './user';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';

export interface SimilarPerfume {
  name: string;
  brand: string;
  estimatedPrice: string;
  retailer?: string;
  imageUrl?: string | null;
  productUrl?: string | null;
  condition?: string | null;
}

export async function scrapeProductImage(name: string, brand: string): Promise<string | null> {
  try {
    const q = `${brand} ${name}`.trim();
    const res = await fetch(`${API_URL}/scrape-image?q=${encodeURIComponent(q)}`);
    if (!res.ok) return null;
    const data = await res.json() as { imageUrl: string | null };
    return data.imageUrl || null;
  } catch {
    return null;
  }
}

export interface DupePerfume {
  name: string;
  brand: string;
}

export interface Accord {
  name: string;
  strength: number;
}

export interface PerfumeResult {
  identified: boolean;
  confidence?: 'high' | 'medium' | 'low';
  name: string;
  brand: string;
  fragranceFamily: string;
  gender: string;
  yearLaunched: string;
  perfumer: string;
  concentration: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  description: string;
  priceRange: string;
  sizesPricing?: { size: string; price: string }[];
  rating: number;
  longevity: string;
  longevityScore?: number;
  sillage: string;
  sillageScore?: number;
  dayNight?: 'day' | 'night' | 'versatile';
  accords?: Accord[];
  occasions: string[];
  seasons: string[];
  layeringNotes?: string[];
  dupes?: DupePerfume[];
  popularityRank?: string;
  reformulated?: string | null;
  wearerProfile?: string;
  similarPerfumes: SimilarPerfume[] | string[];
  cachedSimilarListings?: SimilarPerfume[];
}

export interface PerfumeChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function isGoogleListingUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname.toLowerCase().includes('google.');
  } catch {
    return false;
  }
}

export function buildShoppingUrl(perfumeName: string, brand: string, retailer?: string): string {
  const query = encodeURIComponent(`${brand} ${perfumeName} perfume`.trim());
  const key = (retailer || '').toLowerCase().replace(/[^a-z]/g, '');

  if (key.includes('amazon')) return `https://www.amazon.com/s?k=${query}`;
  if (key.includes('ebay')) return `https://www.ebay.com/sch/i.html?_nkw=${query}`;
  if (key.includes('sephora')) return `https://www.sephora.com/search?keyword=${query}`;
  if (key.includes('nordstrom')) return `https://www.nordstrom.com/sr?keyword=${query}`;
  if (key.includes('ulta')) return `https://www.ulta.com/ulta/a/_/Ntt-${query}`;
  if (key.includes('walmart')) return `https://www.walmart.com/search?q=${query}`;
  if (key.includes('fragrancenet')) return `https://www.fragrancenet.com/search?search=${query}`;
  if (key.includes('fragrancex')) return `https://www.fragrancex.com/search?search=${query}`;
  if (key.includes('perfumania')) return `https://www.perfumania.com/search?q=${query}`;
  if (key.includes('bloomingdale')) return `https://www.bloomingdales.com/shop/search?keyword=${query}`;
  if (key.includes('macy') || key.includes('macys')) return `https://www.macys.com/shop/search?keyword=${query}`;
  if (key.includes('neimanmarcus') || key.includes('neiman')) return `https://www.neimanmarcus.com/en-us/search?q=${query}`;
  if (key.includes('luckyscent')) return `https://www.luckyscent.com/search.asp?keyword=${query}`;
  if (key.includes('notino')) return `https://www.notino.com/search/?q=${query}`;
  if (key.includes('douglas')) return `https://www.douglas.com/search?q=${query}`;
  if (key.includes('harrods')) return `https://www.harrods.com/en-us/search?searchTerm=${query}`;
  if (key.includes('theperfumeshop') || key.includes('perfumeshop')) return `https://www.theperfumeshop.com/search?q=${query}`;
  if (key.includes('target')) return `https://www.target.com/s?searchTerm=${query}`;

  return `https://www.amazon.com/s?k=${query}`;
}

/** Prefer a direct retailer URL; never open Google Shopping. */
export function resolveListingUrl(perfume: SimilarPerfume): string {
  const direct = perfume.productUrl?.trim();
  if (direct && !isGoogleListingUrl(direct)) return direct;
  return buildShoppingUrl(perfume.name, perfume.brand, perfume.retailer);
}

export function normalizeSimilarPerfumes(raw: SimilarPerfume[] | string[]): SimilarPerfume[] {
  if (!raw || raw.length === 0) return [];
  if (typeof raw[0] === 'string') {
    return (raw as string[]).map((s) => {
      const parts = s.split(' by ');
      return {
        name: parts[0]?.trim() || s,
        brand: parts[1]?.trim() || '',
        estimatedPrice: '',
      };
    });
  }
  return raw as SimilarPerfume[];
}

export function isApiConfigured(): boolean {
  return !!process.env.EXPO_PUBLIC_API_URL;
}

export function getApiUrl(): string {
  return API_URL;
}

const MAX_RETRIES = 2;

async function callIdentify(base64Image: string, mimeType: string, signal: AbortSignal): Promise<PerfumeResult> {
  const userId = await getOrCreateUserId();
  const response = await fetch(`${API_URL}/identify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    body: JSON.stringify({ image: base64Image, mimeType }),
    signal,
  });

  console.log('[PerfumeSnap] Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null) as any;
    console.log('[PerfumeSnap] Error detail:', errorData?.detail || errorData?.snippet || 'none');
    throw new Error(errorData?.error || `Server error (${response.status})`);
  }

  return response.json();
}

export async function identifyPerfume(base64Image: string, mimeType: string = 'image/jpeg', externalSignal?: AbortSignal): Promise<PerfumeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  if (externalSignal) {
    if (externalSignal.aborted) { controller.abort(); }
    else { externalSignal.addEventListener('abort', () => controller.abort(), { once: true }); }
  }

  try {
    console.log('[PerfumeSnap] Sending request to:', `${API_URL}/identify`);
    console.log('[PerfumeSnap] Image size:', Math.round(base64Image.length / 1024), 'KB');

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await callIdentify(base64Image, mimeType, controller.signal);
        return result;
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') throw err;
        if (attempt < MAX_RETRIES && !err.message?.includes('Rate limit')) {
          console.log(`[PerfumeSnap] Attempt ${attempt + 1} failed, retrying...`);
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('Identification failed after retries.');
  } catch (error: any) {
    if (error.name === 'AbortError') {
      if (externalSignal?.aborted) throw new Error('Cancelled');
      throw new Error('Request timed out. The server took too long to respond.');
    }
    if (error.message?.includes('Network request failed')) {
      throw new Error(
        `Cannot reach the server at ${API_URL}. Make sure your phone is on the same WiFi and the API is running.`
      );
    }
    console.log('[PerfumeSnap] Error:', error.message);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function lookupPerfume(name: string, brand: string, externalSignal?: AbortSignal): Promise<PerfumeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  if (externalSignal) {
    if (externalSignal.aborted) { controller.abort(); }
    else { externalSignal.addEventListener('abort', () => controller.abort(), { once: true }); }
  }

  try {
    const res = await fetch(`${API_URL}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, brand }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null) as any;
      throw new Error(err?.error || `Lookup failed (${res.status})`);
    }

    return res.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      if (externalSignal?.aborted) throw new Error('Cancelled');
      throw new Error('Request timed out.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export type FeedbackCategory = 'like' | 'incorrect' | 'feature' | 'suggestion';

export async function submitFeedback(
  perfumeName: string,
  perfumeBrand: string,
  category: FeedbackCategory,
  message?: string,
): Promise<boolean> {
  const userId = await getOrCreateUserId();
  const name = perfumeName?.trim() || 'Unknown';
  const brand = perfumeBrand?.trim() || 'Unknown';
  const text = message?.trim() || '';
  const satisfied = category === 'like' ? true : category === 'incorrect' ? false : true;

  const post = (body: Record<string, unknown>) =>
    fetch(`${API_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify(body),
    });

  try {
    const res = await post({
      perfumeName: name,
      perfumeBrand: brand,
      category,
      message: text || undefined,
      satisfied,
    });
    if (res.ok) return true;

    // Older deployed workers require satisfied and ignore category/message.
    const legacyBrand = text ? `${brand} [${category}] ${text.slice(0, 500)}` : brand;
    const legacy = await post({
      perfumeName: name,
      perfumeBrand: legacyBrand,
      satisfied,
    });
    return legacy.ok;
  } catch {
    return false;
  }
}

export interface CollectionItem {
  id: string;
  createdAt: number;
  perfume: PerfumeResult & {
    imageUri?: string | null;
    imageKey?: string | null;
    cachedSimilarListings?: SimilarPerfume[];
  };
}

export interface CollectionPage {
  items: CollectionItem[];
  nextCursor: string | null;
}

export async function getCollection(opts?: { cursor?: string; limit?: number }): Promise<CollectionPage> {
  const userId = await getOrCreateUserId();
  const params = new URLSearchParams();
  if (opts?.cursor) params.set('cursor', opts.cursor);
  if (opts?.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  const res = await fetch(`${API_URL}/collection${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: { 'X-User-Id': userId },
  });
  if (!res.ok) throw new Error(`Failed to load collection (${res.status})`);
  return res.json();
}

/**
 * Uploads the local image to R2 via the worker and returns the storage key + public URL.
 */
export async function uploadImage(localUri: string): Promise<{ key: string; url: string }> {
  const userId = await getOrCreateUserId();
  // Fetch the local file as a blob so we can stream raw bytes to the worker.
  const fileResponse = await fetch(localUri);
  const blob = await fileResponse.blob();
  const contentType = blob.type || 'image/jpeg';

  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'X-User-Id': userId,
    },
    body: blob,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null) as any;
    throw new Error(err?.error || `Upload failed (${res.status})`);
  }
  return res.json();
}

export async function addToCollection(
  perfume: PerfumeResult,
  opts: { imageKey?: string; imageUri?: string; similarListings?: SimilarPerfume[] } = {},
): Promise<{ id: string; createdAt: number; imageUri: string | null }> {
  const userId = await getOrCreateUserId();
  const res = await fetch(`${API_URL}/collection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    body: JSON.stringify({
      perfume,
      imageKey: opts.imageKey,
      imageUri: opts.imageUri,
      similarListings: opts.similarListings,
    }),
  });
  if (!res.ok) throw new Error(`Failed to save to collection (${res.status})`);
  return res.json();
}

export async function deleteFromCollection(itemId: string): Promise<void> {
  const userId = await getOrCreateUserId();
  const res = await fetch(`${API_URL}/collection/${itemId}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId },
  });
  if (!res.ok) throw new Error(`Failed to delete (${res.status})`);
}

export async function deleteAccount(): Promise<void> {
  const userId = await getOrCreateUserId();
  const res = await fetch(`${API_URL}/account`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId },
  });
  if (!res.ok) throw new Error(`Failed to delete account (${res.status})`);
}

export async function getSimilarListings(name: string, brand: string): Promise<SimilarPerfume[]> {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
    const localeParts = locale.replace('_', '-').split('-');
    const language = (localeParts[0] || 'en').toLowerCase();
    const country = (localeParts[1] || 'US').toLowerCase();

    const q = encodeURIComponent(`${brand} ${name} perfume`.trim());
    const n = encodeURIComponent(name.trim());
    const b = encodeURIComponent(brand.trim());
    const c = encodeURIComponent(country);
    const hl = encodeURIComponent(language);
    const url = `${API_URL}/similar?q=${q}&name=${n}&brand=${b}&country=${c}&hl=${hl}`;
    console.log('[PerfumeSnap] Fetching similar:', url);
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('[PerfumeSnap] /similar failed:', res.status);
      return [];
    }
    const data = (await res.json()) as { results?: SimilarPerfume[] };
    console.log('[PerfumeSnap] Similar results:', data.results?.length ?? 0);
    return data.results || [];
  } catch (err) {
    console.error('[PerfumeSnap] getSimilarListings error:', err);
    return [];
  }
}

// ----------------------------- Articles -----------------------------

export interface ArticleSection {
  type: 'paragraph' | 'heading' | 'subheading' | 'list';
  text?: string;
  items?: string[];
}

export interface ApiArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  icon: string;
  color: string;
  readingTime: number;
  imageUrl: string | null;
  sections: ArticleSection[];
}

export async function fetchArticles(): Promise<ApiArticle[]> {
  try {
    const res = await fetch(`${API_URL}/articles?v=2`);
    if (!res.ok) return [];
    const data = await res.json() as { articles?: ApiArticle[] };
    return data.articles || [];
  } catch {
    return [];
  }
}

export async function chatAboutPerfume(
  perfume: PerfumeResult,
  question: string,
  history: PerfumeChatMessage[] = [],
): Promise<string> {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    throw new Error('Question cannot be empty.');
  }

  const payload = JSON.stringify({
    perfume,
    question: trimmedQuestion,
    history,
  });

  const endpoints = ['/chat-perfume', '/perfume-chat'];
  let lastError: string | null = null;

  for (const endpoint of endpoints) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });

    if (res.status === 404) {
      lastError = 'Not found';
      continue;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => null) as { error?: string } | null;
      throw new Error(err?.error || `Chat failed (${res.status})`);
    }

    const data = await res.json() as { answer?: string };
    if (!data.answer || typeof data.answer !== 'string') {
      throw new Error('Invalid chat response.');
    }
    return data.answer.trim();
  }

  if (lastError === 'Not found') {
    throw new Error('Chat endpoint not found. Restart or redeploy the API server.');
  }
  throw new Error('Chat failed.');
}
