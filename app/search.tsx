import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import { CollectionItem, getCollection } from '../services/api';

const PHOTO_WIDTH = 90;
const PHOTO_HEIGHT = PHOTO_WIDTH * 1.3;

function parseNumericPrice(raw?: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, '');
  const match = cleaned.match(/\$?\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function isLikelySampleOrDecant(name?: string, brand?: string): boolean {
  const text = `${name || ''} ${brand || ''}`.toLowerCase();
  return /(decant|sample|vial|travel|mini|tester)/.test(text);
}

function computePriceDisplay(item: CollectionItem): string | null {
  const listings = item.perfume.cachedSimilarListings || [];
  const prices = listings
    .filter((l) => !isLikelySampleOrDecant(l.name, l.brand))
    .map((l) => parseNumericPrice(l.estimatedPrice))
    .filter((v): v is number => v !== null && v >= 10)
    .sort((a, b) => a - b);
  if (prices.length === 0) return null;
  let bounded = prices;
  if (bounded.length >= 5) {
    bounded = bounded.slice(
      Math.floor(bounded.length * 0.2),
      Math.ceil(bounded.length * 0.8),
    );
  }
  const median = bounded[Math.floor(bounded.length / 2)];
  const inBand = bounded.filter((v) => v >= median * 0.6 && v <= median * 1.8);
  if (inBand.length >= 2) bounded = inBand;
  const min = bounded[0];
  const max = bounded[bounded.length - 1];
  return min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} - $${max.toFixed(2)}`;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [allItems, setAllItems] = useState<CollectionItem[]>([]);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const page = await getCollection({ limit: 500 });
        if (active) setAllItems(page.items);
      })();
      return () => { active = false; };
    }, []),
  );

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const filtered = query.trim()
    ? allItems.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.perfume.name.toLowerCase().includes(q) ||
          item.perfume.brand.toLowerCase().includes(q)
        );
      })
    : allItems;

  const openDetail = (item: CollectionItem) => {
    if (item.perfume.imageUri) {
      Image.prefetch(item.perfume.imageUri).catch(() => {});
    }
    router.push({
      pathname: '/result',
      params: {
        fromCollection: '1',
        prefill: JSON.stringify(item.perfume),
        ...(item.perfume.imageUri ? { imageUri: item.perfume.imageUri } : {}),
      },
    });
  };

  const renderItem = ({ item }: { item: CollectionItem }) => {
    const p = item.perfume;
    const price = computePriceDisplay(item);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => openDetail(item)}
      >
        <View style={styles.photoOuter}>
          <LinearGradient
            colors={['#dcc07a', '#c4a060', '#8a6e30']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.photoFrame}
          >
            <View style={styles.photoFrameInset}>
              <LinearGradient
                colors={['#8a6e30', '#b8953e', '#dcc07a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.photoFrameInner}
              >
                <View style={styles.photoClip}>
                  {p.imageUri ? (
                    <Image source={{ uri: p.imageUri }} style={styles.photo} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="flask-outline" size={32} color={Colors.primary} />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{p.name}</Text>
          <Text style={styles.cardBrand} numberOfLines={1}>{p.brand}</Text>
          {price ? (
            <Text style={styles.cardPrice}>{price}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search collection..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {filtered.length === 0 && query.trim().length > 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptySubtitle}>
            No perfumes matching "{query}"
          </Text>
        </View>
      ) : (
        <FlatList
          onScrollBeginDrag={Keyboard.dismiss}
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 42,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    padding: 0,
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border + '50',
  },
  photoOuter: {
    width: PHOTO_WIDTH + 18 + 8,
    height: PHOTO_HEIGHT + 18 + 8,
    padding: 4,
    transform: [{ rotate: '-2deg' }],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  photoFrame: {
    flex: 1,
    borderRadius: 6,
    padding: 3,
  },
  photoFrameInset: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: '#0c0a08',
    padding: 1.5,
  },
  photoFrameInner: {
    flex: 1,
    borderRadius: 3,
    padding: 2.5,
  },
  photoClip: {
    flex: 1,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  cardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  cardBrand: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardPrice: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.gold,
    marginTop: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
