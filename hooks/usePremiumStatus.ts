import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
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

/** Sends the user to the paywall as soon as premium status is known to be missing. */
export function useRequirePremium() {
  const status = usePremiumStatus();
  useEffect(() => {
    if (status.checked && !status.isPremium) router.replace('/sales');
  }, [status.checked, status.isPremium]);
  return status;
}
