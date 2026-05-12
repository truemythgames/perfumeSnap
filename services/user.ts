import * as SecureStore from 'expo-secure-store';

const USER_ID_KEY = 'perfumesnap_user_id';

let cachedUserId: string | null = null;

function generateUuid(): string {
  // RFC4122-ish v4 UUID. Crypto-grade randomness is not required here.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns a stable anonymous user id stored in the iOS Keychain via SecureStore.
 * The Keychain entry survives app uninstall/reinstall, so the same id is reused
 * and the backend can hand back the user's collection without any login.
 */
export async function getOrCreateUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  try {
    const existing = await SecureStore.getItemAsync(USER_ID_KEY);
    if (existing) {
      cachedUserId = existing;
      return existing;
    }
  } catch (err) {
    console.warn('[PerfumeSnap] SecureStore read failed:', err);
  }

  const fresh = generateUuid();
  try {
    await SecureStore.setItemAsync(USER_ID_KEY, fresh, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  } catch (err) {
    console.warn('[PerfumeSnap] SecureStore write failed:', err);
  }
  cachedUserId = fresh;
  return fresh;
}
