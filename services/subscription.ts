import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PACKAGE_TYPE,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

const IOS_REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '';
const ANDROID_REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '';
const PREMIUM_ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? 'premium';

let isConfigured = false;
let configuredAppUserId: string | null = null;

function getRevenueCatApiKey() {
  if (Platform.OS === 'ios') return IOS_REVENUECAT_API_KEY;
  if (Platform.OS === 'android') return ANDROID_REVENUECAT_API_KEY;
  return '';
}

export async function initRevenueCat(appUserId?: string): Promise<boolean> {
  if (isConfigured) {
    if (appUserId && configuredAppUserId !== appUserId) {
      try {
        await Purchases.logIn(appUserId);
        configuredAppUserId = appUserId;
      } catch (error) {
        console.warn('[PerfumeSnap] RevenueCat logIn failed:', error);
        return false;
      }
    }
    return true;
  }

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn(
      '[PerfumeSnap] RevenueCat API key missing. Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY.',
    );
    return false;
  }

  try {
    await Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
    if (appUserId) {
      await Purchases.configure({ apiKey, appUserID: appUserId });
      configuredAppUserId = appUserId;
    } else {
      await Purchases.configure({ apiKey });
      configuredAppUserId = null;
    }
    isConfigured = true;
    return true;
  } catch (error) {
    console.warn('[PerfumeSnap] RevenueCat init failed:', error);
    return false;
  }
}

export async function getCustomerInfo(appUserId?: string): Promise<CustomerInfo | null> {
  const ready = await initRevenueCat(appUserId);
  if (!ready) return null;

  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.warn('[PerfumeSnap] Failed fetching customer info:', error);
    return null;
  }
}

export async function isPremiumUser(appUserId?: string): Promise<boolean> {
  const customerInfo = await getCustomerInfo(appUserId);
  if (!customerInfo) return false;
  return Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
}

export async function getCurrentOffering(appUserId?: string): Promise<PurchasesOffering | null> {
  const ready = await initRevenueCat(appUserId);
  if (!ready) return null;

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.warn('[PerfumeSnap] Failed fetching offerings:', error);
    return null;
  }
}

export async function restorePurchases(appUserId?: string): Promise<boolean> {
  const ready = await initRevenueCat(appUserId);
  if (!ready) return false;

  try {
    const customerInfo = await Purchases.restorePurchases();
    return Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
  } catch (error) {
    console.warn('[PerfumeSnap] Failed restoring purchases:', error);
    return false;
  }
}

export type PaywallPackages = {
  trialPackage: PurchasesPackage | null;
  introPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;
};

export async function getPaywallPackages(appUserId?: string): Promise<PaywallPackages> {
  const offering = await getCurrentOffering(appUserId);
  if (!offering) {
    return {
      trialPackage: null,
      introPackage: null,
      annualPackage: null,
    };
  }

  const available = offering.availablePackages;

  // Match by custom identifier first, then fall back to product analysis
  const trialPackage =
    available.find((pkg) => pkg.identifier === 'yearly_trial') ??
    available.find((pkg) => {
      const intro = pkg.product.introPrice;
      return Boolean(intro && intro.price === 0);
    }) ??
    null;

  const introPackage =
    available.find((pkg) => pkg.identifier === 'yearly_intro') ??
    available.find((pkg) => {
      const intro = pkg.product.introPrice;
      return Boolean(intro && intro.price > 0);
    }) ??
    null;

  const annualPackage =
    trialPackage ??
    offering.annual ??
    available.find((pkg) => pkg.packageType === PACKAGE_TYPE.ANNUAL) ??
    null;

  return {
    trialPackage,
    introPackage,
    annualPackage,
  };
}
