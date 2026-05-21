import { ExpoConfig, ConfigContext } from 'expo/config';

const FB_APP_ID = process.env.FB_APP_ID ?? '';
const FB_CLIENT_TOKEN = process.env.FB_CLIENT_TOKEN ?? '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PerfumeSnap',
  slug: 'perfumeSnap',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/logo.png',
  userInterfaceStyle: 'dark',
  scheme: 'perfumesnap',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription:
        'PerfumeSnap needs camera access to identify perfumes from photos.',
      NSPhotoLibraryUsageDescription:
        'PerfumeSnap needs photo library access to identify perfumes from your photos.',
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
        NSAllowsLocalNetworking: true,
      },
      NSUserTrackingUsageDescription:
        'This identifier will be used to deliver personalized ads to you.',
      SKAdNetworkItems: [
        { SKAdNetworkIdentifier: 'v9wttpbfk9.skadnetwork' },
        { SKAdNetworkIdentifier: 'n38lu8286q.skadnetwork' },
      ],
    },
    bundleIdentifier: 'app.perfumeSnap',
    buildNumber: '6',
    googleServicesFile: './GoogleService-Info.plist',
  },
  android: {
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      foregroundImage: './assets/logo.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.INTERNET',
      'com.google.android.gms.permission.AD_ID',
    ],
    predictiveBackGestureEnabled: false,
    package: 'app.perfumeSnap',
  },
  web: {
    favicon: './assets/logo.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#ffffff',
        image: './assets/splash-icon.png',
        imageWidth: 319,
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'PerfumeSnap needs camera access to identify perfumes.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'PerfumeSnap needs photo library access to identify perfumes from your photos.',
      },
    ],
    'expo-web-browser',
    'expo-secure-store',
    '@react-native-firebase/app',
    '@react-native-firebase/crashlytics',
    [
      'react-native-fbsdk-next',
      {
        appID: FB_APP_ID,
        clientToken: FB_CLIENT_TOKEN,
        displayName: 'PerfumeSnap',
        scheme: `fb${FB_APP_ID}`,
        advertiserIDCollectionEnabled: true,
        autoLogAppEventsEnabled: true,
        isAutoInitEnabled: true,
        iosUserTrackingPermission:
          'This identifier will be used to deliver personalized ads to you.',
      },
    ],
    [
      'expo-tracking-transparency',
      {
        userTrackingPermission:
          'This identifier will be used to deliver personalized ads to you.',
      },
    ],
  ],
});
