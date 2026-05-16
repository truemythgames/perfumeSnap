import crashlytics from '@react-native-firebase/crashlytics';

export function initCrashlytics() {
  crashlytics().setCrashlyticsCollectionEnabled(true);
}

export function logError(error: unknown, context?: string) {
  if (error instanceof Error) {
    if (context) {
      crashlytics().log(context);
    }
    crashlytics().recordError(error);
  } else {
    crashlytics().log(context ?? 'Unknown error');
    crashlytics().recordError(new Error(String(error)));
  }
}

export function setUserId(id: string) {
  crashlytics().setUserId(id);
}

export function logMessage(message: string) {
  crashlytics().log(message);
}

export function setAttributes(attributes: Record<string, string>) {
  crashlytics().setAttributes(attributes);
}

export function testCrash() {
  crashlytics().crash();
}
