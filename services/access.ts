import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { isPremiumUser } from './subscription';
import { getOrCreateUserId } from './user';

const FREE_DAILY_SCAN_LIMIT = 3;
const FREE_COLLECTION_LIMIT = 10;
const SCAN_DAY_KEY = 'perfumesnap_scan_day';
const SCAN_COUNT_KEY = 'perfumesnap_scan_count';

type ScanAllowance = {
  allowed: boolean;
  isPremium: boolean;
  remainingToday: number;
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getTodayScanCount(): Promise<number> {
  const today = todayKey();
  const storedDay = await SecureStore.getItemAsync(SCAN_DAY_KEY);
  if (storedDay !== today) {
    await SecureStore.setItemAsync(SCAN_DAY_KEY, today);
    await SecureStore.setItemAsync(SCAN_COUNT_KEY, '0');
    return 0;
  }
  const rawCount = await SecureStore.getItemAsync(SCAN_COUNT_KEY);
  const parsed = Number(rawCount || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getScanAllowance(): Promise<ScanAllowance> {
  const premium = await getPremiumStatus();
  if (premium) {
    return { allowed: true, isPremium: true, remainingToday: Number.MAX_SAFE_INTEGER };
  }
  return { allowed: false, isPremium: false, remainingToday: 0 };
}

/** Opens the paywall and returns false when the user has no premium access. */
export async function requirePremium(): Promise<boolean> {
  const premium = await getPremiumStatus();
  if (!premium) {
    router.push('/sales');
    return false;
  }
  return true;
}

export async function consumeScanIfNeeded(): Promise<void> {
  const userId = await getOrCreateUserId();
  const premium = await isPremiumUser(userId);
  if (premium) return;

  const count = await getTodayScanCount();
  await SecureStore.setItemAsync(SCAN_COUNT_KEY, String(count + 1));
}

export async function getPremiumStatus(): Promise<boolean> {
  const userId = await getOrCreateUserId();
  return isPremiumUser(userId);
}

export async function canAddToCollection(): Promise<{ allowed: boolean; isPremium: boolean; limit: number }> {
  const premium = await getPremiumStatus();
  return { allowed: premium, isPremium: premium, limit: FREE_COLLECTION_LIMIT };
}

export const FREE_LIMITS = {
  dailyScans: FREE_DAILY_SCAN_LIMIT,
  collection: FREE_COLLECTION_LIMIT,
};
