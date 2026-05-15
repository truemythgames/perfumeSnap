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
  Platform,
  Alert,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import { CollectionItem, getCollection, deleteFromCollection } from '../services/api';

const EDIT_ANIM_DURATION = 280;
const CHECKBOX_ICON = 26;
const CHECKBOX_WIDTH = CHECKBOX_ICON + Math.round(Spacing.lg * 0.6);

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
  if (/(decant|sample|vial|travel|mini|tester)/.test(text)) return true;

  const mlMatch = text.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  if (mlMatch) {
    const ml = Number(mlMatch[1]);
    if (Number.isFinite(ml) && ml > 0 && ml <= 15) return true;
  }
  const ozMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:fl\s*)?oz\b/);
  if (ozMatch) {
    const oz = Number(ozMatch[1]);
    if (Number.isFinite(oz) && oz > 0 && oz <= 0.5) return true;
  }
  return false;
}

function computeLivePriceDisplay(item: CollectionItem): { display: string; midpoint: number } | null {
  const listings = item.perfume.cachedSimilarListings || [];
  const prices = listings
    .filter((l) => !isLikelySampleOrDecant(l.name, l.brand))
    .map((l) => parseNumericPrice(l.estimatedPrice))
    .filter((v): v is number => v !== null)
    .filter((v) => v >= 10)
    .sort((a, b) => a - b);

  if (prices.length === 0) return null;

  let bounded = prices;
  if (bounded.length >= 5) {
    const from = Math.floor(bounded.length * 0.2);
    const to = Math.ceil(bounded.length * 0.8);
    bounded = bounded.slice(from, to);
  }

  const median = bounded[Math.floor(bounded.length / 2)];
  const inBand = bounded.filter((v) => v >= median * 0.6 && v <= median * 1.8);
  if (inBand.length >= 2) bounded = inBand;

  const min = bounded[0];
  const max = bounded[bounded.length - 1];
  const midpoint = (min + max) / 2;
  const display = min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} - $${max.toFixed(2)}`;
  return { display, midpoint };
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
  const ICON_BAR_HEIGHT = insets.top + 48;
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
    const midpoints = items
      .map((it) => computeLivePriceDisplay(it)?.midpoint ?? null)
      .filter((v): v is number => v !== null);
    const totalValue = midpoints.reduce((sum, v) => sum + v, 0);
    return { count: items.length, brands: brands.size, totalValue };
  }, [items]);

  const scrollY = useSharedValue(-ICON_BAR_HEIGHT);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const heroBlurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [-ICON_BAR_HEIGHT, -ICON_BAR_HEIGHT + 36],
      [0, 1],
      'clamp',
    ),
  }));

  const renderToolbar = () => (
    editing ? (
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
    )
  );

  const renderHero = () => (
    <View style={styles.statsSection}>
      <View style={styles.valueWrap}>
        <Text style={styles.valueCurrency}>$</Text>
        <Text style={styles.valueAmount}>
          {stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>

      <View style={styles.valueLabelWrap}>
        <Text style={styles.valueLabel}>Estimated Collection Value</Text>
      </View>

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
    </View>
  );

  type ToolbarRow = { __toolbar: true };
  type ListRow = ToolbarRow | CollectionItem;
  const TOOLBAR_ROW: ToolbarRow = { __toolbar: true };

  const listData = useMemo<ListRow[]>(
    () => (items.length > 0 ? [TOOLBAR_ROW, ...items] : []),
    [items],
  );

  const isToolbarRow = (row: ListRow): row is ToolbarRow => '__toolbar' in row;

  const openCollectionDetail = useCallback((item: CollectionItem) => {
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
  }, []);

  const renderItem = ({ item }: { item: ListRow }) => {
    if (isToolbarRow(item)) {
      return (
        <View style={styles.stickyToolbar}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.iconBarFill, heroBlurStyle]} pointerEvents="none" />
          {renderToolbar()}
        </View>
      );
    }
    const p = item.perfume;
    const livePrice = computeLivePriceDisplay(item);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onLongPress={() => handleRemove(item.id)}
        onPress={() => (editing ? toggleSelect(item.id) : openCollectionDetail(item))}
      >
        <Animated.View style={[styles.checkboxWrap, checkboxAnimStyle]}>
          <Ionicons
            name={selectedIds.has(item.id) ? 'checkbox' : 'square-outline'}
            size={CHECKBOX_ICON}
            color={selectedIds.has(item.id) ? Colors.primary : Colors.textMuted}
          />
        </Animated.View>
        {/* Photo with beveled golden frame */}
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

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{p.name}</Text>
          <Text style={styles.cardBrand} numberOfLines={1}>{p.brand}</Text>
          {livePrice ? (
            <Text style={styles.cardPrice}>{livePrice.display}</Text>
          ) : null}
        </View>

      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={[Colors.background, '#12100c', Colors.background]}
      style={styles.gradient}
    >
      <View style={styles.container}>
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
          <>
            <Animated.FlatList
              data={listData}
              keyExtractor={(it) => (isToolbarRow(it) ? 'toolbar' : it.id)}
              renderItem={renderItem}
              ListHeaderComponent={renderHero}
              stickyHeaderIndices={[1]}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onScroll={scrollHandler}
              contentInset={Platform.OS === 'ios' ? { top: ICON_BAR_HEIGHT } : undefined}
              contentOffset={Platform.OS === 'ios' ? { x: 0, y: -ICON_BAR_HEIGHT } : undefined}
              scrollIndicatorInsets={Platform.OS === 'ios' ? { top: ICON_BAR_HEIGHT } : undefined}
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={Colors.primary}
                  progressViewOffset={ICON_BAR_HEIGHT}
                />
              }
              onEndReachedThreshold={0.5}
              onEndReached={loadMore}
              scrollEventThrottle={16}
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ paddingVertical: Spacing.lg }}>
                    <ActivityIndicator color={Colors.primary} />
                  </View>
                ) : null
              }
            />

            {/* Icon bar — transparent at rest, solid color when scrolled */}
            <View style={[styles.fixedHeader, { paddingTop: insets.top, height: ICON_BAR_HEIGHT }]}>
              <Animated.View style={[StyleSheet.absoluteFill, styles.iconBarFill, heroBlurStyle]} pointerEvents="none" />
              <View style={styles.headerIcons}>
                <TouchableOpacity hitSlop={8}><Ionicons name="search-outline" size={22} color={Colors.text} /></TouchableOpacity>
                <TouchableOpacity hitSlop={8}><Ionicons name="share-outline" size={22} color={Colors.text} /></TouchableOpacity>
                <TouchableOpacity hitSlop={8}><Ionicons name="time-outline" size={22} color={Colors.text} /></TouchableOpacity>
                <TouchableOpacity hitSlop={8}><Ionicons name="ellipsis-horizontal" size={22} color={Colors.text} /></TouchableOpacity>
              </View>
            </View>
          </>
        )}

      </View>

    </LinearGradient>
  );
});

export default CollectionTab;

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.md,
    paddingBottom: Spacing.sm,
    zIndex: 100,
  },
  iconBarFill: {
    backgroundColor: '#12100c',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },

  // Stats hero
  statsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 2,
    alignSelf: 'flex-start',
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
  valueLabelWrap: {
    alignSelf: 'flex-start',
    marginTop: -2,
    marginBottom: Spacing.lg,
  },
  valueLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
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

  stickyToolbar: {
    paddingTop: 6,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
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
