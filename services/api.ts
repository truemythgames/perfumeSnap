import { getOrCreateUserId } from './user';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787';

export interface SimilarPerfume {
  name: string;
  brand: string;
  estimatedPrice: string;
}

export interface PerfumeResult {
  identified: boolean;
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
  rating: number;
  longevity: string;
  sillage: string;
  occasions: string[];
  seasons: string[];
  similarPerfumes: SimilarPerfume[] | string[];
}

export function buildShoppingUrl(perfumeName: string, brand: string, retailer: 'amazon' | 'ebay' | 'google'): string {
  const query = encodeURIComponent(`${brand} ${perfumeName} perfume`);
  switch (retailer) {
    case 'amazon':
      return `https://www.amazon.com/s?k=${query}`;
    case 'ebay':
      return `https://www.ebay.com/sch/i.html?_nkw=${query}`;
    case 'google':
      return `https://www.google.com/search?tbm=shop&q=${query}`;
  }
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

async function callIdentify(base64Image: string, signal: AbortSignal): Promise<PerfumeResult> {
  const userId = await getOrCreateUserId();
  const response = await fetch(`${API_URL}/identify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    body: JSON.stringify({ image: base64Image }),
    signal,
  });

  console.log('[PerfumeSnap] Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null) as any;
    throw new Error(errorData?.error || `Server error (${response.status})`);
  }

  return response.json();
}

export async function identifyPerfume(base64Image: string): Promise<PerfumeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    console.log('[PerfumeSnap] Sending request to:', `${API_URL}/identify`);
    console.log('[PerfumeSnap] Image size:', Math.round(base64Image.length / 1024), 'KB');

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await callIdentify(base64Image, controller.signal);
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

export interface CollectionItem {
  id: string;
  createdAt: number;
  perfume: PerfumeResult & { imageUri?: string | null; imageKey?: string | null };
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
  opts: { imageKey?: string; imageUri?: string } = {},
): Promise<{ id: string; createdAt: number; imageUri: string | null }> {
  const userId = await getOrCreateUserId();
  const res = await fetch(`${API_URL}/collection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    body: JSON.stringify({
      perfume,
      imageKey: opts.imageKey,
      imageUri: opts.imageUri,
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
