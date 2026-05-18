import { PerfumeResult, getApiUrl } from './api';
import { getOrCreateUserId } from './user';

export interface HistoryItem {
  id: string;
  scannedAt: number;
  perfume: PerfumeResult;
  imageUri?: string | null;
}

const API_URL = getApiUrl();

export async function addToHistory(
  perfume: PerfumeResult,
  imageUri?: string | null,
): Promise<void> {
  if (!perfume.identified) return;
  const userId = await getOrCreateUserId();
  await fetch(`${API_URL}/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    body: JSON.stringify({ perfume, imageUri: imageUri || null }),
  });
}

export async function getHistory(): Promise<HistoryItem[]> {
  const userId = await getOrCreateUserId();
  const res = await fetch(`${API_URL}/history`, {
    method: 'GET',
    headers: { 'X-User-Id': userId },
  });
  if (!res.ok) return [];
  const data = await res.json() as { items: HistoryItem[] };
  return data.items || [];
}

export async function clearHistory(): Promise<void> {
  const userId = await getOrCreateUserId();
  await fetch(`${API_URL}/history`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId },
  });
}
