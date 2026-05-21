import type { SimilarPerfume } from '../services/api';
import { getCachedPreferredCurrency, getCurrencySymbol } from '../services/currency';
import { convertFromUsd } from '../services/exchangeRates';
import { cleanFragranceName } from './perfumeDisplay';

const DEVICE_LOCALE = Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW']);

export function getDisplayCurrencyCode(): string {
  return getCachedPreferredCurrency();
}

function formatNumberValue(value: number, currencyCode: string): string {
  const fractionDigits = ZERO_DECIMAL_CURRENCIES.has(currencyCode) ? 0 : 2;
  try {
    return new Intl.NumberFormat(DEVICE_LOCALE, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  } catch {
    return fractionDigits === 0 ? String(Math.round(value)) : value.toFixed(2);
  }
}

function formatSingleCurrencyRange(minUsd: number, maxUsd: number, currencyCode: string): string {
  const min = convertFromUsd(minUsd, currencyCode);
  const max = convertFromUsd(maxUsd, currencyCode);
  const symbol = getCurrencySymbol(currencyCode);
  if (min === max) return `${symbol}${formatNumberValue(min, currencyCode)}`;
  return `${symbol}${formatNumberValue(min, currencyCode)}-${formatNumberValue(max, currencyCode)}`;
}

export function formatPriceValues(minUsd: number, maxUsd: number, currencyCode = getCachedPreferredCurrency()): string {
  return formatSingleCurrencyRange(minUsd, maxUsd, currencyCode);
}

export function formatPriceRange(raw: string | undefined, currencyCode: string): string {
  if (!raw) return '';
  const nums = raw.match(/[\d]+(?:[.,]\d+)?/g);
  if (!nums || nums.length === 0) return raw;
  const values = nums
    .map((n) => Number(n.replace(',', '.')))
    .filter((v) => Number.isFinite(v));
  if (values.length === 0) return raw;
  return formatSingleCurrencyRange(Math.min(...values), Math.max(...values), currencyCode);
}

export function splitCurrencyDisplay(display: string): { currency: string; amount: string } {
  const m = display.trim().match(/^([^\d\s.,-]+)\s*(.+)$/);
  if (!m) return { currency: '', amount: display };
  return { currency: m[1], amount: m[2] };
}

export function parseNumericPrice(raw?: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, '');
  const match = cleaned.match(/(?:\$|€|£|¥|₩|₹)?\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function isLikelySampleOrDecant(item: SimilarPerfume): boolean {
  const text = `${item.name || ''} ${item.brand || ''}`.toLowerCase();
  if (/(decant|sample|vial|travel|mini|tester|split|decanted)/.test(text)) return true;
  const mlMatch = text.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  if (mlMatch) {
    const ml = Number(mlMatch[1]);
    if (Number.isFinite(ml) && ml > 0 && ml <= 15) return true;
  }
  const ozMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:fl\s*)?oz\b/);
  if (ozMatch) {
    const oz = Number(ozMatch[1]);
    if (Number.isFinite(oz) && oz > 0 && oz <= 0.5) return true;
  }
  return false;
}

/** Exclude gift sets, body products, and non-standard bottle sizes from price stats. */
export function isLikelyNonRetailBottle(item: SimilarPerfume): boolean {
  if (isLikelySampleOrDecant(item)) return true;
  const text = `${item.name || ''} ${item.brand || ''}`.toLowerCase();
  if (/\b(gift set|discovery set|travel set|body lotion|body spray|shower gel|deodorant|aftershave|hair mist|candle|refill cartridge)\b/.test(text)) {
    return true;
  }
  if (/\b(10|15|30|0\.5|1\.0|1\.7)\s*(ml|fl\s*oz|oz)\b/.test(text)) return true;
  if (/\b(200|250|500)\s*ml\b/.test(text)) return true;
  return false;
}

export function computeLivePriceStats(
  listings: SimilarPerfume[],
  currencyCode = getCachedPreferredCurrency(),
): { display: string } | null {
  const priced = listings
    .filter((item) => !isLikelyNonRetailBottle(item))
    .map((item) => ({
      price: parseNumericPrice(item.estimatedPrice),
      retailer: item.retailer || 'Retailer',
    }))
    .filter((x): x is { price: number; retailer: string } => x.price !== null)
    .filter((x) => x.price >= 15);
  if (priced.length === 0) return null;

  let sorted = priced.map((p) => p.price).sort((a, b) => a - b);
  if (sorted.length >= 5) {
    const from = Math.floor(sorted.length * 0.15);
    const to = Math.ceil(sorted.length * 0.85);
    sorted = sorted.slice(from, to);
  }

  const median = sorted[Math.floor(sorted.length / 2)];
  const bounded = sorted.filter((v) => v >= median * 0.55 && v <= median * 1.65);
  if (bounded.length >= 2) sorted = bounded;

  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return { display: formatSingleCurrencyRange(min, max, currencyCode) };
}

export function buildSimilarSearchTerms(name: string, brand: string): { name: string; brand: string; query: string } {
  const cleanName = cleanFragranceName(name, brand);
  const cleanBrand = (brand || '').trim();
  const query = `${cleanBrand} ${cleanName}`.trim();
  return { name: cleanName, brand: cleanBrand, query: query || `${cleanBrand} ${name}`.trim() };
}
