import * as SecureStore from 'expo-secure-store';
import { NativeModules, Platform } from 'react-native';

const CURRENCY_KEY = 'perfumesnap_preferred_currency';

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
];

function getDeviceCurrency(): string {
  try {
    let locale = '';
    if (Platform.OS === 'ios') {
      locale = NativeModules.SettingsManager?.settings?.AppleLocale
        || NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        || '';
    } else {
      locale = NativeModules.I18nManager?.localeIdentifier || '';
    }

    if (!locale) {
      locale = Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
    }

    const region = locale.replace('_', '-').split('-')[1]?.toUpperCase() || 'US';

    const regionToCurrency: Record<string, string> = {
      US: 'USD', GB: 'GBP', EU: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR',
      ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR',
      FI: 'EUR', GR: 'EUR', JP: 'JPY', CA: 'CAD', AU: 'AUD', CH: 'CHF',
      CN: 'CNY', KR: 'KRW', IN: 'INR', BR: 'BRL', MX: 'MXN', AE: 'AED',
      SA: 'SAR', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', TR: 'TRY',
      SG: 'SGD', HK: 'HKD', NZ: 'NZD',
    };

    return regionToCurrency[region] || 'USD';
  } catch {
    return 'USD';
  }
}

let cachedCurrency: string | null = null;

export async function getPreferredCurrency(): Promise<string> {
  if (cachedCurrency) return cachedCurrency;
  try {
    const stored = await SecureStore.getItemAsync(CURRENCY_KEY);
    if (stored && CURRENCIES.some((c) => c.code === stored)) {
      cachedCurrency = stored;
      return stored;
    }
  } catch {}
  const device = getDeviceCurrency();
  cachedCurrency = device;
  return device;
}

export async function setPreferredCurrency(code: string): Promise<void> {
  cachedCurrency = code;
  await SecureStore.setItemAsync(CURRENCY_KEY, code);
}

export function getCurrencyByCode(code: string): CurrencyOption | undefined {
  return CURRENCIES.find((c) => c.code === code);
}
