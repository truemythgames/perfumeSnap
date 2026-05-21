import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SimilarPerfume, resolveListingUrl } from '../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const SIMILAR_GRID_PADDING = 16;
export const SIMILAR_GRID_GAP = 12;

export const SIMILAR_CARD_WIDTH = Math.floor(
  (SCREEN_WIDTH - SIMILAR_GRID_PADDING * 2 - SIMILAR_GRID_GAP) / 2,
);

/** Wide packshot → tall bottle — height = width × ratio (clamped) */
const MIN_IMAGE_RATIO = 0.68;
const MAX_IMAGE_RATIO = 1.62;
/** Serper thumbs are often square — use varied ratios so columns don't line up in rows */
const MASONRY_VARIED_RATIOS = [0.74, 1.38, 0.88, 1.22, 0.96, 1.48, 0.82, 1.3, 1.04, 1.16];

const CARD_BODY_HEIGHT = 46;

const CARD_BG = '#ebe3d4';
const IMAGE_BG = '#ffffff';

const MAJOR_RETAILER_BADGES: Record<string, string> = {
  amazon: 'Amazon',
  ebay: 'eBay',
  walmart: 'Walmart',
  sephora: 'Sephora',
  ulta: 'Ulta',
  target: 'Target',
  fragrancenet: 'FragranceNet',
  nordstrom: 'Nordstrom',
  macys: "Macy's",
};

export function getRetailerBadgeLabel(retailer?: string): string | null {
  if (!retailer) return null;
  const key = retailer.toLowerCase();
  for (const [match, label] of Object.entries(MAJOR_RETAILER_BADGES)) {
    if (key.includes(match)) return label;
  }
  return null;
}

export function getListingTitle(perfume: SimilarPerfume): string {
  const title = `${perfume.brand || ''} ${perfume.name || ''}`.trim();
  if (title) return title;
  if (perfume.retailer) return perfume.retailer;
  return 'Perfume listing';
}

function parseNumericPrice(raw?: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, '');
  const match = cleaned.match(/\$?\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function formatListingPrice(raw?: string): string | null {
  const value = parseNumericPrice(raw);
  if (value === null) return null;
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 100) / 100;
  return `$${rounded}*`;
}

function variedImageHeight(seed: number): number {
  const ratio = MASONRY_VARIED_RATIOS[Math.abs(seed) % MASONRY_VARIED_RATIOS.length];
  return Math.round(SIMILAR_CARD_WIDTH * ratio);
}

export function imageHeightFromAspect(imgW: number, imgH: number, seed = 0): number {
  if (imgW <= 0 || imgH <= 0) return variedImageHeight(seed);
  const ratio = imgH / imgW;
  if (ratio >= 0.88 && ratio <= 1.12) {
    return variedImageHeight(seed);
  }
  const clamped = Math.min(MAX_IMAGE_RATIO, Math.max(MIN_IMAGE_RATIO, ratio));
  return Math.round(SIMILAR_CARD_WIDTH * clamped);
}

function titleBlockHeight(title: string): number {
  return title.length > 34 ? 36 : 18;
}

/** Estimate total card height for masonry column balancing */
export function estimateMasonryCardHeight(perfume: SimilarPerfume, globalIndex: number): number {
  const title = getListingTitle(perfume);
  const seed = globalIndex + (perfume.imageUrl?.length || 0);
  return variedImageHeight(seed) + titleBlockHeight(title) + CARD_BODY_HEIGHT;
}

export function splitIntoMasonryColumns<T extends SimilarPerfume>(items: T[]): {
  left: Array<{ item: T; globalIndex: number }>;
  right: Array<{ item: T; globalIndex: number }>;
} {
  const left: Array<{ item: T; globalIndex: number }> = [];
  const right: Array<{ item: T; globalIndex: number }> = [];
  let leftHeight = 0;
  let rightHeight = 0;

  items.forEach((item, globalIndex) => {
    const h = estimateMasonryCardHeight(item, globalIndex) + SIMILAR_GRID_GAP;
    if (leftHeight <= rightHeight) {
      left.push({ item, globalIndex });
      leftHeight += h;
    } else {
      right.push({ item, globalIndex });
      rightHeight += h;
    }
  });

  return { left, right };
}

export function getSimilarCardHeight(): number {
  return Math.round(SIMILAR_CARD_WIDTH * 1.1) + CARD_BODY_HEIGHT;
}

type SimilarProductCardProps = {
  perfume: SimilarPerfume;
  variant?: 'horizontal' | 'masonry';
  masonryIndex?: number;
  onPress: () => void;
};

export default function SimilarProductCard({
  perfume,
  variant = 'masonry',
  masonryIndex = 0,
  onPress,
}: SimilarProductCardProps) {
  const [failed, setFailed] = useState(false);
  const [imageHeight, setImageHeight] = useState(() => variedImageHeight(masonryIndex));
  const imageUrl = perfume.imageUrl || null;
  const hasImage = Boolean(imageUrl) && !failed;
  const title = getListingTitle(perfume);
  const badge = getRetailerBadgeLabel(perfume.retailer);
  const isHorizontal = variant === 'horizontal';
  const hasLink = Boolean(resolveListingUrl(perfume));

  const applyAspect = useCallback((w: number, h: number) => {
    setImageHeight(imageHeightFromAspect(w, h, masonryIndex));
  }, [masonryIndex]);

  useEffect(() => {
    setFailed(false);
    setImageHeight(variedImageHeight(masonryIndex));
    if (!imageUrl) return;

    let cancelled = false;
    Image.getSize(
      imageUrl,
      (w, h) => {
        if (!cancelled) applyAspect(w, h);
      },
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [imageUrl, masonryIndex, applyAspect]);

  const handleImageLoad = useCallback(
    (e: { nativeEvent: { source: { width?: number; height?: number } } }) => {
      const { width, height } = e.nativeEvent.source;
      if (width && height) applyAspect(width, height);
    },
    [applyAspect],
  );

  if (!hasLink) return null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isHorizontal ? styles.cardHorizontal : styles.cardMasonry,
      ]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <View style={[styles.imageWrap, { height: imageHeight }]}>
        {!hasImage && (
          <View style={[styles.imageFallback, { height: imageHeight }]}>
            <Ionicons name="flask-outline" size={32} color="#b8953e" />
          </View>
        )}
        {hasImage ? (
          <Image
            source={{ uri: imageUrl! }}
            style={styles.cardImage}
            resizeMode="contain"
            onLoad={handleImageLoad}
            onError={() => setFailed(true)}
          />
        ) : null}
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function openListingUrl(perfume: SimilarPerfume): string | null {
  return resolveListingUrl(perfume);
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
  },
  cardHorizontal: {
    width: SIMILAR_CARD_WIDTH,
  },
  cardMasonry: {
    width: '100%',
    alignSelf: 'stretch',
  },
  imageWrap: {
    width: '100%',
    backgroundColor: IMAGE_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: IMAGE_BG,
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#9a7040',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  cardBody: {
    backgroundColor: CARD_BG,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  name: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: '#1a1612',
  },
});
