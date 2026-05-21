import * as SecureStore from 'expo-secure-store';
import { CURRENCIES } from './currency';

const CACHE_KEY = 'perfumesnap_exchange_rates_v1';
const CACHE_TS_KEY = 'perfumesnap_exchange_rates_ts_v1';
const TTL_MS = 24 * 60 * 60 * 1000;
const FRANKFURTER_URL = 'https://api.frankfurter.app/latest?from=USD';

/** 1 USD → target currency. Used when offline or API omits a code. */
const FALLBACK_USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150,
  CAD: 1.36,
  AUD: 1.54,
  CHF: 0.88,
  CNY: 7.25,
  KRW: 1350,
  INR: 83,
  BRL: 5.0,
  MXN: 17.5,
  AED: 3.67,
  SAR: 3.75,
  SEK: 10.5,
  NOK: 10.8,
  DKK: 6.9,
  PLN: 4.0,
  TRY: 32,
  SGD: 1.34,
  HKD: 7.8,
  NZD: 1.67,
};

let ratesCache: Record<string, number> = { ...FALLBACK_USD_RATES };
let ratesLoaded = false;
const rateListeners = new Set<() => void>();

export function subscribeToExchangeRates(listener: () => void): () => void {
  rateListeners.add(listener);
  return () => rateListeners.delete(listener);
}

function notifyRateListeners(): void {
  rateListeners.forEach((listener) => listener());
}

export function areExchangeRatesLoaded(): boolean {
  return ratesLoaded;
}

export function getUsdToCurrencyRate(code: string): number {
  if (code === 'USD') return 1;
  return ratesCache[code] ?? FALLBACK_USD_RATES[code] ?? 1;
}

export function roundForCurrency(value: number, code: string): number {
  if (code === 'JPY' || code === 'KRW') return Math.round(value);
  return Math.round(value * 100) / 100;
}

/** Convert a USD amount into the user's preferred currency. */
export function convertFromUsd(amountUsd: number, targetCurrency: string): number {
  if (!Number.isFinite(amountUsd)) return amountUsd;
  if (targetCurrency === 'USD') return roundForCurrency(amountUsd, 'USD');
  return roundForCurrency(amountUsd * getUsdToCurrencyRate(targetCurrency), targetCurrency);
}

async function loadCachedRates(): Promise<boolean> {
  try {
    const [raw, tsRaw] = await Promise.all([
      SecureStore.getItemAsync(CACHE_KEY),
      SecureStore.getItemAsync(CACHE_TS_KEY),
    ]);
    if (!raw || !tsRaw) return false;
    const ts = Number(tsRaw);
    if (!Number.isFinite(ts) || Date.now() - ts > TTL_MS) return false;
    const parsed = JSON.parse(raw) as Record<string, number>;
    if (!parsed || typeof parsed !== 'object') return false;
    ratesCache = { ...FALLBACK_USD_RATES, ...parsed, USD: 1 };
    ratesLoaded = true;
    return true;
  } catch {
    return false;
  }
}

async function saveRates(rates: Record<string, number>): Promise<void> {
  try {
    await SecureStore.setItemAsync(CACHE_KEY, JSON.stringify(rates));
    await SecureStore.setItemAsync(CACHE_TS_KEY, String(Date.now()));
  } catch {
    // ignore cache write failures
  }
}

export async function prefetchExchangeRates(force = false): Promise<void> {
  if (!force) {
    const hasFreshCache = await loadCachedRates();
    if (hasFreshCache) {
      notifyRateListeners();
      return;
    }
  }

  try {
    const res = await fetch(FRANKFURTER_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { rates?: Record<string, number> };
    const fetched = data.rates ?? {};
    const merged: Record<string, number> = { USD: 1 };
    for (const { code } of CURRENCIES) {
      if (code === 'USD') continue;
      merged[code] = fetched[code] ?? FALLBACK_USD_RATES[code] ?? 1;
    }
    ratesCache = merged;
    ratesLoaded = true;
    await saveRates(merged);
    notifyRateListeners();
  } catch {
    await loadCachedRates();
    if (!ratesLoaded) {
      ratesCache = { ...FALLBACK_USD_RATES };
      ratesLoaded = true;
    }
    notifyRateListeners();
  }
}
