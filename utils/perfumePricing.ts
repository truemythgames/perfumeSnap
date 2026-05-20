import type { SimilarPerfume } from '../services/api';

const DEVICE_LOCALE = Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
const localeParts = DEVICE_LOCALE.replace('_', '-').split('-');
const DEVICE_REGION = (localeParts[1] || 'US').toUpperCase();
const REGION_TO_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP',
  GR: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', IE: 'EUR', PT: 'EUR', CY: 'EUR',
  AU: 'AUD', CA: 'CAD', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  JP: 'JPY', KR: 'KRW', CN: 'CNY', IN: 'INR', AE: 'AED', SA: 'SAR', TR: 'TRY',
};
export const DEFAULT_CURRENCY = REGION_TO_CURRENCY[DEVICE_REGION] || 'USD';

function getCurrencySymbol(currencyCode: string): string {
  try {
    const parts = new Intl.NumberFormat(DEVICE_LOCALE, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    const symbol = parts.find((p) => p.type === 'currency')?.value;
    if (symbol) {
      return symbol.replace(/^USD$/i, '$').replace(/^US\$/i, '$').replace(/^([A-Z]{2})\$/i, '$');
    }
  } catch { /* ignore */ }
  return '$';
}

function formatNumberValue(value: number): string {
  try {
    return new Intl.NumberFormat(DEVICE_LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

function formatSingleCurrencyRange(min: number, max: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  if (min === max) return `${symbol}${formatNumberValue(min)}`;
  return `${symbol}${formatNumberValue(min)}-${formatNumberValue(max)}`;
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
  const match = cleaned.match(/\$?\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function isLikelySampleOrDecant(item: SimilarPerfume): boolean {
  const text = `${item.name || ''} ${item.brand || ''}`.toLowerCase();
  if (/(decant|sample|vial|travel|mini|tester)/.test(text)) return true;
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

export function computeLivePriceStats(listings: SimilarPerfume[]): { display: string } | null {
  const priced = listings
    .filter((item) => !isLikelySampleOrDecant(item))
    .map((item) => ({
      price: parseNumericPrice(item.estimatedPrice),
      retailer: item.retailer || 'Retailer',
    }))
    .filter((x): x is { price: number; retailer: string } => x.price !== null)
    .filter((x) => x.price >= 10);
  if (priced.length === 0) return null;

  let sorted = priced.map((p) => p.price).sort((a, b) => a - b);
  if (sorted.length >= 5) {
    const from = Math.floor(sorted.length * 0.2);
    const to = Math.ceil(sorted.length * 0.8);
    sorted = sorted.slice(from, to);
  }
  const median = sorted[Math.floor(sorted.length / 2)];
  const bounded = sorted.filter((v) => v >= median * 0.6 && v <= median * 1.8);
  if (bounded.length >= 2) sorted = bounded;

  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return { display: formatSingleCurrencyRange(min, max, DEFAULT_CURRENCY) };
}
