import * as SecureStore from 'expo-secure-store';

const SCAN_COACHMARK_KEY = 'perfumesnap_scan_coachmark_done';

export async function hasSeenScanCoachmark(): Promise<boolean> {
  try {
    const v = await SecureStore.getItemAsync(SCAN_COACHMARK_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function markScanCoachmarkSeen(): Promise<void> {
  try {
    await SecureStore.setItemAsync(SCAN_COACHMARK_KEY, '1');
  } catch {
    // ignore
  }
}

export async function resetScanCoachmark(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SCAN_COACHMARK_KEY);
  } catch {
    // ignore
  }
}
