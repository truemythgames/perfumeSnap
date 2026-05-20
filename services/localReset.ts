import * as SecureStore from 'expo-secure-store';
import { resetPaywallDismissal } from './paywall';
import { clearResultPrefillCache } from './resultNavigationCache';
import { clearUserIdCache } from './user';

export const ONBOARDING_KEY = 'perfumesnap_onboarding_done';

const LOCAL_KEYS = [
  'perfumesnap_user_id',
  ONBOARDING_KEY,
  'perfumesnap_scan_coachmark_done',
  'perfumesnap_scan_day',
  'perfumesnap_scan_count',
  'perfumesnap_preferred_currency',
] as const;

type ResetListener = () => void;
const listeners = new Set<ResetListener>();

export function subscribeToLocalAccountReset(listener: ResetListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Wipe on-device identity and UX flags after account deletion. */
export async function clearAllLocalUserData(): Promise<void> {
  clearUserIdCache();
  clearResultPrefillCache();
  resetPaywallDismissal();

  await Promise.all(
    LOCAL_KEYS.map((key) =>
      SecureStore.deleteItemAsync(key).catch(() => {}),
    ),
  );

  listeners.forEach((listener) => listener());
}
