import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  getCachedPreferredCurrency,
  getPreferredCurrency,
  subscribeToCurrencyChange,
} from '../services/currency';
import { prefetchExchangeRates, subscribeToExchangeRates } from '../services/exchangeRates';

export function usePreferredCurrency(): string {
  const [currency, setCurrency] = useState(getCachedPreferredCurrency());
  const [, setRatesTick] = useState(0);

  useEffect(() => {
    prefetchExchangeRates();
    getPreferredCurrency().then(setCurrency);

    const unsubCurrency = subscribeToCurrencyChange((code) => {
      setCurrency(code);
      setRatesTick((tick) => tick + 1);
    });
    const unsubRates = subscribeToExchangeRates(() => {
      setRatesTick((tick) => tick + 1);
    });

    return () => {
      unsubCurrency();
      unsubRates();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      getPreferredCurrency().then(setCurrency);
      void prefetchExchangeRates();
    }, []),
  );

  return currency;
}
