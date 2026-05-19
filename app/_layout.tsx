import { useEffect, useState } from 'react';
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
import OnboardingFlow from '../components/OnboardingFlow';

SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = 'perfumesnap_onboarding_done';

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
  const [appUserId, setAppUserId] = useState<string | null>(null);
  const navRef = useNavigationContainerRef();

  useEffect(() => {
    // TODO: re-enable SecureStore check once onboarding is finalized
    // SecureStore.getItemAsync(ONBOARDING_KEY)
    //   .then(val => setOnboardingDone(val === '1'))
    //   .catch(() => setOnboardingDone(false))
    //   .finally(() => SplashScreen.hideAsync());
    setOnboardingDone(false);
  }, []);

  useEffect(() => {
    if (!onboardingDone) return;

    const initialize = async () => {
      initCrashlytics();
      initFacebookSDK();
      analytics().setAnalyticsCollectionEnabled(true);
      analytics().logEvent('app_open');

      const userId = await getOrCreateUserId();
      setAppUserId(userId);
      await initRevenueCat(userId);
    };

    initialize();
  }, [onboardingDone]);

  useEffect(() => {
    if (!appUserId || !onboardingDone) return;

    let checking = false;

    const showSalesIfNeeded = async () => {
      if (checking || isPaywallDismissedForSession()) return;
      checking = true;
      try {
        const premium = await isPremiumUser(appUserId);
        if (!premium && navRef.isReady()) {
          dismissPaywallForSession();
          router.push('/sales');
        }
      } catch { /* ignore */ } finally {
        checking = false;
      }
    };

    const timer = setTimeout(showSalesIfNeeded, 300);

    return () => { clearTimeout(timer); };
  }, [appUserId, onboardingDone]);

  if (onboardingDone === null) return null;

  if (!onboardingDone) {
    return (
      <OnboardingFlow
        onComplete={async () => {
          // TODO: re-enable persistence once onboarding is finalized
          // await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
          setOnboardingDone(true);
        }}
      />
    );
  }

  return (
    <>
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
            animation: 'slide_from_right',
            animationDuration: 250,
          }}
        />
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
    </>
  );
}
