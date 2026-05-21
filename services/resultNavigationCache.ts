import type { PerfumeResult, SimilarPerfume } from './api';
import { filterValidSimilarListings } from './listingUrls';

export type ResultPrefillPayload = PerfumeResult & {
  imageUri?: string | null;
  imageKey?: string | null;
  cachedSimilarListings?: SimilarPerfume[];
};

const cache = new Map<string, ResultPrefillPayload>();

export function setResultPrefill(key: string, payload: ResultPrefillPayload): void {
  const cachedSimilarListings = payload.cachedSimilarListings
    ? filterValidSimilarListings(payload.cachedSimilarListings)
    : undefined;
  cache.set(key, {
    ...payload,
    cachedSimilarListings,
  });
}

export function getResultPrefill(key: string): ResultPrefillPayload | null {
  return cache.get(key) ?? null;
}

export function clearResultPrefillCache(): void {
  cache.clear();
}

export function collectionPrefillKey(id: string): string {
  return `col:${id}`;
}

export function historyPrefillKey(id: string): string {
  return `hist:${id}`;
}

/** Pre-warm cache when list loads so taps only need router.push. */
export function syncCollectionPrefillCache(
  items: Array<{ id: string; perfume: ResultPrefillPayload }>,
): void {
  for (const item of items) {
    const cachedSimilarListings = item.perfume.cachedSimilarListings
      ? filterValidSimilarListings(item.perfume.cachedSimilarListings)
      : undefined;
    cache.set(collectionPrefillKey(item.id), {
      ...item.perfume,
      imageUri: item.perfume.imageUri ?? null,
      imageKey: item.perfume.imageKey ?? null,
      cachedSimilarListings,
    });
  }
}

export function syncHistoryPrefillCache(
  items: Array<{ id: string; perfume: ResultPrefillPayload; imageUri?: string | null }>,
): void {
  for (const item of items) {
    cache.set(historyPrefillKey(item.id), {
      ...item.perfume,
      imageUri: item.imageUri ?? item.perfume.imageUri ?? null,
    });
  }
}
