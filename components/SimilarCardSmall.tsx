import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SimilarPerfume, resolveListingUrl } from '../services/api';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import { getRetailerBadgeLabel } from './SimilarProductCard';

type Props = {
  perfume: SimilarPerfume;
  onPress: () => void;
};

export default function SimilarCardSmall({ perfume, onPress }: Props) {
  const [failed, setFailed] = useState(false);
  const imageUrl = perfume.imageUrl || null;
  const hasImage = Boolean(imageUrl) && !failed;
  const badge = getRetailerBadgeLabel(perfume.retailer);
  const hasLink = Boolean(resolveListingUrl(perfume));

  if (!hasLink) return null;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.imageWrap}>
        {!hasImage && (
          <View style={styles.imageFallback}>
            <Ionicons name="flask-outline" size={40} color="#b8953e" />
          </View>
        )}
        {hasImage ? (
          <Image
            source={{ uri: imageUrl! }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        ) : null}
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.checkSite}>Check Site</Text>
      <Text style={styles.name} numberOfLines={2}>
        {perfume.brand} {perfume.name}
      </Text>
    </TouchableOpacity>
  );
}

export const RESULT_SIMILAR_SECTION = {
  section: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingLeft: Spacing.lg,
  } as const,
  header: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(200,148,60,0.2)',
    marginRight: Spacing.lg,
    marginBottom: Spacing.lg,
  } as const,
  scroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  } as const,
  viewAll: {
    width: 90,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
  },
};

const styles = StyleSheet.create({
  card: {
    width: 140,
  },
  imageWrap: {
    width: 140,
    height: 150,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#e8dece',
    marginBottom: Spacing.sm,
  },
  image: {
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
    top: 8,
    right: 8,
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
  checkSite: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    fontStyle: 'italic',
    color: Colors.textSecondary,
  },
  name: {
    fontSize: FontSizes.xs,
    color: Colors.text,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 15,
  },
});
