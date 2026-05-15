import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
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
  Extrapolation,
} from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import { identifyPerfume, lookupPerfume, getApiUrl, PerfumeResult, SimilarPerfume, buildShoppingUrl, normalizeSimilarPerfumes, addToCollection, uploadImage, getSimilarListings } from '../services/api';
import NoteChip from '../components/NoteChip';
import InfoRow from '../components/InfoRow';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

const BADGE_MAP: Record<string, string> = { amazon: 'Amazon', ebay: 'eBay', walmart: 'Walmart' };

function getBadgeLabel(retailer?: string): string | null {
  if (!retailer) return null;
  const key = retailer.toLowerCase();
  for (const [match, label] of Object.entries(BADGE_MAP)) {
    if (key.includes(match)) return label;
  }
  return null;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Detail hero zone; framed image is 90% of screen width with 1:1.3 ratio (bottom may clip). */
const RESULT_HERO_ZONE_HEIGHT = SCREEN_WIDTH * 0.9;
const RESULT_DETAIL_FRAME_W = SCREEN_WIDTH * 0.9;
const RESULT_DETAIL_FRAME_H = RESULT_DETAIL_FRAME_W * 1.3;

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

function SimilarCardSmall({ perfume }: { perfume: SimilarPerfume }) {
  const [imageUrl, setImageUrl] = useState<string | null>(perfume.imageUrl || null);
  const [failed, setFailed] = useState(false);
  const directUrl = perfume.productUrl || buildShoppingUrl(perfume.name, perfume.brand, perfume.retailer);

  const hasImage = Boolean(imageUrl) && !failed;

  return (
    <TouchableOpacity
      style={styles.similarCard}
      activeOpacity={0.85}
      onPress={() => WebBrowser.openBrowserAsync(directUrl, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET })}
    >
      <View style={styles.similarImageWrap}>
        {!hasImage && (
          <View style={styles.similarImageFallback}>
            <Ionicons name="flask-outline" size={40} color="#b8953e" />
          </View>
        )}
        {hasImage ? (
          <Image source={{ uri: imageUrl! }} style={styles.similarCardImage} resizeMode="cover" onError={() => setFailed(true)} />
        ) : null}
        {getBadgeLabel(perfume.retailer) ? (
          <View style={styles.retailerBadge}>
            <Text style={styles.retailerBadgeText}>{getBadgeLabel(perfume.retailer)}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.similarPriceCheck}>Check Site</Text>
      <Text style={styles.similarName} numberOfLines={2}>
        {perfume.brand} {perfume.name}
      </Text>
    </TouchableOpacity>
  );
}

function parseNumericPrice(raw?: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, '');
  const match = cleaned.match(/\$?\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function isLikelySampleOrDecant(item: SimilarPerfume): boolean {
  const text = `${item.name || ''} ${item.brand || ''}`.toLowerCase();
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

const DEVICE_LOCALE = Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
const localeParts = DEVICE_LOCALE.replace('_', '-').split('-');
const DEVICE_REGION = (localeParts[1] || 'US').toUpperCase();
const DEFAULT_UNIT_PREF: 'ml' | 'oz' = ['US', 'LR', 'MM'].includes(DEVICE_REGION) ? 'oz' : 'ml';
const REGION_TO_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP',
  GR: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', IE: 'EUR', PT: 'EUR', CY: 'EUR',
  AU: 'AUD', CA: 'CAD', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  JP: 'JPY', KR: 'KRW', CN: 'CNY', IN: 'INR', AE: 'AED', SA: 'SAR', TR: 'TRY',
};
const DEFAULT_CURRENCY = REGION_TO_CURRENCY[DEVICE_REGION] || 'USD';

function formatMoney(value: number, currencyCode: string): string {
  try {
    const formatted = new Intl.NumberFormat(DEVICE_LOCALE, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 2,
    }).format(value);
    // Normalize variants like "US$50.49" / "USD 50.49" to plain symbol form.
    return formatted
      .replace(/^USD\s*/i, '$')
      .replace(/^US\$/i, '$')
      .replace(/^([A-Z]{2})\$/i, '$');
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

function parseSizeToMl(raw: string): number | null {
  const text = raw.toLowerCase();
  const ml = text.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  if (ml) return Number(ml[1]);
  const oz = text.match(/(\d+(?:\.\d+)?)\s*(?:fl\s*)?oz\b/);
  if (oz) {
    const value = Number(oz[1]);
    return Number.isFinite(value) ? value * 29.5735 : null;
  }
  return null;
}

function formatSize(raw: string, unitPref: 'ml' | 'oz'): string {
  const ml = parseSizeToMl(raw);
  if (!ml || !Number.isFinite(ml)) return raw;
  if (unitPref === 'oz') return `${(ml / 29.5735).toFixed(1)} oz`;
  return `${Math.round(ml)} ml`;
}

function formatPriceRange(raw: string | undefined, currencyCode: string): string {
  if (!raw) return '';
  const nums = raw.match(/[\d]+(?:[.,]\d+)?/g);
  if (!nums || nums.length === 0) return raw;
  const values = nums
    .map((n) => Number(n.replace(',', '.')))
    .filter((v) => Number.isFinite(v));
  if (values.length === 0) return raw;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return formatMoney(min, currencyCode);
  return `${formatMoney(min, currencyCode)} - ${formatMoney(max, currencyCode)}`;
}

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    imageUri?: string;
    prefill?: string;
    fromCollection?: string;
    lookupName?: string;
    lookupBrand?: string;
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

  const lookupName = useMemo(() => {
    const v = params.lookupName;
    if (Array.isArray(v)) return v[0];
    return v;
  }, [params.lookupName]);

  const lookupBrand = useMemo(() => {
    const v = params.lookupBrand;
    if (Array.isArray(v)) return v[0];
    return v;
  }, [params.lookupBrand]);

  const isLookupMode = Boolean(lookupName);

  const collectionPerfume = useMemo((): (PerfumeResult & {
    imageUri?: string | null;
    imageKey?: string | null;
    cachedSimilarListings?: SimilarPerfume[];
  }) | null => {
    if (!prefillRaw) return null;
    try {
      return JSON.parse(prefillRaw) as PerfumeResult & {
        imageUri?: string | null;
        imageKey?: string | null;
        cachedSimilarListings?: SimilarPerfume[];
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
    if (fromCollection === '1' || isLookupMode) router.back();
    else router.replace('/');
  }, [fromCollection, isLookupMode]);

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
  const [similarListings, setSimilarListings] = useState<SimilarPerfume[]>(() => {
    if (!collectionPerfume?.cachedSimilarListings) return [];
    return collectionPerfume.cachedSimilarListings;
  });
  const [similarLoading, setSimilarLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState(0);
  const [unitPref, setUnitPref] = useState<'ml' | 'oz'>(DEFAULT_UNIT_PREF);

  useEffect(() => {
    if (!result) return;
    const cachedFromCollection = collectionPerfume?.cachedSimilarListings || [];
    if (fromCollection === '1' && cachedFromCollection.length > 0) {
      setSimilarListings(cachedFromCollection);
      setSimilarLoading(false);
      return;
    }
    setSimilarLoading(true);
    getSimilarListings(result.name, result.brand).then((listings) => {
      setSimilarListings(listings);
      setSimilarLoading(false);
    }).catch(() => setSimilarLoading(false));
  }, [result?.name, result?.brand, fromCollection, collectionPerfume?.cachedSimilarListings]);

  const openAllSimilar = useCallback(() => {
    if (!result) return;
    router.push({
      pathname: '/similar',
      params: { name: result.name, brand: result.brand },
    });
  }, [result]);
  const livePriceStats = useMemo(() => {
    const priced = similarListings
      .filter((item) => !isLikelySampleOrDecant(item))
      .map((item) => ({
        price: parseNumericPrice(item.estimatedPrice),
        retailer: item.retailer || 'Retailer',
      }))
      .filter((x): x is { price: number; retailer: string } => x.price !== null)
      .filter((x) => x.price >= 10);
    if (priced.length === 0) return null;

    let sorted = priced.map((p) => p.price).sort((a, b) => a - b);

    // Trim extreme tails when we have enough offers.
    if (sorted.length >= 5) {
      const from = Math.floor(sorted.length * 0.2);
      const to = Math.ceil(sorted.length * 0.8);
      sorted = sorted.slice(from, to);
    }

    // Keep only prices in a reasonable band around median.
    const median = sorted[Math.floor(sorted.length / 2)];
    const bounded = sorted.filter((v) => v >= median * 0.6 && v <= median * 1.8);
    if (bounded.length >= 2) sorted = bounded;

    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const display = min === max
      ? formatMoney(min, DEFAULT_CURRENCY)
      : `${formatMoney(min, DEFAULT_CURRENCY)} - ${formatMoney(max, DEFAULT_CURRENCY)}`;
    return { display };
  }, [similarListings]);

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
  const fullscreenTranslateY = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const onTransitionDone = useCallback(() => setShowResult(true), []);

  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  }, []);

  const backButtonBgStyle = useAnimatedStyle(() => {
    const threshold = RESULT_HERO_ZONE_HEIGHT - 60;
    const p = interpolate(
      scrollY.value,
      [threshold - 30, threshold],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const r = Math.round(0 + p * 240);
    const g = Math.round(0 + p * 232);
    const b = Math.round(0 + p * 218);
    const a = 0.5 + p * 0.5;
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})`,
    };
  });

  const backIconColorStyle = useAnimatedStyle(() => {
    const threshold = RESULT_HERO_ZONE_HEIGHT - 60;
    const progress = interpolate(
      scrollY.value,
      [threshold - 30, threshold],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity: 1 - progress };
  });

  const backIconDarkStyle = useAnimatedStyle(() => {
    const threshold = RESULT_HERO_ZONE_HEIGHT - 60;
    const progress = interpolate(
      scrollY.value,
      [threshold - 30, threshold],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity: progress };
  });

  const topShadowOpacityStyle = useAnimatedStyle(() => {
    const threshold = RESULT_HERO_ZONE_HEIGHT - 60;
    const opacity = interpolate(
      scrollY.value,
      [threshold - 30, threshold],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const openPhotoFullscreen = useCallback(() => {
    fullscreenTranslateY.value = 0;
    setPhotoFullscreen(true);
  }, []);

  const closePhotoFullscreen = useCallback(() => {
    setPhotoFullscreen(false);
  }, []);

  const fullscreenPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .maxPointers(1)
        .activeOffsetY([-8, 8])
        .onUpdate((e) => {
          'worklet';
          fullscreenTranslateY.value = e.translationY;
        })
        .onEnd((e) => {
          'worklet';
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
      transform: [
        { translateY: ty },
        { scale: scl },
      ],
    };
  });

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
    setSelectedSize(0);
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

  const doLookup = useCallback(async () => {
    if (!lookupName) return;
    setError(null);
    setLoading(true);
    setCurrentStep(0);
    apiResult.current = null;
    startStepAnimation();

    try {
      const perfume = await lookupPerfume(lookupName, lookupBrand || '');
      apiResult.current = { perfume };
    } catch (err: any) {
      showError(err.message);
    }
  }, [lookupName, lookupBrand, showError, startStepAnimation]);

  useEffect(() => {
    if (collectionPerfume) return;
    if (isLookupMode) {
      doLookup();
      return () => { if (stepInterval.current) clearInterval(stepInterval.current); };
    }
    if (!imageUri) return;
    identify();
    return () => {
      if (stepInterval.current) clearInterval(stepInterval.current);
    };
  }, [imageUri, collectionPerfume, identify, isLookupMode, doLookup]);

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
      await addToCollection(result, { imageKey: uploaded.key, similarListings });
    } catch {
      try {
        await addToCollection(result, { imageUri: displayImageUri, similarListings });
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
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Framed hero image */}
          <View style={styles.resultHeroWrap}>
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={!displayImageUri}
              onPress={() => displayImageUri && openPhotoFullscreen()}
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
                          <Image
                            source={{ uri: displayImageUri }}
                            style={styles.resultFrameImage}
                            fadeDuration={200}
                          />
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
            </TouchableOpacity>
            <LinearGradient
              colors={[Colors.surface, 'transparent']}
              style={styles.resultHeroFadeTop}
              pointerEvents="none"
            />
            <LinearGradient
              colors={['transparent', Colors.background]}
              style={styles.resultHeroFade}
              pointerEvents="none"
            />
          </View>

          {/* Main Info */}
          <View style={styles.mainInfo}>
            <Text style={styles.name}>{result.name}</Text>

            {/* Price card */}
            {(livePriceStats || result.priceRange) && (
              <View style={styles.priceCard}>
                <LinearGradient
                  colors={['#f5ead4', '#ece0c8', '#e3d5b8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.priceCardInner}
                >
                  {livePriceStats ? (
                    <Text style={styles.priceCardAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      {livePriceStats.display}
                    </Text>
                  ) : (
                    <>
                      {result.sizesPricing && result.sizesPricing.length > 0 ? (
                        <>
                          <View style={styles.sizeTabs}>
                            {result.sizesPricing.map((sp, i) => (
                              <TouchableOpacity
                                key={`${sp.size}-${i}`}
                                style={[
                                  styles.sizeTab,
                                  selectedSize === i && styles.sizeTabActive,
                                ]}
                                onPress={() => setSelectedSize(i)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.sizeTabText,
                                    selectedSize === i && styles.sizeTabTextActive,
                                  ]}
                                >
                                  {formatSize(sp.size, unitPref)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          <Text style={styles.priceCardAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                            {formatPriceRange(result.sizesPricing[selectedSize]?.price ?? result.priceRange, DEFAULT_CURRENCY)}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.priceCardAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                          {formatPriceRange(result.priceRange, DEFAULT_CURRENCY)}
                        </Text>
                      )}
                    </>
                  )}
                  <View style={styles.priceCardDivider} />
                  <Text style={styles.priceCardGrading}>
                    Grading: <Text style={styles.priceCardGradingValue}>
                      {result.rating >= 4.5 ? 'Excellent' : result.rating >= 3.5 ? 'Very Good' : result.rating >= 2.5 ? 'Good' : 'Fair'}
                    </Text>
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>

          <View style={styles.similarSection}>
            <TouchableOpacity
              style={styles.similarHeader}
              activeOpacity={0.7}
              onPress={openAllSimilar}
            >
              <Text style={styles.similarTitle}>Similar Perfumes</Text>
              <Text style={styles.similarChevron}>{'>'}</Text>
            </TouchableOpacity>
            <View style={styles.similarDivider} />
            {similarLoading ? (
              <ActivityIndicator size="small" color={Colors.text} style={{ marginVertical: 20 }} />
            ) : similarListings.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarScroll}
              >
                {similarListings.slice(0, 5).map((p, i) => (
                  <SimilarCardSmall key={i} perfume={p} />
                ))}
                {similarListings.length > 5 && (
                  <TouchableOpacity
                    style={styles.viewAllCard}
                    activeOpacity={0.7}
                    onPress={openAllSimilar}
                  >
                    <Ionicons name="arrow-forward-circle-outline" size={32} color={Colors.primary} />
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : null}
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

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Sticky back button */}
        <Animated.View
          style={[styles.topShadow, { height: insets.top + 52 }, topShadowOpacityStyle]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.25)', 'transparent']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View style={[styles.resultBackRow, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={leaveResult} activeOpacity={0.7}>
            <Animated.View style={[styles.heroBackButton, backButtonBgStyle]}>
              <Animated.View style={[StyleSheet.absoluteFill, styles.heroBackIconWrap, backIconColorStyle]}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, styles.heroBackIconWrap, backIconDarkStyle]}>
                <Ionicons name="arrow-back" size={24} color="#2a1f0e" />
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        </View>

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
          animationType="none"
          statusBarTranslucent
          onRequestClose={closePhotoFullscreen}
        >
          <GestureHandlerRootView style={styles.fullscreenGestureRoot}>
            <View style={styles.fullscreenBackdrop}>
              <Animated.View
                pointerEvents="none"
                style={[styles.fullscreenBackdropFill, fullscreenBackdropAnimStyle]}
              />
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={closePhotoFullscreen}
              />
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
                    />
                  ) : null}
                </Animated.View>
              </GestureDetector>
              <TouchableOpacity
                style={[styles.fullscreenClose, { top: insets.top + Spacing.sm }]}
                onPress={closePhotoFullscreen}
              >
                <View style={styles.fullscreenCloseCircle}>
                  <Ionicons name="close" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          </GestureHandlerRootView>
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
    height: RESULT_HERO_ZONE_HEIGHT,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: RESULT_HERO_ZONE_HEIGHT * 0.1,
  },
  resultHeroFrameOuter: {
    padding: 4,
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
  resultGoldFrameOuter: {
    width: RESULT_DETAIL_FRAME_W,
    height: RESULT_DETAIL_FRAME_H,
    borderRadius: 8,
    padding: 3,
  },
  resultGoldFrameInset: {
    flex: 1,
    borderRadius: 5,
    backgroundColor: '#0c0a08',
    padding: 1.5,
  },
  resultGoldFrameInner: {
    flex: 1,
    borderRadius: 4,
    padding: 2.5,
  },
  resultPhotoClip: {
    flex: 1,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
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
  resultHeroFadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  resultHeroFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  topShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  resultBackRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    zIndex: 2,
  },
  heroBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  heroBackIconWrap: {
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
    color: Colors.textSecondary,
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
  priceCard: {
    marginTop: Spacing.lg,
    alignSelf: 'center',
    width: '85%',
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: '#c8943c60',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  priceCardInner: {
    borderRadius: BorderRadius.md - 2,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  sizeTabs: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  sizeTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: '#c8943c50',
    backgroundColor: 'transparent',
  },
  sizeTabActive: {
    backgroundColor: '#2a1f0e',
    borderColor: '#2a1f0e',
  },
  sizeTabText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#5a4a32',
  },
  sizeTabTextActive: {
    color: '#f5ead4',
  },
  priceCardAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2a1f0e',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  priceCardDivider: {
    width: '60%',
    height: 1,
    backgroundColor: '#c8943c50',
    marginVertical: Spacing.sm + 2,
  },
  priceCardGrading: {
    fontSize: FontSizes.md,
    color: '#5a4a32',
    fontWeight: '500',
  },
  priceCardGradingValue: {
    fontWeight: '800',
    color: '#2a1f0e',
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  similarSection: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingLeft: Spacing.lg,
  },
  similarHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  similarTitle: {
    fontSize: FontSizes.xl + 2,
    fontWeight: '800',
    color: Colors.text,
  },
  similarChevron: {
    fontSize: FontSizes.xl,
    fontWeight: '400',
    color: Colors.textMuted,
  },
  similarDivider: {
    height: 1,
    backgroundColor: 'rgba(200,148,60,0.2)',
    marginRight: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  similarScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  similarCard: {
    width: 140,
  },
  similarImageWrap: {
    width: 140,
    height: 150,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#e8dece',
    marginBottom: Spacing.sm,
  },
  similarCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  similarImageFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retailerBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ab7f45',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  retailerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  similarPrice: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.text,
  },
  similarPriceCheck: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    fontStyle: 'italic',
    color: Colors.textSecondary,
  },
  similarName: {
    fontSize: FontSizes.xs,
    color: Colors.text,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 15,
  },
  viewAllCard: {
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  viewAllText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  fullscreenGestureRoot: {
    flex: 1,
  },
  fullscreenBackdrop: {
    flex: 1,
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
