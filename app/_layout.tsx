import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';
import { initCrashlytics, logError } from '../utils/crashlytics';
import { initFacebookSDK } from '../services/analytics';
import analytics from '@react-native-firebase/analytics';

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
  useEffect(() => {
    initCrashlytics();
    initFacebookSDK();
    analytics().setAnalyticsCollectionEnabled(true);
    analytics().logEvent('app_open');
  }, []);

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
      </Stack>
    </>
  );
}
