import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import Purchases, {
  CustomerInfo,
  PACKAGE_TYPE,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import { initFacebookSDK, trackEvent } from './analytics';

const IOS_REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '';
const ANDROID_REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '';
const PREMIUM_ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? 'premium';

/**
 * Onboarding lists two quarterly plans: a 3-day free trial, then a 30-day intro.
 * The in-app paywall lists weekly and quarterly. Yearly stays the exit deal.
 */
export const REVENUECAT_PACKAGES = {
  onboardingTrial: 'yearly_trial',
  onboardingIntro: 'yearly_intro',
  onboardingQuarterlyTrial: 'quarterly_onboarding',
  onboardingQuarterlyTrialProduct: 'perfumesnap_quarterly_onboarding_3day_freetrial',
  onboardingQuarterlyIntro: 'quarterly_30day',
  onboardingQuarterlyIntroProduct: 'perfumesnap_quarterly_30day_trial',
  weekly: 'weekly',
  quarterly: 'quarterly',
  weeklyProduct: 'perfumesnap_weekly_3day_freetrial',
  quarterlyProduct: 'perfumesnap_quarterly_3day_freetrial',
} as const;

const DEAL_ID = /offer|deal/i;

let isConfigured = false;
let configuredAppUserId: string | null = null;
let customerInfoListenerAdded = false;

let cachedPremiumStatus: boolean | null = null;
const premiumListeners = new Set<(isPremium: boolean) => void>();

export function subscribeToPremiumChange(listener: (isPremium: boolean) => void): () => void {
  premiumListeners.add(listener);
  return () => premiumListeners.delete(listener);
}

export function getCachedPremiumStatus(): boolean {
  return cachedPremiumStatus ?? false;
}

export function hasCachedPremiumStatus(): boolean {
  return cachedPremiumStatus !== null;
}

export function notifyPremiumStatusChanged(isPremium: boolean): void {
  cachedPremiumStatus = isPremium;
  premiumListeners.forEach((listener) => listener(isPremium));
}

function setupCustomerInfoListener(): void {
  if (customerInfoListenerAdded) return;
  customerInfoListenerAdded = true;
  Purchases.addCustomerInfoUpdateListener((customerInfo) => {
    notifyPremiumStatusChanged(hasPremiumEntitlement(customerInfo));
    // Renewals and trial conversions need the current ads ids on the subscriber.
    void sendAttributionIds();
  });
}

export function hasPremiumEntitlement(customerInfo: CustomerInfo): boolean {
  return Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
}

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
    setupCustomerInfoListener();
    void attachStoreAttribution();
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

// Set to true during development to force non-premium for testing
const DEV_FORCE_FREE = __DEV__ && false;

export async function isPremiumUser(appUserId?: string): Promise<boolean> {
  if (DEV_FORCE_FREE) return false;
  const customerInfo = await getCustomerInfo(appUserId);
  if (!customerInfo) return false;
  const premium = hasPremiumEntitlement(customerInfo);
  notifyPremiumStatusChanged(premium);
  return premium;
}

export async function getCurrentOffering(appUserId?: string): Promise<PurchasesOffering | null> {
  const ready = await initRevenueCat(appUserId);
  if (!ready) return null;

  try {
    const offerings = await Purchases.getOfferings();
    if (!offerings.current) {
      console.warn(
        '[PerfumeSnap] RevenueCat has no current offering. Mark an offering as Current in the RevenueCat dashboard.',
      );
    }
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
    const premium = hasPremiumEntitlement(customerInfo);
    notifyPremiumStatusChanged(premium);
    return premium;
  } catch (error) {
    console.warn('[PerfumeSnap] Failed restoring purchases:', error);
    return false;
  }
}

let attributionStarted = false;

/** Facebook, Firebase, and Apple Ads ids so RevenueCat can attribute renewals. */
async function attachStoreAttribution(): Promise<void> {
  if (attributionStarted) return;
  attributionStarted = true;
  try {
    await initFacebookSDK();
  } catch (error) {
    console.warn('[PerfumeSnap] Facebook SDK init failed:', error);
  }
  await sendAttributionIds();
}

let sendingAttribution = false;

/** Device, Facebook, and Firebase ids. Safe to call again when the subscription updates. */
async function sendAttributionIds(): Promise<void> {
  if (!isConfigured || sendingAttribution) return;
  sendingAttribution = true;
  try {
    await pushAttributionIds();
  } finally {
    sendingAttribution = false;
  }
}

async function pushAttributionIds(): Promise<void> {

  try {
    await Purchases.collectDeviceIdentifiers();
  } catch (error) {
    console.warn('[PerfumeSnap] collectDeviceIdentifiers failed:', error);
  }

  try {
    const { AppEventsLogger } = require('react-native-fbsdk-next') as {
      AppEventsLogger?: { getAnonymousID?: () => Promise<string> };
    };
    const fbAnonId = await AppEventsLogger?.getAnonymousID?.();
    if (fbAnonId) await Purchases.setFBAnonymousID(fbAnonId);
  } catch (error) {
    console.warn('[PerfumeSnap] setFBAnonymousID failed:', error);
  }

  let hasFirebase = false;
  try {
    hasFirebase = Boolean(NativeModules.RNFBAppModule || TurboModuleRegistry.get('RNFBAppModule'));
  } catch {
    hasFirebase = false;
  }
  if (hasFirebase) {
    try {
      const analytics = require('@react-native-firebase/analytics').default;
      const instanceId = await analytics().getAppInstanceId();
      if (instanceId) await Purchases.setFirebaseAppInstanceID(instanceId);
    } catch (error) {
      console.warn('[PerfumeSnap] setFirebaseAppInstanceID failed:', error);
    }
  }

  if (Platform.OS === 'ios') {
    try {
      await Purchases.enableAdServicesAttributionTokenCollection();
    } catch (error) {
      console.warn('[PerfumeSnap] AdServices attribution failed:', error);
    }
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const ready = await initRevenueCat();
  if (!ready) return false;
  try {
    let customerInfo: CustomerInfo;
    try {
      ({ customerInfo } = await Purchases.purchasePackage(pkg));
    } catch (error: any) {
      if (error?.userCancelled) return false;
      ({ customerInfo } = await Purchases.purchaseStoreProduct(pkg.product));
    }
    const active = hasPremiumEntitlement(customerInfo);
    notifyPremiumStatusChanged(active);
    if (active) {
      trackEvent('start_trial', {
        product_id: pkg.product.identifier,
        price: pkg.product.price,
        currency: pkg.product.currencyCode,
      });
    }
    return active;
  } catch (error: any) {
    if (error?.userCancelled) return false;
    console.warn('[PerfumeSnap] Purchase failed:', error);
    throw error;
  }
}

export type PaywallMode = 'onboarding' | 'app';

export type PlanCopy = {
  id: string;
  price: string;
  detail: string;
  sub: string;
  button: string;
  note: string;
  due: boolean;
};

export type PaywallPlan = PlanCopy & {
  title: string;
  badge: string | null;
  pkg: PurchasesPackage;
};

export type DealCopy = {
  perWeek: string;
  billed: string;
  discount: string | null;
};

export type PaywallContent = {
  plans: PaywallPlan[];
  dealPackage: PurchasesPackage | null;
  deal: DealCopy | null;
};

function packageBlob(pkg: PurchasesPackage): string {
  return `${pkg.identifier} ${pkg.product.identifier} ${pkg.product.title ?? ''}`.toLowerCase();
}

function matchPackage(
  packages: PurchasesPackage[],
  rcIdentifier: string,
  productId?: string,
): PurchasesPackage | null {
  return (
    packages.find((pkg) => {
      const id = pkg.identifier;
      const pid = pkg.product.identifier;
      return (
        id === rcIdentifier ||
        id === productId ||
        pid === productId ||
        pid === rcIdentifier ||
        (productId ? pid.startsWith(productId) || pid.includes(productId) : false) ||
        id.includes(rcIdentifier)
      );
    }) ?? null
  );
}

type Period = { unit: string; count: number };

function periodOf(raw: unknown): Period | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const match = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/.exec(raw);
    if (!match) return null;
    if (match[1]) return { unit: 'YEAR', count: Number(match[1]) };
    if (match[2]) return { unit: 'MONTH', count: Number(match[2]) };
    if (match[3]) return { unit: 'WEEK', count: Number(match[3]) };
    if (match[4]) return { unit: 'DAY', count: Number(match[4]) };
    return null;
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const unit = String(obj.unit ?? obj.periodUnit ?? '').toUpperCase();
    const count = Number(obj.value ?? obj.numberOfUnits ?? obj.periodNumberOfUnits ?? 0);
    if (!unit || !count) return null;
    return { unit, count };
  }
  return null;
}

function unitWord(unit: string, count: number): string {
  const one = unit === 'DAY' ? 'day' : unit === 'WEEK' ? 'week' : unit === 'MONTH' ? 'month' : unit === 'YEAR' ? 'year' : 'period';
  return count === 1 ? one : `${one}s`;
}

function countPhrase(unit: string, count: number): string {
  const n = Math.max(1, count || 1);
  return `${n} ${unitWord(unit, n)}`;
}

function lengthAdjective(unit: string, count: number): string {
  return `${Math.max(1, count || 1)}-${unitWord(unit, 1)}`;
}

function everyPhrase(unit: string, count: number): string {
  const n = Math.max(1, count || 1);
  return n === 1 ? `every ${unitWord(unit, 1)}` : `every ${countPhrase(unit, n)}`;
}

function isZeroPrice(raw: string): boolean {
  const s = raw.trim();
  if (!s) return true;
  if (/^(free|gratis)$/i.test(s)) return true;
  return /^(free|gratis)?\s*([$€£]|us\$)?\s*0([.,]00)?\s*([$€£])?$/i.test(s);
}

function bareAmount(raw: string): number | null {
  const s = raw.trim();
  if (!/^[\d\s.,]+$/.test(s)) return null;
  const normalized = s.includes(',') && !s.includes('.')
    ? s.replace(/\s/g, '').replace(',', '.')
    : s.replace(/[\s,]/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

function formatStorePrice(
  product: { priceString?: string; price?: number; currencyCode?: string } | null | undefined,
  fallbackCurrency?: string,
): string {
  if (!product) return '';
  const currency = product.currencyCode || fallbackCurrency;
  const raw = String(product.priceString ?? '').trim();
  if (raw && !isZeroPrice(raw)) {
    const bare = bareAmount(raw);
    if (bare !== null && bare > 0 && currency) {
      try {
        return formatAmount(bare, currency);
      } catch {
        return raw;
      }
    }
    return raw;
  }
  const n = Number(product.price);
  if (n > 0 && currency) {
    try {
      return formatAmount(n, currency);
    } catch {
      return '';
    }
  }
  return '';
}

function productPeriod(pkg: PurchasesPackage): Period | null {
  const product = pkg.product as PurchasesPackage['product'] & { subscriptionPeriod?: unknown };
  return periodOf(product.subscriptionPeriod);
}

function weeksIn(period: Period | null): number {
  if (!period) return 0;
  const per = period.unit === 'DAY' ? 1 / 7 : period.unit === 'WEEK' ? 1 : period.unit === 'MONTH' ? 52 / 12 : period.unit === 'YEAR' ? 52 : 0;
  return per * period.count;
}

function perWeekOf(pkg: PurchasesPackage): number {
  const product = pkg.product as PurchasesPackage['product'] & { pricePerWeek?: number };
  if (Number(product.pricePerWeek) > 0) return Number(product.pricePerWeek);
  const weeks = weeksIn(productPeriod(pkg));
  const price = Number(product.price);
  return weeks > 0 && price > 0 ? price / weeks : 0;
}

export function savingVs(pkg: PurchasesPackage, base: PurchasesPackage): string | null {
  const a = perWeekOf(pkg);
  const b = perWeekOf(base);
  if (!a || !b) return null;
  const pct = Math.round((1 - a / b) * 100);
  return pct > 0 && pct < 100 ? `${pct}% off` : null;
}

/** Price, trial, and renewal line taken from the store product. */
export function describePlan(pkg: PurchasesPackage): PlanCopy {
  const product = pkg.product;
  const id = product.identifier || pkg.identifier;
  const renewal = formatStorePrice(product);
  const period = productPeriod(pkg);
  const intro = product.introPrice;
  const introPaid = intro ? formatStorePrice(intro, product.currencyCode) : '';
  const introPeriod = intro
    ? periodOf({ unit: intro.periodUnit, value: intro.periodNumberOfUnits }) || periodOf((intro as { period?: unknown }).period)
    : null;
  const every = period ? everyPhrase(period.unit, period.count) : '';
  const renewalBit = renewal && every ? `${renewal} ${every}` : renewal;

  if (intro && !introPaid && introPeriod) {
    const length = countPhrase(introPeriod.unit, introPeriod.count);
    const adjective = lengthAdjective(introPeriod.unit, introPeriod.count);
    return {
      id,
      price: 'Free',
      detail: `${adjective} trial`,
      sub: `${adjective} free trial.`,
      button: 'Try for free',
      note: renewalBit ? `${length} free, then ${renewalBit}` : `${length} free`,
      due: true,
    };
  }

  if (intro && introPaid && introPeriod) {
    const length = countPhrase(introPeriod.unit, introPeriod.count);
    const adjective = lengthAdjective(introPeriod.unit, introPeriod.count);
    return {
      id,
      price: introPaid,
      detail: `${adjective} trial`,
      sub: `${adjective} trial.`,
      button: 'Continue',
      note: renewalBit ? `${introPaid} for ${length}, then ${renewalBit}` : `${introPaid} for ${length}`,
      due: false,
    };
  }

  const cadence = period ? everyPhrase(period.unit, period.count) : '';
  const detail = cadence ? cadence.charAt(0).toUpperCase() + cadence.slice(1) : product.title || 'Premium';
  return {
    id,
    price: renewal || 'Premium',
    detail,
    sub: `${detail}.`,
    button: 'Continue',
    note: renewalBit || 'Cancel anytime',
    due: false,
  };
}

/** Weekly includes a 3-day free trial. A paid intro, such as quarterly's 30-day offer, is left as the store describes it. */
function asThreeDayTrial(copy: PlanCopy, pkg: PurchasesPackage): PlanCopy {
  if (copy.due) return copy;
  const renewal = formatStorePrice(pkg.product);
  const period = productPeriod(pkg);
  const every = period ? everyPhrase(period.unit, period.count) : '';
  const renewalBit = renewal && every ? `${renewal} ${every}` : renewal;
  return {
    ...copy,
    price: 'Free',
    detail: '3-day trial',
    sub: '3-day free trial.',
    button: 'Try for free',
    note: renewalBit ? `3 days free, then ${renewalBit}` : '3 days free',
    due: true,
  };
}

export function describeDeal(deal: PurchasesPackage, regular: PurchasesPackage[]): DealCopy | null {
  const product = deal.product as PurchasesPackage['product'] & { pricePerWeekString?: string };
  let weekly = perWeekOf(deal);
  const total = formatStorePrice(product);
  if (!weekly && Number(product.price) > 0) {
    const weeks = weeksIn(productPeriod(deal)) || (/year|annual/.test(packageBlob(deal)) ? 52 : 0);
    if (weeks > 0) weekly = Number(product.price) / weeks;
  }
  if (!weekly || !total) return null;
  let perWeek = String(product.pricePerWeekString ?? '');
  if (!perWeek) {
    if (!product.currencyCode) return null;
    try {
      perWeek = new Intl.NumberFormat(undefined, { style: 'currency', currency: product.currencyCode }).format(weekly);
    } catch {
      return null;
    }
  }
  const period = productPeriod(deal);
  const cadence: Record<string, string> = { DAY: 'daily', WEEK: 'weekly', MONTH: 'monthly', YEAR: 'yearly' };
  const how = !period ? '' : period.count === 1 && cadence[period.unit] ? cadence[period.unit] : everyPhrase(period.unit, period.count);
  const billed = how ? `Billed ${how} at ${total}` : `Billed at ${total}`;
  const bases = regular.map(perWeekOf).filter((n) => n > 0);
  const base = bases.length ? Math.min(...bases) : 0;
  const pct = base > 0 ? Math.round((1 - weekly / base) * 100) : 0;
  return { perWeek, billed, discount: pct > 0 && pct < 100 ? `${pct}% off` : null };
}

function isQuarterly(pkg: PurchasesPackage): boolean {
  const period = productPeriod(pkg);
  if (pkg.packageType === PACKAGE_TYPE.THREE_MONTH) return true;
  if (period?.unit === 'MONTH' && period.count === 3) return true;
  return /quarter/.test(`${pkg.identifier} ${pkg.product.identifier}`.toLowerCase());
}

function introPriceText(pkg: PurchasesPackage): string {
  const intro = pkg.product.introPrice;
  if (!intro) return '';
  return formatStorePrice(intro, pkg.product.currencyCode);
}

function introIsFree(pkg: PurchasesPackage): boolean {
  return Boolean(pkg.product.introPrice) && !introPriceText(pkg);
}

function introIsPaid(pkg: PurchasesPackage): boolean {
  return Boolean(introPriceText(pkg));
}

/** Onboarding: quarterly with 3 days free, then quarterly with the paid 30-day intro. */
function pickOnboardingQuarterlies(pool: PurchasesPackage[]): [PurchasesPackage | null, PurchasesPackage | null] {
  const quarterlies = pool.filter(isQuarterly);
  const free =
    matchPackage(quarterlies, REVENUECAT_PACKAGES.onboardingQuarterlyTrial, REVENUECAT_PACKAGES.onboardingQuarterlyTrialProduct)
    ?? quarterlies.find(introIsFree)
    ?? null;
  const rest = quarterlies.filter((pkg) => pkg !== free);
  const legacy = rest.find((pkg) =>
    pkg.identifier === REVENUECAT_PACKAGES.quarterly
    || pkg.product.identifier === REVENUECAT_PACKAGES.quarterlyProduct
    || pkg.product.identifier.startsWith(REVENUECAT_PACKAGES.quarterlyProduct)
  ) ?? null;
  const intro =
    matchPackage(rest, REVENUECAT_PACKAGES.onboardingQuarterlyIntro, REVENUECAT_PACKAGES.onboardingQuarterlyIntroProduct)
    ?? rest.find(introIsPaid)
    ?? (legacy && !introIsFree(legacy) ? legacy : null);
  return [free, intro];
}

function isYearly(pkg: PurchasesPackage): boolean {
  const period = productPeriod(pkg);
  return pkg.packageType === PACKAGE_TYPE.ANNUAL || period?.unit === 'YEAR' || pkg.identifier === 'yearly';
}

function pickYearlyDeal(pool: PurchasesPackage[]): PurchasesPackage | null {
  const annuals = pool.filter(isYearly);
  if (!annuals.length) return null;
  return annuals.reduce((best, pkg) => {
    const next = perWeekOf(pkg);
    const current = perWeekOf(best);
    if (next > 0 && (current <= 0 || next < current)) return pkg;
    return best;
  });
}

const EMPTY_PAYWALL: PaywallContent = { plans: [], dealPackage: null, deal: null };

export async function loadPaywall(mode: PaywallMode, appUserId?: string): Promise<PaywallContent> {
  const ready = await initRevenueCat(appUserId);
  if (!ready) return EMPTY_PAYWALL;

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    const others = (Object.values(offerings.all ?? {}) as PurchasesOffering[]).filter((offering) => offering && offering !== current);
    const dealOffering = others.find((offering) => DEAL_ID.test(offering.identifier));
    const pool = [...(current?.availablePackages ?? []), ...others.flatMap((offering) => offering.availablePackages ?? [])];
    const dealPackage =
      dealOffering?.availablePackages?.[0] ??
      pool.find((pkg) => DEAL_ID.test(`${pkg.identifier} ${pkg.product.identifier}`)) ??
      pickYearlyDeal(pool.filter((pkg) => pkg.identifier !== REVENUECAT_PACKAGES.weekly && pkg.identifier !== REVENUECAT_PACKAGES.quarterly)) ??
      null;

    const weekly = matchPackage(pool, REVENUECAT_PACKAGES.weekly, REVENUECAT_PACKAGES.weeklyProduct)
      ?? pool.find((pkg) => pkg.packageType === PACKAGE_TYPE.WEEKLY)
      ?? null;
    const quarterly = matchPackage(
      pool.filter((pkg) => pkg !== weekly),
      REVENUECAT_PACKAGES.quarterly,
      REVENUECAT_PACKAGES.quarterlyProduct,
    ) ?? pool.find((pkg) => pkg !== weekly && pkg.packageType === PACKAGE_TYPE.THREE_MONTH) ?? null;

    const [freeQuarterly, introQuarterly] = pickOnboardingQuarterlies(pool);
    const selected = (mode === 'onboarding' ? [freeQuarterly, introQuarterly] : [weekly, quarterly])
      .filter((pkg): pkg is PurchasesPackage => Boolean(pkg));

    const plans: PaywallPlan[] = selected.map((pkg, index) => {
      const described = describePlan(pkg);
      const freeTrial = mode === 'onboarding' ? pkg === freeQuarterly : pkg === weekly;
      const copy = freeTrial ? asThreeDayTrial(described, pkg) : described;
      return {
        ...copy,
        id: `${index}:${copy.id}`,
        title: pkg === weekly ? 'Weekly Access' : '3 Month Access',
        badge: !freeTrial && weekly ? savingVs(pkg, weekly) : null,
        pkg,
      };
    });

    const compared = selected.filter((pkg) => pkg !== dealPackage);
    const deal = dealPackage ? describeDeal(dealPackage, compared.length ? compared : selected) : null;
    return { plans, dealPackage, deal };
  } catch (error) {
    console.warn('[PerfumeSnap] Failed fetching offerings:', error);
    return EMPTY_PAYWALL;
  }
}
