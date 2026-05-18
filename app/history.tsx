import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import { HistoryItem, getHistory, clearHistory } from '../services/history';

const PHOTO_WIDTH = 90;
const PHOTO_HEIGHT = PHOTO_WIDTH * 1.3;

function getPriceDisplay(item: HistoryItem): string | null {
  const range = item.perfume.priceRange;
  if (range && range.trim() && !/unknown|n\/a/i.test(range)) return range;
  return null;
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const data = await getHistory();
        if (active) {
          setItems(data);
          setLoading(false);
        }
      })();
      return () => { active = false; };
    }, []),
  );

  const handleClear = () => {
    Alert.alert(
      'Clear History',
      'This will delete all scan history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            setItems([]);
          },
        },
      ],
    );
  };

  const openDetail = (item: HistoryItem) => {
    if (item.imageUri) {
      Image.prefetch(item.imageUri).catch(() => {});
    }
    router.push({
      pathname: '/result',
      params: {
        imageUri: item.imageUri || '',
        fromCollection: '1',
        prefill: JSON.stringify({
          ...item.perfume,
          imageUri: item.imageUri,
        }),
      },
    });
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const p = item.perfume;
    const price = getPriceDisplay(item);
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
                  {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.photo} />
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan History</Text>
        {items.length > 0 ? (
          <TouchableOpacity onPress={handleClear} hitSlop={12}>
            <Ionicons name="trash-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {loading ? null : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No scan history yet</Text>
          <Text style={styles.emptySubtitle}>
            Your scanned perfumes will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
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
    borderBottomColor: Colors.border,
  },
  photoOuter: {
    width: PHOTO_WIDTH + 18 + 8,
    height: PHOTO_HEIGHT + 18 + 8,
    padding: 4,
    transform: [{ rotate: '-2deg' }],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
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
