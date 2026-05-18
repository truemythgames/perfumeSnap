import { useEffect, useState } from 'react';
import { Stack, router, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';
import { initCrashlytics, logError } from '../utils/crashlytics';
import { initFacebookSDK } from '../services/analytics';
import analytics from '@react-native-firebase/analytics';
import { initRevenueCat, isPremiumUser } from '../services/subscription';
import { getOrCreateUserId } from '../services/user';
import { isPaywallDismissedForSession, dismissPaywallForSession } from '../services/paywall';

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
  const [appUserId, setAppUserId] = useState<string | null>(null);
  const navRef = useNavigationContainerRef();

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!appUserId) return;

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
  }, [appUserId]);

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
