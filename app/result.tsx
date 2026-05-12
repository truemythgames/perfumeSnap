import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { identifyPerfume, getApiUrl, PerfumeResult } from '../services/api';
import NoteChip from '../components/NoteChip';
import InfoRow from '../components/InfoRow';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STEPS = [
  { label: 'Processing image', icon: 'image-outline' as const },
  { label: 'Analyzing details and labels', icon: 'search-outline' as const },
  { label: 'Searching global records', icon: 'globe-outline' as const },
  { label: 'Getting your estimate', icon: 'pricetag-outline' as const },
];

const FRAME_WIDTH = SCREEN_WIDTH * 0.54;
const FRAME_HEIGHT = FRAME_WIDTH * 1.3;
const FRAME_PADDING = 12;
const CAMERA_CARD_WIDTH = SCREEN_WIDTH - 40;
const CAMERA_CARD_HEIGHT = CAMERA_CARD_WIDTH * 1.32;
const CAMERA_CARD_LEFT = 20;
const CAMERA_CARD_BORDER_RADIUS = 20;

export default function ResultScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [result, setResult] = useState<PerfumeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const insets = useSafeAreaInsets();

  const cameraCardTop = insets.top + 48;
  const frameOuterW = FRAME_WIDTH + FRAME_PADDING * 2;
  const frameOuterH = FRAME_HEIGHT + FRAME_PADDING * 2;
  const finalX = (SCREEN_WIDTH - frameOuterW) / 2;
  const finalY = SCREEN_HEIGHT * 0.18;

  const progress = useSharedValue(0);
  const bgOpacity = useSharedValue(0);
  const borderOpacity = useSharedValue(1);
  const frameRotate = useSharedValue(0);
  const stepsTranslateY = useSharedValue(40);
  const stepsOpacity = useSharedValue(0);
  const transitionProgress = useSharedValue(0);
  const spinnerRotation = useSharedValue(0);

  const onTransitionDone = useCallback(() => setShowResult(true), []);

  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) });
    progress.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
    frameRotate.value = withDelay(
      600,
      withTiming(-1.5, { duration: 500, easing: Easing.out(Easing.quad) }),
    );
    setTimeout(() => {
      frameRotate.value = withRepeat(
        withTiming(1.5, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }, 1300);
    stepsTranslateY.value = withDelay(
      500,
      withSpring(0, { damping: 20, stiffness: 180 }),
    );
    stepsOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 500 }),
    );
    spinnerRotation.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  useEffect(() => {
    if (!imageUri) return;
    identify();
  }, [imageUri]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentStep < STEPS.length - 1) return;

    const checkResult = setTimeout(() => {
      const res = apiResult.current;
      if (!res) {
        const poll = setInterval(() => {
          if (apiResult.current) {
            clearInterval(poll);
            handleApiResult(apiResult.current);
          }
        }, 300);
      } else {
        handleApiResult(res);
      }
    }, 2000);

    return () => clearTimeout(checkResult);
  }, [currentStep]);

  const handleApiResult = (res: { perfume?: PerfumeResult; error?: string }) => {
    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }
    if (res.perfume) {
      setResult(res.perfume);
      setLoading(false);
      setCurrentStep(STEPS.length);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        transitionProgress.value = withTiming(1, {
          duration: 800,
          easing: Easing.inOut(Easing.cubic),
        });
        setTimeout(() => onTransitionDone(), 850);
      }, 600);
    }
  };

  const apiResult = useRef<{ perfume?: PerfumeResult; error?: string } | null>(null);

  const readAsBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const identify = async () => {
    try {
      const base64 = await readAsBase64(imageUri!);
      const perfume = await identifyPerfume(base64);
      if (!perfume.identified) {
        apiResult.current = { error: 'Could not identify this perfume. Try a clearer photo of the bottle or label.' };
      } else {
        apiResult.current = { perfume };
      }
    } catch (err: any) {
      apiResult.current = { error: err.message || 'Something went wrong. Please try again.' };
    }
  };

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const frameAnimStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const left = interpolate(p, [0, 1], [CAMERA_CARD_LEFT, finalX]);
    const top = interpolate(p, [0, 1], [cameraCardTop, finalY]);
    const w = interpolate(p, [0, 1], [CAMERA_CARD_WIDTH, frameOuterW]);
    const h = interpolate(p, [0, 1], [CAMERA_CARD_HEIGHT, frameOuterH]);
    const br = interpolate(p, [0, 1], [CAMERA_CARD_BORDER_RADIUS, 8]);

    const tScale = interpolate(transitionProgress.value, [0, 1], [1, 0.85]);
    const tRotate = interpolate(transitionProgress.value, [0, 1], [frameRotate.value, 0]);
    const tY = interpolate(transitionProgress.value, [0, 1], [0, -60]);

    return {
      position: 'absolute' as const,
      left,
      top,
      width: w,
      height: h,
      borderRadius: br,
      transform: [
        { scale: tScale },
        { rotate: `${tRotate}deg` },
        { translateY: tY },
      ],
    };
  });

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value * 360}deg` }],
  }));

  const stepsAnimStyle = useAnimatedStyle(() => {
    const fadeOut = interpolate(transitionProgress.value, [0, 0.3], [1, 0], 'clamp');
    return {
      opacity: stepsOpacity.value * fadeOut,
      transform: [{ translateY: stepsTranslateY.value }],
    };
  });

  const resultAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(transitionProgress.value, [0.5, 1], [0, 1], 'clamp'),
    transform: [
      {
        translateY: interpolate(transitionProgress.value, [0.5, 1], [40, 0], 'clamp'),
      },
    ],
  }));

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={18} color={Colors.gold} />);
      } else if (i === fullStars && hasHalf) {
        stars.push(<Ionicons key={i} name="star-half" size={18} color={Colors.gold} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={18} color={Colors.textMuted} />);
      }
    }
    return stars;
  };

  if (error) {
    return (
      <LinearGradient colors={[Colors.background, Colors.surface]} style={{ flex: 1 }}>
        <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Identification Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.retryButton} onPress={identify}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
              <Text style={styles.backText}>Take New Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (showResult && result) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Framed hero image */}
          <View style={styles.resultHeroWrap}>
            <View style={styles.resultFrame}>
              {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.resultFrameImage} />
              )}
            </View>
            <LinearGradient
              colors={['transparent', Colors.background]}
              style={styles.resultHeroFade}
            />
            <View style={[styles.resultBackRow, { paddingTop: insets.top + Spacing.sm }]}>
              <TouchableOpacity
                style={styles.heroBackButton}
                onPress={() => router.replace('/')}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Info */}
          <View style={styles.mainInfo}>
            <Text style={styles.brand}>{result.brand}</Text>
            <Text style={styles.name}>{result.name}</Text>
            <View style={styles.ratingRow}>
              <View style={styles.stars}>{renderStars(result.rating)}</View>
              <Text style={styles.ratingText}>{result.rating}/5</Text>
            </View>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{result.fragranceFamily}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{result.gender}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{result.concentration}</Text>
              </View>
            </View>
          </View>

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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.card}>
              <InfoRow icon="💰" label="Price" value={result.priceRange} />
              <InfoRow icon="⏱️" label="Longevity" value={result.longevity} />
              <InfoRow icon="💨" label="Sillage" value={result.sillage} />
              <InfoRow icon="📅" label="Year" value={result.yearLaunched} />
              <InfoRow icon="👃" label="Perfumer" value={result.perfumer} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Best For</Text>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Occasions</Text>
              <View style={styles.chipRow}>
                {result.occasions.map((o, i) => (
                  <NoteChip key={i} label={o} color={Colors.primary} />
                ))}
              </View>
              <Text style={[styles.cardLabel, { marginTop: Spacing.md }]}>Seasons</Text>
              <View style={styles.chipRow}>
                {result.seasons.map((s, i) => (
                  <NoteChip key={i} label={s} color={Colors.accent} />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similar Perfumes</Text>
            <View style={styles.card}>
              {result.similarPerfumes.map((p, i) => (
                <View key={i} style={styles.similarItem}>
                  <Text style={styles.similarIcon}>🔸</Text>
                  <Text style={styles.similarText}>{p}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.scanAgainButton}
            onPress={() => router.replace('/')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scanAgainGradient}
            >
              <Ionicons name="scan" size={22} color="#fff" />
              <Text style={styles.scanAgainText}>Scan Another Perfume</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </View>
    );
  }

  // Processing screen
  return (
    <View style={styles.processingContainer}>
      {/* Background fades in over camera bg */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <LinearGradient
          colors={['#1a1410', Colors.background, '#0c0a08']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.accentLineTop} />
        <View style={styles.accentLineBot} />
      </Animated.View>

      {/* Photo frame - animates from camera card position to final position */}
      <Animated.View style={[frameAnimStyle, { zIndex: 2 }]}>
        <View style={styles.photoClip}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.photoFrameImage} />
          )}
        </View>
        {/* Golden frame border */}
        <Animated.View style={[styles.frameBorder, borderStyle]} pointerEvents="none" />
      </Animated.View>

      {/* Processing steps */}
      <Animated.View style={[styles.stepsWrap, stepsAnimStyle]}>
        {STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep && !showResult;

          return (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepIconWrap}>
                {done ? (
                  <View style={styles.stepDotDone}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  </View>
                ) : active ? (
                  <View style={styles.stepSpinner}>
                    <Animated.View style={[styles.stepSpinnerRing, spinnerStyle]} />
                  </View>
                ) : (
                  <View style={styles.stepDotPending} />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  done && styles.stepLabelDone,
                  active && styles.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </Animated.View>

      {/* Results fading in beneath */}
      {result && (
        <Animated.View style={[styles.transitionOverlay, resultAnimStyle]}>
          <View style={styles.transitionContent}>
            <Text style={styles.transitionBrand}>{result.brand}</Text>
            <Text style={styles.transitionName}>{result.name}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  // Processing screen
  processingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  accentLineTop: {
    position: 'absolute',
    top: '18%',
    left: Spacing.xl,
    right: Spacing.xl,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(200,148,60,0.12)',
  },
  accentLineBot: {
    position: 'absolute',
    bottom: '18%',
    left: Spacing.xl,
    right: Spacing.xl,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(200,148,60,0.12)',
  },

  photoClip: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
    margin: 10,
  },
  photoFrameImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  frameBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    backgroundColor: '#c4a060',
    borderWidth: 1.5,
    borderTopColor: '#dcc07a',
    borderLeftColor: '#d4b46e',
    borderRightColor: '#a88540',
    borderBottomColor: '#8a6e30',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
    }),
    zIndex: -1,
  },

  stepsWrap: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.15,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl + Spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  stepIconWrap: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepDotDone: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepSpinner: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepSpinnerRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: 'transparent',
    borderTopColor: Colors.primary,
    borderRightColor: Colors.primary,
  },
  stepDotPending: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border,
  },
  stepLabel: {
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  stepLabelDone: {
    color: Colors.text,
  },
  stepLabelActive: {
    color: Colors.text,
    fontWeight: '600',
  },

  transitionOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  transitionContent: {
    alignItems: 'center',
  },
  transitionBrand: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  transitionName: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.xs,
  },

  // Result hero with frame
  resultHeroWrap: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.9,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultFrame: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6 * 1.3,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  resultFrameImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  resultHeroFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  resultBackRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
  },
  heroBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  mainInfo: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  brand: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  name: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.gold,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLight,
  },
  tagText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  notesGroup: {
    marginBottom: Spacing.md,
  },
  notesLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border + '40',
  },
  cardLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  similarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  similarIcon: {
    fontSize: 14,
  },
  similarText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  scanAgainButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  scanAgainGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg - 4,
    gap: Spacing.sm,
  },
  scanAgainText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#fff',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorActions: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
    width: '100%',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  retryText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#fff',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  backText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '600',
  },
});
