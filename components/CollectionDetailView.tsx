import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import NoteChip from './NoteChip';
import ResultFeedbackSheet from './ResultFeedbackSheet';
import InfoRow from './InfoRow';
import SimilarCardSmall, { RESULT_SIMILAR_SECTION } from './SimilarCardSmall';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import { getSimilarListings, openSimilarListing, PerfumeResult, SimilarPerfume, hasValidSimilarListings, filterValidSimilarListings } from '../services/api';
import { getResultPrefill } from '../services/resultNavigationCache';
import { trackChatOpened, trackRetailerTap, trackScreenView, trackViewSimilar } from '../services/analytics';
import {
  computeLivePriceStats,
  formatPriceRange,
  splitCurrencyDisplay,
} from '../utils/perfumePricing';
import { formatPerfumeTitle } from '../utils/perfumeDisplay';
import { usePreferredCurrency } from '../hooks/usePreferredCurrency';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const RESULT_HERO_ZONE_HEIGHT = SCREEN_WIDTH * 0.9;
const RESULT_DETAIL_FRAME_W = SCREEN_WIDTH * 0.9;
const RESULT_DETAIL_FRAME_H = RESULT_DETAIL_FRAME_W * 1.3;

type Props = {
  prefillKey: string;
  imageUri?: string;
};

function perfumeToResult(
  p: PerfumeResult & { imageUri?: string | null; imageKey?: string | null },
): PerfumeResult {
  const { imageUri: _iu, imageKey: _ik, ...rest } = p as PerfumeResult & Record<string, unknown>;
  return rest as PerfumeResult;
}

export default function CollectionDetailView({ prefillKey, imageUri }: Props) {
  const insets = useSafeAreaInsets();
  const prefill = getResultPrefill(prefillKey);
  const invalid = !prefill;

  const result = useMemo(
    () => (prefill ? perfumeToResult(prefill) : null),
    [prefill],
  );

  const displayImageUri = imageUri || prefill?.imageUri || undefined;
  const [similarListings, setSimilarListings] = useState<SimilarPerfume[]>(
    () => filterValidSimilarListings(prefill?.cachedSimilarListings ?? []),
  );
  const [photoFullscreen, setPhotoFullscreen] = useState(false);
  const [feedbackMenuVisible, setFeedbackMenuVisible] = useState(false);
  const preferredCurrency = usePreferredCurrency();
  const fullscreenTranslateY = useSharedValue(0);
  const fullscreenOpacity = useSharedValue(0);

  useEffect(() => {
    queueMicrotask(() => trackScreenView('collection_detail'));
  }, []);

  useEffect(() => {
    if (!result) return;
    const cached = prefill?.cachedSimilarListings ?? similarListings;
    if (hasValidSimilarListings(cached)) return;
    getSimilarListings(result.name, result.brand).then((fresh) => {
      if (fresh.length > 0) setSimilarListings(filterValidSimilarListings(fresh));
    });
  }, [result?.name, result?.brand, prefill?.cachedSimilarListings]);

  const openPhotoFullscreen = useCallback(() => {
    fullscreenTranslateY.value = 0;
    fullscreenOpacity.value = 0;
    setPhotoFullscreen(true);
    fullscreenOpacity.value = withTiming(1, { duration: 200 });
  }, []);

  const closePhotoFullscreen = useCallback(() => {
    fullscreenOpacity.value = withTiming(0, { duration: 150 }, (finished) => {
      if (finished) runOnJS(setPhotoFullscreen)(false);
    });
  }, []);

  const fullscreenPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .maxPointers(1)
        .activeOffsetY([-8, 8])
        .onUpdate((e) => {
          fullscreenTranslateY.value = e.translationY;
        })
        .onEnd((e) => {
          const ty = e.translationY;
          const vy = e.velocityY;
          const dist = Math.abs(ty);
          const speed = Math.abs(vy);
          if (dist > 60 || speed > 400) {
            const direction = ty >= 0 ? 1 : -1;
            fullscreenTranslateY.value = withTiming(
              direction * SCREEN_HEIGHT,
              { duration: 180, easing: Easing.in(Easing.quad) },
              (finished) => {
                if (finished) runOnJS(closePhotoFullscreen)();
              },
            );
          } else {
            fullscreenTranslateY.value = withSpring(0, {
              velocity: vy,
              damping: 32,
              stiffness: 300,
              mass: 0.7,
              overshootClamping: true,
            });
          }
        }),
    [closePhotoFullscreen],
  );

  const fullscreenOverlayAnimStyle = useAnimatedStyle(() => ({
    opacity: fullscreenOpacity.value,
  }));

  const fullscreenBackdropAnimStyle = useAnimatedStyle(() => {
    const ty = fullscreenTranslateY.value;
    return {
      opacity: interpolate(
        Math.abs(ty),
        [0, SCREEN_HEIGHT * 0.4],
        [1, 0.15],
        Extrapolation.CLAMP,
      ),
    };
  });

  const fullscreenImageSlideStyle = useAnimatedStyle(() => {
    const ty = fullscreenTranslateY.value;
    const scl = interpolate(
      Math.abs(ty),
      [0, SCREEN_HEIGHT * 0.5],
      [1, 0.82],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateY: ty }, { scale: scl }],
    };
  });

  const livePriceStats = useMemo(
    () => computeLivePriceStats(similarListings, preferredCurrency),
    [similarListings, preferredCurrency],
  );

  const openAllSimilar = useCallback(() => {
    if (!result) return;
    trackViewSimilar(result.name);
    router.push({
      pathname: '/similar',
      params: {
        prefillKey,
        name: result.name,
        brand: result.brand,
      },
    });
  }, [result, prefillKey]);

  const openPerfumeChat = useCallback(() => {
    if (!result) return;
    trackChatOpened(`${result.brand} ${result.name}`);
    router.push({
      pathname: '/perfume-chat',
      params: {
        perfume: JSON.stringify({
          name: result.name,
          brand: result.brand,
          description: result.description,
          concentration: result.concentration,
          topNotes: result.topNotes,
          heartNotes: result.heartNotes,
          baseNotes: result.baseNotes,
          longevity: result.longevity,
          sillage: result.sillage,
          occasions: result.occasions,
          seasons: result.seasons,
          yearLaunched: result.yearLaunched,
          fragranceFamily: result.fragranceFamily,
          gender: result.gender,
        }),
      },
    });
  }, [result]);

  if (invalid || !result) {
    return (
      <View style={[styles.errorWrap, { paddingTop: insets.top }]}>
        <Text style={styles.errorTitle}>Could not open this item.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayedPrice = livePriceStats
    ? livePriceStats.display
    : formatPriceRange(result.priceRange, preferredCurrency);
  const splitPrice = splitCurrencyDisplay(displayedPrice);
  const perfumerValue = (result.perfumer || '').trim();
  const shouldShowPerfumer = Boolean(
    perfumerValue && !/^(unknown|n\/a|na|not known|unlisted)$/i.test(perfumerValue),
  );
  const scrollBottomPad = insets.bottom + 100;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
        bounces
        nestedScrollEnabled
      >
        <View style={styles.resultHeroWrap}>
          <Pressable
            disabled={!displayImageUri}
            onPress={() => displayImageUri && openPhotoFullscreen()}
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <View style={styles.resultHeroFrameOuter}>
              <LinearGradient
                colors={['#dcc07a', '#c4a060', '#8a6e30']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resultGoldFrameOuter}
              >
                <View style={styles.resultGoldFrameInset}>
                  <LinearGradient
                    colors={['#8a6e30', '#b8953e', '#dcc07a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.resultGoldFrameInner}
                  >
                    <View style={styles.resultPhotoClip}>
                      {displayImageUri ? (
                        <Image source={{ uri: displayImageUri }} style={styles.resultFrameImage} fadeDuration={0} />
                      ) : (
                        <View style={styles.resultFramePlaceholder}>
                          <Ionicons name="flask-outline" size={48} color={Colors.primary} />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              </LinearGradient>
            </View>
          </Pressable>
          <LinearGradient colors={[Colors.surface, 'transparent']} style={styles.resultHeroFadeTop} pointerEvents="none" />
          <LinearGradient
            colors={['transparent', Colors.background]}
            locations={[0.55, 1]}
            style={styles.resultHeroFadeBottom}
            pointerEvents="none"
          />
        </View>

        <View style={styles.mainInfo}>
          <Text style={styles.name}>{formatPerfumeTitle(result.name, result.brand)}</Text>
          {(livePriceStats || result.priceRange) && (
            <View style={styles.priceCard}>
              <LinearGradient
                colors={['#f5ead4', '#ece0c8', '#e3d5b8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.priceCardInner}
              >
                <View style={styles.priceCardAmountRow}>
                  {splitPrice.currency ? (
                    <Text style={styles.priceCardCurrency}>{splitPrice.currency}</Text>
                  ) : null}
                  <Text style={styles.priceCardAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                    {splitPrice.amount}
                  </Text>
                </View>
                <View style={styles.priceCardDivider} />
                <Text style={styles.priceCardGrading}>
                  Grading:{' '}
                  <Text style={styles.priceCardGradingValue}>
                    {result.rating >= 4.5 ? 'Excellent' : result.rating >= 3.5 ? 'Very Good' : result.rating >= 2.5 ? 'Good' : 'Fair'}
                  </Text>
                </Text>
              </LinearGradient>
            </View>
          )}
        </View>

        {similarListings.length > 0 && (
          <View style={[styles.similarSection, RESULT_SIMILAR_SECTION.section]}>
            <TouchableOpacity
              style={[styles.similarHeader, RESULT_SIMILAR_SECTION.header]}
              activeOpacity={0.7}
              onPress={openAllSimilar}
            >
              <Text style={styles.similarTitle}>Similar Perfumes</Text>
              <Text style={styles.similarChevron}>{'>'}</Text>
            </TouchableOpacity>
            <View style={[styles.similarDivider, RESULT_SIMILAR_SECTION.divider]} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.similarScroll, RESULT_SIMILAR_SECTION.scroll]}
              nestedScrollEnabled
              directionalLockEnabled
            >
              {similarListings.slice(0, 5).map((p, i) => (
                <SimilarCardSmall
                  key={i}
                  perfume={p}
                    onPress={() => {
                      const title = `${p.brand || ''} ${p.name || ''}`.trim();
                      trackRetailerTap(p.retailer || 'unknown', title);
                      void openSimilarListing(p);
                    }}
                />
              ))}
              {similarListings.length > 5 && (
                <TouchableOpacity
                  style={[styles.viewAllCard, RESULT_SIMILAR_SECTION.viewAll]}
                  activeOpacity={0.7}
                  onPress={openAllSimilar}
                >
                  <Ionicons name="arrow-forward-circle-outline" size={32} color={Colors.primary} />
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{result.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fragrance Notes</Text>
          <View style={styles.notesGroup}>
            <Text style={styles.notesLabel}>🌟 Top Notes</Text>
            <View style={styles.chipRow}>
              {result.topNotes.map((n, i) => (
                <NoteChip key={i} label={n} color={Colors.accent} />
              ))}
            </View>
          </View>
          <View style={styles.notesGroup}>
            <Text style={styles.notesLabel}>💜 Heart Notes</Text>
            <View style={styles.chipRow}>
              {result.heartNotes.map((n, i) => (
                <NoteChip key={i} label={n} color={Colors.primary} />
              ))}
            </View>
          </View>
          <View style={styles.notesGroup}>
            <Text style={styles.notesLabel}>🌲 Base Notes</Text>
            <View style={styles.chipRow}>
              {result.baseNotes.map((n, i) => (
                <NoteChip key={i} label={n} color={Colors.gold} />
              ))}
            </View>
          </View>
        </View>

        {result.accords && result.accords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scent Profile</Text>
            <View style={styles.card}>
              {result.accords.slice(0, 8).map((accord, i) => (
                <View key={i} style={styles.accordRow}>
                  <Text style={styles.accordLabel}>{accord.name}</Text>
                  <View style={styles.accordTrack}>
                    <View style={[styles.accordFill, { width: `${Math.max(4, accord.strength)}%` }]} />
                  </View>
                  <Text style={styles.accordPercent}>{accord.strength}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.card}>
            <View style={styles.perfRow}>
              <Text style={styles.perfLabel}>⏱️ Longevity</Text>
              <Text style={styles.perfValue}>{result.longevity}</Text>
            </View>
            {result.longevityScore != null && (
              <View style={styles.perfGaugeWrap}>
                <View style={styles.perfGaugeTrack}>
                  <View style={[styles.perfGaugeFill, { width: `${result.longevityScore * 10}%` }]} />
                </View>
                <Text style={styles.perfGaugeLabel}>{result.longevityScore}/10</Text>
              </View>
            )}
            <View style={[styles.perfRow, { marginTop: Spacing.md }]}>
              <Text style={styles.perfLabel}>💨 Sillage</Text>
              <Text style={styles.perfValue}>{result.sillage}</Text>
            </View>
            {result.sillageScore != null && (
              <View style={styles.perfGaugeWrap}>
                <View style={styles.perfGaugeTrack}>
                  <View style={[styles.perfGaugeFill, styles.perfGaugeFillSillage, { width: `${result.sillageScore * 10}%` }]} />
                </View>
                <Text style={styles.perfGaugeLabel}>{result.sillageScore}/10</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            <InfoRow icon="💧" label="Concentration" value={result.concentration} />
            <InfoRow icon="🌿" label="Family" value={result.fragranceFamily} />
            <InfoRow icon="⚥" label="Gender" value={result.gender} />
            <InfoRow icon="📅" label="Year" value={result.yearLaunched} />
            {shouldShowPerfumer ? <InfoRow icon="👃" label="Perfumer" value={perfumerValue} /> : null}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.askPerfumeButton} activeOpacity={0.85} onPress={openPerfumeChat}>
            <LinearGradient
              colors={['#3c2d1a', '#2a1f0e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.askPerfumeGradient}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#f5ead4" />
              <Text style={styles.askPerfumeText}>Ask about this Perfume</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.resultBackRow, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFeedbackMenuVisible(true);
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={feedbackMenuVisible}
        transparent
        animationType="none"
        onRequestClose={() => setFeedbackMenuVisible(false)}
      >
        {result ? (
          <ResultFeedbackSheet
            visible={feedbackMenuVisible}
            perfumeName={result.name}
            perfumeBrand={result.brand}
            onClose={() => setFeedbackMenuVisible(false)}
          />
        ) : null}
      </Modal>

      <View style={[styles.footerBar, { paddingBottom: insets.bottom || Spacing.md }]}>
        <TouchableOpacity
          style={styles.addCollectionButton}
          activeOpacity={0.85}
          onPress={() => router.replace('/camera')}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addCollectionGradient}
          >
            <Ionicons name="scan-outline" size={22} color="#fff" />
            <Text style={styles.addCollectionText}>Identify</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.fullscreenOverlay, fullscreenOverlayAnimStyle]}
        pointerEvents={photoFullscreen ? 'auto' : 'none'}
      >
        <GestureHandlerRootView style={StyleSheet.absoluteFill}>
          <Animated.View
            pointerEvents="none"
            style={[styles.fullscreenBackdropFill, fullscreenBackdropAnimStyle]}
          />
          {photoFullscreen && (
            <Pressable style={StyleSheet.absoluteFill} onPress={closePhotoFullscreen} />
          )}
          <GestureDetector gesture={fullscreenPanGesture}>
            <Animated.View
              style={[styles.fullscreenPanArea, fullscreenImageSlideStyle]}
              pointerEvents="box-none"
              collapsable={false}
            >
              {displayImageUri ? (
                <Image
                  source={{ uri: displayImageUri }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                  fadeDuration={0}
                />
              ) : null}
            </Animated.View>
          </GestureDetector>
          {photoFullscreen && (
            <Pressable
              style={[styles.fullscreenClose, { top: insets.top + Spacing.sm }]}
              onPress={closePhotoFullscreen}
            >
              <View style={styles.fullscreenCloseCircle}>
                <Ionicons name="close" size={24} color="#fff" />
              </View>
            </Pressable>
          )}
        </GestureHandlerRootView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: {},
  errorWrap: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  errorTitle: { fontSize: FontSizes.lg, color: Colors.text, marginBottom: Spacing.lg },
  errorBack: { padding: Spacing.md },
  errorBackText: { color: Colors.primary, fontWeight: '700' },
  resultHeroWrap: {
    width: SCREEN_WIDTH,
    height: RESULT_HERO_ZONE_HEIGHT,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
    marginBottom: Spacing.sm,
  },
  resultHeroFrameOuter: {
    padding: 4,
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 6 },
        shadowOpacity: 0.42,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
  resultGoldFrameOuter: { width: RESULT_DETAIL_FRAME_W, height: RESULT_DETAIL_FRAME_H, borderRadius: 8, padding: 3 },
  resultGoldFrameInset: { flex: 1, borderRadius: 5, backgroundColor: '#0c0a08', padding: 1.5 },
  resultGoldFrameInner: { flex: 1, borderRadius: 4, padding: 2.5 },
  resultPhotoClip: { flex: 1, borderRadius: 3, overflow: 'hidden', backgroundColor: Colors.surface },
  resultFrameImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  resultFramePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  resultHeroFadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  resultHeroFadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 48 },
  resultBackRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainInfo: { paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
  name: { fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.text, marginTop: Spacing.xs },
  priceCard: {
    marginTop: Spacing.lg,
    alignSelf: 'center',
    width: '85%',
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: '#c8943c60',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  priceCardInner: { borderRadius: BorderRadius.md - 2, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md, alignItems: 'center' },
  priceCardAmountRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 2, width: '100%' },
  priceCardCurrency: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  priceCardAmount: { fontSize: 34, fontWeight: '800', color: '#2a1f0e', textAlign: 'center' },
  priceCardDivider: { width: '60%', height: 1, backgroundColor: '#c8943c50', marginVertical: Spacing.sm + 2 },
  priceCardGrading: { fontSize: FontSizes.md, color: '#5a4a32', fontWeight: '500' },
  priceCardGradingValue: { fontWeight: '800', color: '#2a1f0e' },
  similarSection: {},
  similarHeader: {},
  similarTitle: { fontSize: FontSizes.xl + 2, fontWeight: '800', color: Colors.text },
  similarChevron: { fontSize: FontSizes.xl, fontWeight: '400', color: Colors.textMuted },
  similarDivider: {},
  similarScroll: {},
  viewAllCard: {},
  viewAllText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.primary },
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  sectionTitle: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.md },
  description: { fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 24 },
  notesGroup: { marginBottom: Spacing.md },
  notesLabel: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border + '40',
  },
  accordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  accordLabel: { width: 75, color: Colors.textSecondary, fontSize: FontSizes.xs, fontWeight: '600' },
  accordTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: Spacing.sm, overflow: 'hidden' },
  accordFill: { height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  accordPercent: { width: 36, textAlign: 'right', color: Colors.textSecondary, fontSize: FontSizes.xs, fontWeight: '700' },
  perfRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  perfLabel: { color: Colors.text, fontSize: FontSizes.sm, fontWeight: '600' },
  perfValue: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  perfGaugeWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: Spacing.sm },
  perfGaugeTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  perfGaugeFill: { height: 6, borderRadius: 3, backgroundColor: '#8bb97a' },
  perfGaugeFillSillage: { backgroundColor: '#7a9bb9' },
  perfGaugeLabel: { color: Colors.textSecondary, fontSize: FontSizes.xs, fontWeight: '700', width: 30, textAlign: 'right' },
  askPerfumeButton: { borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(200,148,60,0.35)', overflow: 'hidden' },
  askPerfumeGradient: {
    minHeight: 42,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  askPerfumeText: { color: '#f5ead4', fontSize: FontSizes.md, fontWeight: '700' },
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(200,148,60,0.2)',
    zIndex: 3,
  },
  addCollectionButton: { flex: 1, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  addCollectionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
  },
  addCollectionText: { color: '#fff', fontSize: FontSizes.md, fontWeight: '700' },
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenBackdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  fullscreenPanArea: {
    flex: 1,
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  fullscreenClose: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 10,
  },
  fullscreenCloseCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
