import { Linking, Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';

export const APP_STORE_ID = '6770087818';

export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
export const APP_STORE_REVIEW_URL = `${APP_STORE_URL}?action=write-review`;

/** True when SKStoreReviewController can show (false on TestFlight). */
export async function isNativeReviewAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await StoreReview.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Best-effort native popup. Apple may still suppress it; never blocks UI. */
export async function requestNativeAppReview(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    if (!(await StoreReview.isAvailableAsync())) return;
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
  } catch {
    // Apple throttles or refuses — expected in TestFlight and after prior prompts.
  }
}

/** Opens App Store / Play Store review page — works in TestFlight and production. */
export async function openAppStoreReviewPage(): Promise<void> {
  const url = Platform.OS === 'ios'
    ? APP_STORE_REVIEW_URL
    : 'https://play.google.com/store/apps/details?id=app.perfumeSnap';
  await Linking.openURL(url);
}
