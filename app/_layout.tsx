import { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, router, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/theme';
import { initCrashlytics, logError } from '../utils/crashlytics';
import { initFacebookSDK } from '../services/analytics';
import analytics from '@react-native-firebase/analytics';
import { initRevenueCat, isPremiumUser } from '../services/subscription';
import { getOrCreateUserId } from '../services/user';
import { isPaywallDismissedForSession, dismissPaywallForSession } from '../services/paywall';
import { ONBOARDING_KEY, subscribeToLocalAccountReset } from '../services/localReset';
import OnboardingFlow from '../components/OnboardingFlow';

SplashScreen.preventAutoHideAsync();

/** Native iOS edge swipe-back; fullScreenGesture off so vertical scroll is not stolen. */
const NATIVE_PUSH_SCREEN_OPTIONS = {
  animation: 'slide_from_right' as const,
  gestureEnabled: true,
  fullScreenGestureEnabled: false,
  animationMatchesGesture: true,
};

const globalErrorHandler = (error: Error, isFatal?: boolean) => {
  logError(error, isFatal ? 'Fatal JS error' : 'Non-fatal JS error');
};

const errorUtils = (global as any).ErrorUtils;
if (errorUtils) {
  const defaultHandler = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
    globalErrorHandler(error, isFatal);
    defaultHandler?.(error, isFatal);
  });
}

export default function RootLayout() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [appReady, setAppReady] = useState(false);
  const [showSalesOnMount, setShowSalesOnMount] = useState(false);
  const navRef = useNavigationContainerRef();

  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY)
      .then(async (val) => {
        const done = val === '1';
        setOnboardingDone(done);
        if (done) {
          initCrashlytics();
          initFacebookSDK();
          analytics().setAnalyticsCollectionEnabled(true);
          analytics().logEvent('app_open');

          const userId = await getOrCreateUserId();
          await initRevenueCat(userId);

          if (!isPaywallDismissedForSession()) {
            try {
              const premium = await isPremiumUser(userId);
              if (!premium) {
                dismissPaywallForSession();
                setShowSalesOnMount(true);
              }
            } catch { /* ignore */ }
          }

          setAppReady(true);
        }
      })
      .catch(() => setOnboardingDone(false))
      .finally(() => SplashScreen.hideAsync());
  }, []);

  useEffect(() => {
    return subscribeToLocalAccountReset(() => {
      setOnboardingDone(false);
      setAppReady(false);
      setShowSalesOnMount(false);
    });
  }, []);

  const finishOnboarding = async () => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, '1');

    initCrashlytics();
    initFacebookSDK();
    analytics().setAnalyticsCollectionEnabled(true);
    analytics().logEvent('app_open');

    const userId = await getOrCreateUserId();
    await initRevenueCat(userId);

    let needsSales = false;
    if (!isPaywallDismissedForSession()) {
      try {
        const premium = await isPremiumUser(userId);
        if (!premium) {
          dismissPaywallForSession();
          needsSales = true;
        }
      } catch { /* ignore */ }
    }

    setShowSalesOnMount(needsSales);
    setOnboardingDone(true);
    setAppReady(true);
  };

  useEffect(() => {
    if (!appReady || !showSalesOnMount) return;
    let cancelled = false;
    const tryPush = () => {
      if (cancelled) return;
      if (navRef.isReady()) {
        router.push('/sales');
        setTimeout(() => setShowSalesOnMount(false), 500);
      } else {
        setTimeout(tryPush, 100);
      }
    };
    setTimeout(tryPush, 50);
    return () => { cancelled = true; };
  }, [appReady, showSalesOnMount]);

  if (onboardingDone === null) return null;

  if (!onboardingDone) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <OnboardingFlow onComplete={finishOnboarding} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="camera"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="result"
          options={{
            // Scan flow uses in-screen Reanimated (frame from camera + fade). Stack slide fights it.
            animation: 'none',
          }}
        />
        <Stack.Screen name="collection-detail" options={NATIVE_PUSH_SCREEN_OPTIONS} />
        <Stack.Screen name="articles" options={NATIVE_PUSH_SCREEN_OPTIONS} />
        <Stack.Screen name="article" options={NATIVE_PUSH_SCREEN_OPTIONS} />
        <Stack.Screen
          name="similar"
          options={{
            animation: 'slide_from_right',
            animationDuration: 250,
          }}
        />
        <Stack.Screen
          name="perfume-chat"
          options={{
            animation: 'slide_from_right',
            animationDuration: 250,
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            animation: 'slide_from_right',
            animationDuration: 250,
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            animation: 'slide_from_right',
            animationDuration: 250,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            animation: 'slide_from_right',
            animationDuration: 250,
          }}
        />
        <Stack.Screen
          name="sales"
          options={{
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
          }}
        />
      </Stack>
      {showSalesOnMount && (
        <View style={StyleSheet.compose(StyleSheet.absoluteFillObject, { backgroundColor: '#000', zIndex: 999 })} />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
