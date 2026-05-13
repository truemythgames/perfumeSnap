import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
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
  withSequence,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { identifyPerfume, getApiUrl, PerfumeResult, SimilarPerfume, buildShoppingUrl, normalizeSimilarPerfumes, addToCollection, uploadImage } from '../services/api';
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

function randomParticleConfig() {
  return {
    startX: Math.random() * SCREEN_WIDTH,
    size: 2 + Math.random() * 5,
    duration: 7000 + Math.random() * 7000,
    drift: (Math.random() - 0.5) * 70,
  };
}

interface ParticleProps {
  initialDelay: number;
}

function Particle({ initialDelay }: ParticleProps) {
  const [config, setConfig] = useState(randomParticleConfig);
  const progress = useSharedValue(0);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const respawn = useCallback(() => {
    if (mounted.current) setConfig(randomParticleConfig());
  }, []);

  useEffect(() => {
    const start = () => {
      progress.value = 0;
      progress.value = withTiming(
        1,
        { duration: config.duration, easing: Easing.linear },
        (finished) => {
          if (finished) runOnJS(respawn)();
        },
      );
    };
    const timer = setTimeout(start, initialDelay);
    return () => clearTimeout(timer);
  }, [config]);

  const style = useAnimatedStyle(() => {
    const ty = interpolate(progress.value, [0, 1], [SCREEN_HEIGHT + 40, -80]);
    const tx = interpolate(progress.value, [0, 0.5, 1], [0, config.drift, 0]);
    const opacity = interpolate(
      progress.value,
      [0, 0.1, 0.85, 1],
      [0, 1, 1, 0],
    );
    return {
      transform: [{ translateY: ty }, { translateX: tx }],
      opacity,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: config.startX,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
        },
        style,
      ]}
    />
  );
}

const PARTICLE_COUNT = 40;
const PARTICLE_DELAYS = Array.from({ length: PARTICLE_COUNT }, (_, i) =>
  Math.round((i / PARTICLE_COUNT) * 8000 + Math.random() * 500),
);

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    imageUri?: string;
    prefill?: string;
    fromCollection?: string;
  }>();

  const imageUri = useMemo(() => {
    const v = params.imageUri;
    if (Array.isArray(v)) return v[0];
    return v;
  }, [params.imageUri]);

  const prefillRaw = useMemo(() => {
    const v = params.prefill;
    if (Array.isArray(v)) return v[0];
    return v;
  }, [params.prefill]);

  const fromCollection = useMemo(() => {
    const v = params.fromCollection;
    if (Array.isArray(v)) return v[0];
    return v;
  }, [params.fromCollection]);

  const collectionPerfume = useMemo((): (PerfumeResult & {
    imageUri?: string | null;
    imageKey?: string | null;
  }) | null => {
    if (!prefillRaw) return null;
    try {
      return JSON.parse(prefillRaw) as PerfumeResult & {
        imageUri?: string | null;
        imageKey?: string | null;
      };
    } catch {
      return null;
    }
  }, [prefillRaw]);

  const prefillInvalid = Boolean(prefillRaw && !collectionPerfume);

  const perfumeToResult = (
    p: PerfumeResult & { imageUri?: string | null; imageKey?: string | null },
  ): PerfumeResult => {
    const { imageUri: _iu, imageKey: _ik, ...rest } = p as PerfumeResult & Record<string, unknown>;
    return rest as PerfumeResult;
  };

  const displayImageUri = imageUri || collectionPerfume?.imageUri || undefined;

  const leaveResult = useCallback(() => {
    if (fromCollection === '1') router.back();
    else router.replace('/');
  }, [fromCollection]);

  const [result, setResult] = useState<PerfumeResult | null>(() =>
    collectionPerfume && !prefillInvalid ? perfumeToResult(collectionPerfume) : null,
  );
  const [loading, setLoading] = useState(() => {
    if (prefillInvalid) return false;
    if (collectionPerfume) return false;
    return true;
  });
  const [error, setError] = useState<string | null>(() =>
    prefillInvalid ? 'Could not open this item.' : null,
  );
  const [currentStep, setCurrentStep] = useState(() =>
    collectionPerfume && !prefillInvalid ? STEPS.length : 0,
  );
  const [showResult, setShowResult] = useState(() => Boolean(collectionPerfume) && !prefillInvalid);
  const [photoFullscreen, setPhotoFullscreen] = useState(false);
  const [savedToCollection, setSavedToCollection] = useState(() => fromCollection === '1');
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  const cameraCardTop = insets.top + 48;
  const frameOuterW = FRAME_WIDTH + FRAME_PADDING * 2;
  const frameOuterH = FRAME_HEIGHT + FRAME_PADDING * 2;
  const finalX = (SCREEN_WIDTH - frameOuterW) / 2;
  const finalY = SCREEN_HEIGHT * 0.18;

  const heroW = SCREEN_WIDTH * 0.6;
  const heroH = heroW * 1.3;
  const heroAreaH = SCREEN_WIDTH * 0.9;
  const heroX = (SCREEN_WIDTH - heroW) / 2;
  const heroY = (heroAreaH - heroH) / 2;

  const progress = useSharedValue(0);
  const bgOpacity = useSharedValue(0);
  const borderOpacity = useSharedValue(1);
  const frameRotate = useSharedValue(0);
  const stepsTranslateY = useSharedValue(40);
  const stepsOpacity = useSharedValue(0);
  const transitionProgress = useSharedValue(0);
  const spinnerRotation = useSharedValue(0);
  const shineRotation = useSharedValue(0);

  const onTransitionDone = useCallback(() => setShowResult(true), []);

  useEffect(() => {
    if (collectionPerfume) return;
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
    // Slow vertical sweep top→bottom, pause, repeat.
    shineRotation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
        withDelay(2200, withTiming(0, { duration: 1 })),
      ),
      -1,
      false,
    );
  }, [collectionPerfume]);

  const apiResult = useRef<{ perfume?: PerfumeResult; error?: string } | null>(null);
  const stepInterval = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const formatError = (msg: string): string => {
    if (msg.includes('Rate limit')) return 'Too many scans — please wait a minute and try again.';
    if (msg.includes('timed out')) return 'The server is taking too long. Check your connection and try again.';
    if (msg.includes('Cannot reach') || msg.includes('Network request failed')) return 'No internet connection. Please check your network and try again.';
    if (msg.includes('Image too large')) return 'That photo is too large. Try taking a new one closer up.';
    if (msg.includes('AI service error')) return 'Our AI service is temporarily down. Please try again shortly.';
    return msg || 'Something went wrong. Please try again.';
  };

  const showError = useCallback((msg: string) => {
    if (stepInterval.current) clearInterval(stepInterval.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setError(formatError(msg));
    setLoading(false);
  }, []);

  const showSuccess = useCallback((perfume: PerfumeResult) => {
    setResult(perfume);
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
  }, []);

  const startStepAnimation = useCallback(() => {
    if (stepInterval.current) clearInterval(stepInterval.current);
    stepInterval.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 2000);
  }, []);

  const identify = useCallback(async () => {
    if (!imageUri) return;
    setError(null);
    setLoading(true);
    setCurrentStep(0);
    apiResult.current = null;
    startStepAnimation();

    try {
      const base64 = await readAsBase64(imageUri);
      const perfume = await identifyPerfume(base64);
      apiResult.current = { perfume };
    } catch (err: any) {
      showError(err.message);
    }
  }, [imageUri, showError, startStepAnimation]);

  useEffect(() => {
    if (collectionPerfume) return;
    if (!imageUri) return;
    identify();
    return () => {
      if (stepInterval.current) clearInterval(stepInterval.current);
    };
  }, [imageUri, collectionPerfume, identify]);

  useEffect(() => {
    if (collectionPerfume) return;
    if (currentStep < STEPS.length - 1) return;
    if (error) return;

    const checkResult = setTimeout(() => {
      const res = apiResult.current;
      if (!res) {
        const poll = setInterval(() => {
          if (apiResult.current) {
            clearInterval(poll);
            if (apiResult.current.error) showError(apiResult.current.error);
            else if (apiResult.current.perfume) showSuccess(apiResult.current.perfume);
          }
        }, 300);
      } else {
        if (res.error) showError(res.error);
        else if (res.perfume) showSuccess(res.perfume);
      }
    }, 1500);

    return () => clearTimeout(checkResult);
  }, [currentStep, error, collectionPerfume, showSuccess, showError]);

  const handleSave = async () => {
    if (!result || savedToCollection || saving) return;
    if (!displayImageUri) return;
    setSaving(true);
    try {
      const uploaded = await uploadImage(displayImageUri);
      await addToCollection(result, { imageKey: uploaded.key });
    } catch {
      try {
        await addToCollection(result, { imageUri: displayImageUri });
      } catch {}
    }
    setSavedToCollection(true);
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));


  const borderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const frameAnimStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const t = transitionProgress.value;

    const baseScaleX = interpolate(p, [0, 1], [CAMERA_CARD_WIDTH / frameOuterW, 1]);
    const baseScaleY = interpolate(p, [0, 1], [CAMERA_CARD_HEIGHT / frameOuterH, 1]);
    const baseTX = interpolate(p, [0, 1], [
      CAMERA_CARD_LEFT + CAMERA_CARD_WIDTH / 2 - (finalX + frameOuterW / 2),
      0,
    ]);
    const baseTY = interpolate(p, [0, 1], [
      cameraCardTop + CAMERA_CARD_HEIGHT / 2 - (finalY + frameOuterH / 2),
      0,
    ]);

    const scaleX = interpolate(t, [0, 1], [baseScaleX, heroW / frameOuterW]);
    const scaleY = interpolate(t, [0, 1], [baseScaleY, heroH / frameOuterH]);
    const tx = interpolate(t, [0, 1], [baseTX, heroX + heroW / 2 - (finalX + frameOuterW / 2)]);
    const ty = interpolate(t, [0, 1], [baseTY, heroY + heroH / 2 - (finalY + frameOuterH / 2)]);
    const rotate = interpolate(t, [0, 1], [frameRotate.value, 0]);

    return {
      position: 'absolute' as const,
      left: finalX,
      top: finalY,
      width: frameOuterW,
      height: frameOuterH,
      borderRadius: 8,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scaleX },
        { scaleY },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value * 360}deg` }],
  }));

  const shineSweepStyle = useAnimatedStyle(() => {
    const ty = interpolate(
      shineRotation.value,
      [0, 1],
      [-SCREEN_HEIGHT * 0.5, SCREEN_HEIGHT * 0.5],
    );
    return {
      transform: [{ translateY: ty }],
      opacity: bgOpacity.value,
    };
  });

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
            {imageUri && !collectionPerfume ? (
              <TouchableOpacity style={styles.retryButton} onPress={identify}>
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.backButton} onPress={leaveResult}>
              <Text style={styles.backText}>
                {fromCollection === '1' ? 'Back' : 'Take New Photo'}
              </Text>
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
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={!displayImageUri}
              onPress={() => displayImageUri && setPhotoFullscreen(true)}
            >
              <View style={styles.resultFrame}>
                {displayImageUri ? (
                  <Image source={{ uri: displayImageUri }} style={styles.resultFrameImage} />
                ) : (
                  <View style={styles.resultFramePlaceholder}>
                    <Ionicons name="flask-outline" size={48} color={Colors.primary} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <LinearGradient
              colors={['transparent', Colors.background]}
              style={styles.resultHeroFade}
            />
            <View style={[styles.resultBackRow, { paddingTop: insets.top + Spacing.sm }]}>
              <TouchableOpacity
                style={styles.heroBackButton}
                onPress={leaveResult}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Info */}
          <View style={styles.mainInfo}>
            <Text style={styles.brand}>{result.brand}</Text>
            <Text style={styles.name}>{result.name}</Text>

            {/* Price range badge */}
            {result.priceRange && (
              <View style={styles.priceBadge}>
                <LinearGradient
                  colors={['#c8943c', '#d4a44a', '#c8943c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.priceBadgeGradient}
                >
                  <Ionicons name="pricetag" size={14} color="#fff" />
                  <Text style={styles.priceBadgeText}>{result.priceRange}</Text>
                </LinearGradient>
              </View>
            )}

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
            <Text style={styles.sectionSubtitle}>Tap to shop online</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarScroll}
            >
              {normalizeSimilarPerfumes(result.similarPerfumes).map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.similarCard}
                  activeOpacity={0.85}
                  onPress={() => WebBrowser.openBrowserAsync(
                    buildShoppingUrl(p.name, p.brand, 'google')
                  )}
                >
                  <LinearGradient
                    colors={[Colors.surfaceLight, Colors.surface]}
                    style={styles.similarCardGradient}
                  >
                    <View style={styles.similarImageWrap}>
                      <LinearGradient
                        colors={['#c8943c22', '#d4a44a11']}
                        style={styles.similarImagePlaceholder}
                      >
                        <Text style={styles.similarInitial}>
                          {(p.brand || p.name).charAt(0).toUpperCase()}
                        </Text>
                        <Ionicons name="flask-outline" size={28} color={Colors.primary} style={{ marginTop: 4 }} />
                      </LinearGradient>
                    </View>
                    <Text style={styles.similarCardBrand} numberOfLines={1}>{p.brand}</Text>
                    <Text style={styles.similarCardName} numberOfLines={2}>{p.name}</Text>
                    {p.estimatedPrice ? (
                      <Text style={styles.similarCardPrice}>{p.estimatedPrice}</Text>
                    ) : null}
                    <View style={styles.shopRow}>
                      <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => WebBrowser.openBrowserAsync(
                          buildShoppingUrl(p.name, p.brand, 'amazon')
                        )}
                      >
                        <Text style={styles.shopButtonText}>Amazon</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => WebBrowser.openBrowserAsync(
                          buildShoppingUrl(p.name, p.brand, 'ebay')
                        )}
                      >
                        <Text style={styles.shopButtonText}>eBay</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Sticky footer bar */}
        <View style={[styles.footerBar, { paddingBottom: insets.bottom || Spacing.md }]}>
          {fromCollection === '1' ? (
            <TouchableOpacity
              style={styles.addCollectionButton}
              activeOpacity={0.85}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.replace('/camera');
              }}
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
          ) : (
            <>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => router.replace('/camera')}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={22} color={Colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.addCollectionButton,
                  savedToCollection && styles.addCollectionButtonDone,
                ]}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={savedToCollection || saving}
              >
                <LinearGradient
                  colors={savedToCollection ? ['#2a6e2a', '#1e5e1e'] : [Colors.primary, Colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addCollectionGradient}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons
                      name={savedToCollection ? 'checkmark-circle' : 'add-circle-outline'}
                      size={20}
                      color="#fff"
                    />
                  )}
                  <Text style={styles.addCollectionText}>
                    {savedToCollection ? 'Saved' : saving ? 'Saving...' : 'Add to Collection'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Fullscreen Photo Modal */}
        <Modal
          visible={photoFullscreen}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setPhotoFullscreen(false)}
        >
          <View style={styles.fullscreenBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setPhotoFullscreen(false)}
            />
            {displayImageUri && (
              <Image
                source={{ uri: displayImageUri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={[styles.fullscreenClose, { top: insets.top + Spacing.sm }]}
              onPress={() => setPhotoFullscreen(false)}
            >
              <View style={styles.fullscreenCloseCircle}>
                <Ionicons name="close" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
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

        {/* Floating golden particles drifting upward */}
        <View style={styles.particleLayer} pointerEvents="none">
          {PARTICLE_DELAYS.map((delay, i) => (
            <Particle key={i} initialDelay={delay} />
          ))}
        </View>

        <View style={styles.accentLineTop} />
        <View style={styles.accentLineBot} />
      </Animated.View>

      {/* Close button */}
      <TouchableOpacity
        style={[styles.processingClose, { top: insets.top + Spacing.sm }]}
        onPress={() => router.replace('/camera')}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Photo frame - animates from camera card position to final position */}
      <Animated.View
        style={[frameAnimStyle, { zIndex: 2 }]}
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
      >
        <Animated.View style={[styles.frameBorderOuter, borderStyle]} pointerEvents="box-none">
          <LinearGradient
            colors={['#dcc07a', '#c4a060', '#8a6e30']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.frameGradientOuter}
          >
            <View style={styles.frameInset}>
              <LinearGradient
                colors={['#8a6e30', '#b8953e', '#dcc07a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.frameGradientInner}
              >
                <View style={styles.photoClip}>
                  {displayImageUri && (
                    <Image source={{ uri: displayImageUri }} style={styles.photoFrameImage} />
                  )}
                  {/* Diagonal shine sweep across the photo */}
                  <Animated.View style={[styles.shineSweep, shineSweepStyle]} pointerEvents="none">
                    <LinearGradient
                      colors={[
                        'transparent',
                        'rgba(255,220,140,0.0)',
                        'rgba(255,220,140,0.55)',
                        'rgba(255,255,220,0.85)',
                        'rgba(255,220,140,0.55)',
                        'rgba(255,220,140,0.0)',
                        'transparent',
                      ]}
                      locations={[0, 0.3, 0.45, 0.5, 0.55, 0.7, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>
                </View>
              </LinearGradient>
            </View>
          </LinearGradient>
        </Animated.View>
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
  particleLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#dcc07a',
    shadowColor: '#dcc07a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  processingClose: {
    position: 'absolute',
    left: Spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
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

  shineSweep: {
    position: 'absolute',
    left: -SCREEN_WIDTH * 0.1,
    right: -SCREEN_WIDTH * 0.1,
    top: 0,
    height: SCREEN_HEIGHT * 0.5,
  },

  frameBorderOuter: {
    flex: 1,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
    }),
  },
  frameGradientOuter: {
    flex: 1,
    borderRadius: 8,
    padding: 5,
  },
  frameInset: {
    flex: 1,
    borderRadius: 5,
    backgroundColor: '#0c0a08',
    padding: 2,
  },
  frameGradientInner: {
    flex: 1,
    borderRadius: 4,
    padding: 4,
  },
  photoClip: {
    flex: 1,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  photoFrameImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  resultFramePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
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
  priceBadge: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  priceBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: '#c8943c40',
  },
  priceBadgeText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  similarScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  similarCard: {
    width: 170,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border + '60',
  },
  similarCardGradient: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  similarImageWrap: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  similarImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#c8943c20',
  },
  similarInitial: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    opacity: 0.7,
  },
  similarCardBrand: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  similarCardName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 2,
    minHeight: 36,
  },
  similarCardPrice: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.gold,
    marginTop: Spacing.xs,
  },
  shopRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  shopButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border + '80',
    alignItems: 'center',
  },
  shopButtonText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
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
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(200,148,60,0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#c8943c',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  retakeButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  addCollectionButton: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  addCollectionButtonDone: {
    opacity: 0.85,
  },
  addCollectionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md - 2,
    gap: Spacing.sm,
  },
  addCollectionText: {
    fontSize: FontSizes.md,
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
