import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SimilarPerfume, getSimilarListings, buildShoppingUrl } from '../services/api';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import { trackScreenView, trackRetailerTap } from '../services/analytics';
import { getPremiumStatus } from '../services/access';

const BADGE_MAP: Record<string, string> = { amazon: 'Amazon', ebay: 'eBay', walmart: 'Walmart' };

function getBadgeLabel(retailer?: string): string | null {
  if (!retailer) return null;
  const key = retailer.toLowerCase();
  for (const [match, label] of Object.entries(BADGE_MAP)) {
    if (key.includes(match)) return label;
  }
  return null;
}

const CARD_IMAGE_HEIGHTS = [138, 156, 148, 166, 144, 160, 152, 170];

function getTitle(perfume: SimilarPerfume): string {
  const title = `${perfume.brand || ''} ${perfume.name || ''}`.trim();
  if (title) return title;
  if (perfume.retailer) return `${perfume.retailer} product listing`;
  return 'Perfume listing';
}

function PerfumeCard({ perfume, idx }: { perfume: SimilarPerfume; idx: number }) {
  const [failed, setFailed] = useState(false);
  const directUrl = perfume.productUrl || buildShoppingUrl(perfume.name, perfume.brand, perfume.retailer);
  const imageUrl = perfume.imageUrl || null;
  const hasImage = Boolean(imageUrl) && !failed;
  const title = getTitle(perfume);
  const imageHeight = CARD_IMAGE_HEIGHTS[idx % CARD_IMAGE_HEIGHTS.length];

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => {
        trackRetailerTap(perfume.retailer || 'unknown', title);
        WebBrowser.openBrowserAsync(directUrl, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
      }}
    >
      <View style={[styles.imageWrap, { height: imageHeight }]}>
        {!hasImage && (
          <View style={styles.imageFallback}>
            <Ionicons name="flask-outline" size={36} color="#b8953e" />
          </View>
        )}
        {hasImage ? (
          <Image
            source={{ uri: imageUrl! }}
            style={styles.cardImage}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        ) : null}
        {getBadgeLabel(perfume.retailer) ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{getBadgeLabel(perfume.retailer)}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SimilarScreen() {
  const params = useLocalSearchParams<{ name?: string; brand?: string }>();
  const insets = useSafeAreaInsets();

  const [perfumes, setPerfumes] = useState<SimilarPerfume[]>([]);
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
  }, [params.name, params.brand, premiumChecked, isPremium]);

  const left: SimilarPerfume[] = [];
  const right: SimilarPerfume[] = [];
  perfumes.forEach((p, i) => (i % 2 === 0 ? left : right).push(p));

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
              {left.map((p, i) => <PerfumeCard key={i * 2} perfume={p} idx={i * 2} />)}
            </View>
            <View style={styles.column}>
              {right.map((p, i) => <PerfumeCard key={i * 2 + 1} perfume={p} idx={i * 2 + 1} />)}
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  columns: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  column: {
    flex: 1,
    gap: Spacing.sm,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ede4d3',
  },
  imageWrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#e8dece',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#ab7f45',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 9,
    minHeight: 64,
  },
  name: {
    fontSize: 15,
    color: '#1f1b16',
    lineHeight: 20,
    fontWeight: '600',
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
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  unlockButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSizes.sm,
  },
});
