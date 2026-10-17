import React, { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import CollectionDetailView from '../components/CollectionDetailView';
import { useRequirePremium } from '../hooks/usePremiumStatus';

export default function CollectionDetailRoute() {
  useRequirePremium();
  const params = useLocalSearchParams<{ prefillKey?: string; imageUri?: string }>();

  const prefillKey = useMemo(() => {
    const v = params.prefillKey;
    return Array.isArray(v) ? v[0] : v;
  }, [params.prefillKey]);

  const imageUri = useMemo(() => {
    const v = params.imageUri;
    return Array.isArray(v) ? v[0] : v;
  }, [params.imageUri]);

  if (!prefillKey) {
    return <CollectionDetailView prefillKey="" />;
  }

  return <CollectionDetailView prefillKey={prefillKey} imageUri={imageUri} />;
}
