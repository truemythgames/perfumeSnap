import { Platform } from 'react-native';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

/**
 * Initialize the Facebook SDK and request ATT permission on iOS.
 * Call once at app startup (e.g. root layout useEffect).
 */
export async function initFacebookSDK() {
  try {
    if (Platform.OS === 'ios') {
      const { status } = await requestTrackingPermissionsAsync();
      Settings.initializeSDK();
      if (status === 'granted') {
        await Settings.setAdvertiserTrackingEnabled(true);
      }
    } else {
      Settings.initializeSDK();
    }
  } catch (e) {
    console.warn('Facebook SDK init failed:', e);
  }
}

// ---------------------------------------------------------------------------
// Event helpers – thin wrappers so callers stay decoupled from FB types
// ---------------------------------------------------------------------------

export function trackEvent(name: string, params?: Record<string, string | number>) {
  try {
    if (params) {
      AppEventsLogger.logEvent(name, params);
    } else {
      AppEventsLogger.logEvent(name);
    }
    AppEventsLogger.flush();
  } catch (error) {
    // Surface FB SDK issues during development instead of silently swallowing them.
    if (__DEV__) {
      console.warn('[FB Events] Failed to log event:', name, params, error);
    }
  }
}

export function trackScreenView(screen: string) {
  trackEvent('screen_view', { screen_name: screen });
}

export function trackPhotoTaken() {
  trackEvent('photo_taken', { source: 'camera' });
}

export function trackGalleryPick() {
  trackEvent('photo_taken', { source: 'gallery' });
}

export function trackIdentifyStarted() {
  trackEvent('identify_started');
}

export function trackIdentifySuccess(name: string, brand: string) {
  trackEvent('identify_success', { perfume_name: name, perfume_brand: brand });
}

export function trackIdentifyFailed(reason: string) {
  trackEvent('identify_failed', { reason });
}

export function trackLookupStarted(name: string) {
  trackEvent('lookup_started', { perfume_name: name });
}

export function trackLookupSuccess(name: string, brand: string) {
  trackEvent('lookup_success', { perfume_name: name, perfume_brand: brand });
}

export function trackRetailerTap(retailer: string, perfumeName: string) {
  trackEvent('retailer_tap', { retailer, perfume_name: perfumeName });
}

export function trackSaveToCollection(name: string, brand: string) {
  trackEvent('save_to_collection', { perfume_name: name, perfume_brand: brand });
}

export function trackDeleteFromCollection(count: number) {
  trackEvent('delete_from_collection', { count });
}

export function trackViewSimilar(name: string) {
  trackEvent('view_similar', { perfume_name: name });
}

export function trackChatOpened(name: string) {
  trackEvent('chat_opened', { perfume_name: name });
}

export function trackChatMessageSent() {
  trackEvent('chat_message_sent');
}

export function trackCameraOpened() {
  trackEvent('camera_opened');
}

export function trackTabSwitch(tab: string) {
  trackEvent('tab_switch', { tab });
}
