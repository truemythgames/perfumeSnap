import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getPremiumStatus } from '../services/access';
import {
  getCachedPremiumStatus,
  hasCachedPremiumStatus,
  subscribeToPremiumChange,
} from '../services/subscription';

export function usePremiumStatus(): { isPremium: boolean; checked: boolean } {
  const [isPremium, setIsPremium] = useState(getCachedPremiumStatus());
  const [checked, setChecked] = useState(hasCachedPremiumStatus());

  useEffect(() => {
    getPremiumStatus().then((status) => {
      setIsPremium(status);
      setChecked(true);
    });
    return subscribeToPremiumChange((status) => {
      setIsPremium(status);
      setChecked(true);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      getPremiumStatus().then((status) => {
        setIsPremium(status);
        setChecked(true);
      });
    }, []),
  );

  return { isPremium, checked };
}
