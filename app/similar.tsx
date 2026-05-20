import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getSimilarListings } from '../services/api';
import { getResultPrefill } from '../services/resultNavigationCache';
import { Colors, FontSizes, Spacing } from '../constants/theme';
import { trackScreenView, trackRetailerTap } from '../services/analytics';
import { getPremiumStatus } from '../services/access';
import SimilarProductCard, {
  getListingTitle,
  openListingUrl,
  splitIntoMasonryColumns,
  SIMILAR_GRID_PADDING,
  SIMILAR_GRID_GAP,
} from '../components/SimilarProductCard';

export default function SimilarScreen() {
  const params = useLocalSearchParams<{ name?: string; brand?: string; prefillKey?: string }>();
  const prefillKey = Array.isArray(params.prefillKey) ? params.prefillKey[0] : params.prefillKey;
  const insets = useSafeAreaInsets();

  const [perfumes, setPerfumes] = useState<Awaited<ReturnType<typeof getSimilarListings>>>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumChecked, setPremiumChecked] = useState(false);

  useEffect(() => {
    trackScreenView('similar');
    getPremiumStatus().then(setIsPremium).finally(() => setPremiumChecked(true));
  }, []);

  useEffect(() => {
    if (!premiumChecked) return;
    if (!isPremium) {
      setLoading(false);
      return;
    }

    if (prefillKey) {
      const cached = getResultPrefill(prefillKey)?.cachedSimilarListings ?? [];
      setPerfumes(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    const name = params.name;
    const brand = params.brand || '';

    if (!name) {
      setLoading(false);
      return;
    }

    getSimilarListings(name, brand).then((results) => {
      setPerfumes(results);
      setLoading(false);
    });
  }, [params.name, params.brand, prefillKey, premiumChecked, isPremium]);

  const { left, right } = splitIntoMasonryColumns(perfumes);

  const openListing = (perfume: (typeof perfumes)[0]) => {
    const title = getListingTitle(perfume);
    trackRetailerTap(perfume.retailer || 'unknown', title);
    WebBrowser.openBrowserAsync(openListingUrl(perfume), {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Similar Perfumes</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.text} />
        </View>
      ) : premiumChecked && !isPremium ? (
        <View style={styles.lockedWrap}>
          <Ionicons name="lock-closed-outline" size={34} color={Colors.primary} />
          <Text style={styles.lockedTitle}>Similar Perfumes is Premium</Text>
          <Text style={styles.lockedText}>
            Unlock premium to browse similar fragrances and direct listings.
          </Text>
          <TouchableOpacity style={styles.unlockButton} onPress={() => router.push('/sales')}>
            <Text style={styles.unlockButtonText}>Unlock Premium</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.masonry}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.columns}>
            <View style={styles.column}>
              {left.map(({ item, globalIndex }) => (
                <SimilarProductCard
                  key={`l-${globalIndex}`}
                  perfume={item}
                  variant="masonry"
                  masonryIndex={globalIndex}
                  onPress={() => openListing(item)}
                />
              ))}
            </View>
            <View style={styles.column}>
              {right.map(({ item, globalIndex }) => (
                <SimilarProductCard
                  key={`r-${globalIndex}`}
                  perfume={item}
                  variant="masonry"
                  masonryIndex={globalIndex}
                  onPress={() => openListing(item)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  masonry: {
    paddingHorizontal: SIMILAR_GRID_PADDING,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  columns: {
    flexDirection: 'row',
    gap: SIMILAR_GRID_GAP,
  },
  column: {
    flex: 1,
    gap: SIMILAR_GRID_GAP,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  lockedTitle: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  lockedText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  unlockButton: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  unlockButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSizes.sm,
  },
});
