import React, { useCallback, useEffect, useImperativeHandle, forwardRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import { CollectionItem, getCollection, deleteFromCollection } from '../services/api';

const EDIT_ANIM_DURATION = 280;
const CHECKBOX_ICON = 26;
const CHECKBOX_WIDTH = CHECKBOX_ICON + Math.round(Spacing.lg * 0.6);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_WIDTH = 90;
const PHOTO_HEIGHT = PHOTO_WIDTH * 1.3;

function parsePriceValue(range: string | undefined): number {
  if (!range) return 0;
  const nums = range.match(/[\d]+(?:[.,]\d+)?/g);
  if (!nums || nums.length === 0) return 0;
  const values = nums.map((n) => parseFloat(n.replace(',', '.')));
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export interface CollectionTabHandle {
  deleteSelected: () => void;
}

interface CollectionTabProps {
  onEditStateChange?: (state: { editing: boolean; selectedCount: number }) => void;
}

const CollectionTab = forwardRef<CollectionTabHandle, CollectionTabProps>(
  ({ onEditStateChange }, ref) => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const page = await getCollection({ limit: 20 });
      setItems(page.items);
      setNextCursor(page.nextCursor);
    } catch (err: any) {
      setError(err?.message || 'Failed to load collection');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getCollection({ cursor: nextCursor, limit: 20 });
      setItems((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  useEffect(() => { load(true); }, [load]);

  useFocusEffect(useCallback(() => { load(false); }, [load]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(false);
  }, [load]);

  const handleRemove = useCallback((id: string) => {
    Alert.alert('Remove', 'Remove this item from your collection?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setItems((prev) => prev.filter((it) => it.id !== id));
          try { await deleteFromCollection(id); } catch { load(false); }
        },
      },
    ]);
  }, [load]);

  const animateLayout = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: EDIT_ANIM_DURATION,
      update: { type: LayoutAnimation.Types.easeOut },
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    animateLayout();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, [animateLayout]);

  const selectAll = useCallback(() => {
    animateLayout();
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((it) => it.id)));
    }
  }, [items, selectedIds.size, animateLayout]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      'Delete',
      `Remove ${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''} from your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ids = Array.from(selectedIds);
            animateLayout();
            setItems((prev) => prev.filter((it) => !selectedIds.has(it.id)));
            setSelectedIds(new Set());
            setEditing(false);
            for (const id of ids) {
              try { await deleteFromCollection(id); } catch {}
            }
          },
        },
      ],
    );
  }, [selectedIds, animateLayout]);

  const enterEditing = useCallback(() => {
    animateLayout();
    setEditing(true);
  }, [animateLayout]);

  const cancelEditing = useCallback(() => {
    animateLayout();
    setEditing(false);
    setSelectedIds(new Set());
  }, [animateLayout]);

  useImperativeHandle(ref, () => ({
    deleteSelected: handleDeleteSelected,
  }), [handleDeleteSelected]);

  useEffect(() => {
    onEditStateChange?.({ editing, selectedCount: selectedIds.size });
  }, [editing, selectedIds.size]);

  const checkboxProgress = useSharedValue(0);

  useEffect(() => {
    checkboxProgress.value = withTiming(editing ? 1 : 0, {
      duration: EDIT_ANIM_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [editing]);

  const checkboxAnimStyle = useAnimatedStyle(() => ({
    width: checkboxProgress.value * CHECKBOX_WIDTH,
    opacity: checkboxProgress.value,
  }));

  const stats = useMemo(() => {
    const brands = new Set(items.map((it) => it.perfume.brand).filter(Boolean));
    const totalValue = items.reduce((sum, it) => sum + parsePriceValue(it.perfume.priceRange), 0);
    return { count: items.length, brands: brands.size, totalValue: Math.round(totalValue) };
  }, [items]);

  const renderHeader = () => {
    if (items.length === 0) return null;
    return (
      <View style={styles.statsSection}>
        {/* Collection Value */}
        <View style={styles.valueWrap}>
          <Text style={styles.valueCurrency}>$</Text>
          <Text style={styles.valueAmount}>{stats.totalValue.toLocaleString()}</Text>
        </View>
        <Text style={styles.valueLabel}>Estimated Collection Value</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.count}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.brands}</Text>
            <Text style={styles.statLabel}>Brands</Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* Toolbar */}
        {editing ? (
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.selectAllBtn} onPress={selectAll}>
              <Ionicons
                name={selectedIds.size === items.length ? 'checkbox' : 'square-outline'}
                size={CHECKBOX_ICON}
                color={Colors.primary}
              />
              <Text style={styles.toolBtnTextActive}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelEditing}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.toolbar}>
            <View style={styles.toolLeft}>
              <TouchableOpacity style={styles.toolBtn}>
                <Ionicons name="filter-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.toolBtnText}>Filter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolBtn}>
                <Ionicons name="swap-vertical-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.toolBtnText}>Sort</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={enterEditing}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="list-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderItem = ({ item }: { item: CollectionItem }) => {
    const p = item.perfume;
    const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
    });
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onLongPress={() => handleRemove(item.id)}
        onPress={editing ? () => toggleSelect(item.id) : undefined}
      >
        <Animated.View style={[styles.checkboxWrap, checkboxAnimStyle]}>
          <Ionicons
            name={selectedIds.has(item.id) ? 'checkbox' : 'square-outline'}
            size={CHECKBOX_ICON}
            color={selectedIds.has(item.id) ? Colors.primary : Colors.textMuted}
          />
        </Animated.View>
        {/* Photo with golden frame + tilt */}
        <View style={styles.photoOuter}>
          <View style={styles.photoFrame}>
            <View style={styles.photoInner}>
              {p.imageUri ? (
                <Image source={{ uri: p.imageUri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="flask-outline" size={32} color={Colors.primary} />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{p.name}</Text>
          <Text style={styles.cardBrand} numberOfLines={1}>{p.brand}</Text>
          {p.priceRange ? (
            <Text style={styles.cardPrice}>{p.priceRange}</Text>
          ) : null}
          <Text style={styles.cardDate}>{dateStr}</Text>
        </View>

      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={[Colors.background, '#12100c', Colors.background]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My Collection</Text>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Ionicons name="cloud-offline-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.errorTitle}>Couldn't load</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => load(true)}>
              <Text style={styles.retryBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="albums-outline" size={56} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No perfumes yet</Text>
            <Text style={styles.emptyText}>
              Snap a photo of a perfume bottle to start{'\n'}building your collection
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
              />
            }
            onEndReachedThreshold={0.5}
            onEndReached={loadMore}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: Spacing.lg }}>
                  <ActivityIndicator color={Colors.primary} />
                </View>
              ) : null
            }
          />
        )}

      </SafeAreaView>

    </LinearGradient>
  );
});

export default CollectionTab;

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },

  // Stats hero
  statsSection: {
    marginBottom: Spacing.md,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 2,
  },
  valueCurrency: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 6,
  },
  valueAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -2,
  },
  valueLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: -2,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  statItem: {},
  statNumber: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: -2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(200,148,60,0.15)',
    marginTop: Spacing.lg,
  },

  // List
  listContent: {
    paddingBottom: 120,
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    minHeight: 36,
  },
  toolLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toolBtnTextActive: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cancelText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
    overflow: 'hidden',
  },

  // Checkbox
  checkboxWrap: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border + '50',
  },
  photoOuter: {
    width: PHOTO_WIDTH + 16,
    height: PHOTO_HEIGHT + 16,
    transform: [{ rotate: '-2deg' }],
  },
  photoFrame: {
    width: PHOTO_WIDTH + 16,
    height: PHOTO_HEIGHT + 16,
    borderRadius: 6,
    backgroundColor: '#c4a060',
    padding: 5,
    borderWidth: 1,
    borderTopColor: '#dcc07a',
    borderLeftColor: '#d4b46e',
    borderRightColor: '#a88540',
    borderBottomColor: '#8a6e30',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
    }),
  },
  photoInner: {
    flex: 1,
    borderRadius: 3,
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
  cardDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // States
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border + '40',
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  retryBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },

});
