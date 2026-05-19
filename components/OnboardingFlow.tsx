import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
  Linking,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LOGO_SIZE = 319;

const TERMS_URL = 'https://perfumesnap.app/terms';
const PRIVACY_URL = 'https://perfumesnap.app/privacy';
const FLASH_STEP_START_MS = 420;
const FLASH_STEP_END_MS = 90;
const FLASH_TO_FINAL_DELAY_MS = 0;
const LAST_FLASH_FRAME_HOLD_MS = 420;
const WELCOME_HOLD_MS = 0;
const PHOTO_SETTLE_BEFORE_FRAME_MS = 220;
const WELCOME_FRAME_FADE_MS = 1800;
const WELCOME_TO_RECOGNITION_DELAY_MS = WELCOME_FRAME_FADE_MS;
const FINAL_IMAGE_START_Y = 210;
const IMAGE_TRANSITION_MS = 900;
const TOP_SECTION_HEIGHT = SCREEN_HEIGHT * 0.54;
const PHOTO_FRAME_HEIGHT = SCREEN_WIDTH * 0.82;
const SHINE_SWEEP_HEIGHT = SCREEN_HEIGHT * 0.5;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const PERFUMES: Array<{ name: string; icon: IoniconsName; colors: [string, string] }> = [
  { name: 'Floral', icon: 'flower-outline', colors: ['#D4A44A', '#B8860B'] },
  { name: 'Woody', icon: 'leaf-outline', colors: ['#8B7355', '#6B5B3D'] },
  { name: 'Oriental', icon: 'sparkles-outline', colors: ['#B8860B', '#8B6914'] },
  { name: 'Fresh', icon: 'water-outline', colors: ['#5BA3B5', '#3D8294'] },
  { name: 'Citrus', icon: 'sunny-outline', colors: ['#DAA520', '#B8860B'] },
  { name: 'Gourmand', icon: 'cafe-outline', colors: ['#A0522D', '#8B4513'] },
  { name: 'Aquatic', icon: 'fish-outline', colors: ['#4682B4', '#336B8F'] },
  { name: 'Spicy', icon: 'flame-outline', colors: ['#CD5C5C', '#A04040'] },
];

const FLASH_PERFUME_IMAGES = [
  require('../assets/images/onboarding-perfume-2.png'),
  require('../assets/images/onboarding-perfume-3.png'),
  require('../assets/images/onboarding-perfume-4.png'),
  require('../assets/images/onboarding-perfume-5.png'),
  require('../assets/images/onboarding-perfume-6.png'),
  require('../assets/images/onboarding-perfume-7.png'),
  require('../assets/images/onboarding-perfume-8.png'),
  require('../assets/images/onboarding-perfume-9.png'),
  require('../assets/images/onboarding-perfume-10.png'),
  require('../assets/images/onboarding-perfume-11.png'),
  require('../assets/images/onboarding-perfume-12.png'),
  require('../assets/images/onboarding-perfume-1.png'),
];
const FINAL_PERFUME_IMAGE = require('../assets/images/onboarding-perfume-1.png');

const CARD_WIDTH = 120;
const CARD_GAP = 12;
const SINGLE_SET_WIDTH = PERFUMES.length * (CARD_WIDTH + CARD_GAP);
const VIEWFINDER_SIZE = 180;
const BRACKET_LEN = 40;
const BRACKET_W = 3;

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
  }, [config, initialDelay, progress, respawn]);

  const style = useAnimatedStyle(() => {
    const ty = interpolate(progress.value, [0, 1], [TOP_SECTION_HEIGHT + 20, -80]);
    const tx = interpolate(progress.value, [0, 0.5, 1], [0, config.drift, 0]);
    const opacity = interpolate(progress.value, [0, 0.1, 0.85, 1], [0, 1, 1, 0]);
    return {
      transform: [{ translateY: ty }, { translateX: tx }],
      opacity,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        st.processingParticle,
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

interface Props {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [flashImageIndex, setFlashImageIndex] = useState(0);
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);
  const [showFinalImage, setShowFinalImage] = useState(false);
  const [showWelcomeFrameIntro, setShowWelcomeFrameIntro] = useState(false);
  const [recognitionPhaseKey, setRecognitionPhaseKey] = useState(0);

  // Welcome animations
  const welcomeOpacity = useSharedValue(1);
  const bottomSlide = useSharedValue(200);

  // Step content opacities (steps 1–3 on dark bg)
  const carouselOpacity = useSharedValue(0);
  const snapOpacity = useSharedValue(0);
  const rateOpacity = useSharedValue(0);
  const recognitionOpacity = useSharedValue(0);

  // Carousel auto-scroll
  const scrollX = useSharedValue(0);

  // Snap demo values
  const bracketScale = useSharedValue(1.5);
  const bracketAlpha = useSharedValue(0);
  const scanProgress = useSharedValue(0);
  const scanAlpha = useSharedValue(0);
  const resultAlpha = useSharedValue(0);
  const finalImageTranslateY = useSharedValue(FINAL_IMAGE_START_Y);
  const finalImageScale = useSharedValue(1.06);
  const finalContentOpacity = useSharedValue(0);
  const sharedImageProgress = useSharedValue(0);
  const processingBgOpacity = useSharedValue(0);
  const shineRotation = useSharedValue(0);
  const processingFrameRotate = useSharedValue(0);
  const processingFrameReveal = useSharedValue(0);
  const recognitionContentOpacity = useSharedValue(0);
  const welcomeFrameReveal = useSharedValue(0);

  const onWelcomeLayout = useCallback(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    bottomSlide.value = withDelay(
      600,
      withSpring(0, { damping: 20, stiffness: 160 }),
    );
  }, []);

  useEffect(() => {
    if (step === 1) {
      scrollX.value = 0;
      scrollX.value = withRepeat(
        withTiming(-SINGLE_SET_WIDTH, { duration: 20000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(scrollX);
    }
  }, [step]);

  useEffect(() => {
    if (step !== 2) return;

    let cancelled = false;
    let timers: ReturnType<typeof setTimeout>[] = [];

    const loop = () => {
      if (cancelled) return;

      bracketScale.value = 1.5;
      bracketAlpha.value = 0;
      scanProgress.value = 0;
      scanAlpha.value = 0;
      resultAlpha.value = 0;

      bracketAlpha.value = withTiming(1, { duration: 300 });
      bracketScale.value = withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });

      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          scanAlpha.value = withTiming(1, { duration: 200 });
          scanProgress.value = withTiming(1, { duration: 1200, easing: Easing.linear });
        }, 700),
      );

      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          scanAlpha.value = withTiming(0, { duration: 200 });
          resultAlpha.value = withTiming(1, { duration: 300 });
        }, 2000),
      );

      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          bracketAlpha.value = withTiming(0, { duration: 300 });
          resultAlpha.value = withTiming(0, { duration: 300 });
        }, 3500),
      );
    };

    loop();
    const interval = setInterval(loop, 4200);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [step]);

  useEffect(() => {
    if (step !== 1) return;

    let index = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    setFlashImageIndex(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const showNext = () => {
      index += 1;
      if (index >= FLASH_PERFUME_IMAGES.length) {
        timer = setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsImageTransitioning(true);
          setShowFinalImage(false);
          setShowWelcomeFrameIntro(false);
          welcomeFrameReveal.value = 0;
          sharedImageProgress.value = 0;
          setStep(3);
          carouselOpacity.value = withTiming(0, { duration: IMAGE_TRANSITION_MS });
          rateOpacity.value = 1;
          sharedImageProgress.value = withTiming(
            1,
            { duration: IMAGE_TRANSITION_MS, easing: Easing.out(Easing.cubic) },
            (finished) => {
              if (finished) {
                runOnJS(setIsImageTransitioning)(false);
                runOnJS(setShowFinalImage)(true);
              }
            },
          );
        }, FLASH_TO_FINAL_DELAY_MS + LAST_FLASH_FRAME_HOLD_MS);
        return;
      }

      setFlashImageIndex(index);
      Haptics.selectionAsync();

      const progress = index / Math.max(1, FLASH_PERFUME_IMAGES.length - 1);
      const nextDelay = Math.round(
        FLASH_STEP_START_MS - (FLASH_STEP_START_MS - FLASH_STEP_END_MS) * progress,
      );
      timer = setTimeout(showNext, nextDelay);
    };

    timer = setTimeout(showNext, FLASH_STEP_START_MS);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [step]);

  useEffect(() => {
    if (step !== 3) return;

    // Ensure the next step visuals are fully hidden during image handoff.
    recognitionOpacity.value = 0;
    recognitionContentOpacity.value = 0;

    if (isImageTransitioning) {
      // Keep welcome static while shared image transitions.
      finalImageTranslateY.value = 0;
      finalImageScale.value = 1;
      finalContentOpacity.value = 1;
      return;
    }

    // If user reaches this screen directly, keep a simple static presentation.
    finalImageTranslateY.value = 0;
    finalImageScale.value = 1;
    finalContentOpacity.value = 1;
    setShowFinalImage(true);
  }, [step, isImageTransitioning]);

  useEffect(() => {
    if (step !== 3 || isImageTransitioning) return;
    setShowWelcomeFrameIntro(true);
    welcomeFrameReveal.value = 0;
    let nextTimer: ReturnType<typeof setTimeout> | null = null;

    const frameTimer: ReturnType<typeof setTimeout> = setTimeout(() => {
      welcomeFrameReveal.value = withTiming(1, {
        duration: WELCOME_FRAME_FADE_MS,
        easing: Easing.out(Easing.cubic),
      });
      nextTimer = setTimeout(
        () => advanceTo(4),
        WELCOME_TO_RECOGNITION_DELAY_MS,
      );
    }, PHOTO_SETTLE_BEFORE_FRAME_MS);

    return () => {
      clearTimeout(frameTimer);
      if (nextTimer) clearTimeout(nextTimer);
    };
  }, [step, isImageTransitioning]);

  useEffect(() => {
    if (step !== 4) return;

    let tiltTimer: ReturnType<typeof setTimeout> | null = null;
    processingBgOpacity.value = 0;
    processingFrameRotate.value = 0;
    processingFrameReveal.value = showWelcomeFrameIntro ? 1 : 0;
    recognitionContentOpacity.value = 0;
    processingBgOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    if (!showWelcomeFrameIntro) {
      processingFrameReveal.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    }
    recognitionContentOpacity.value = withDelay(
      showWelcomeFrameIntro ? 180 : 360,
      withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }),
    );
    shineRotation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withDelay(1700, withTiming(0, { duration: 1 })),
      ),
      -1,
      false,
    );
    processingFrameRotate.value = withDelay(
      600,
      withTiming(-1.5, { duration: 500, easing: Easing.out(Easing.quad) }),
    );
    tiltTimer = setTimeout(() => {
      processingFrameRotate.value = withRepeat(
        withTiming(1.5, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }, 1300);

    return () => {
      if (tiltTimer) clearTimeout(tiltTimer);
      cancelAnimation(shineRotation);
      cancelAnimation(processingFrameRotate);
    };
  }, [step, showWelcomeFrameIntro]);

  const advanceTo = (next: number) => {
    // Welcome -> Recognition should feel like "frame is added",
    // not a fade-out/fade-in screen swap.
    if (step === 3 && next === 4) {
      setRecognitionPhaseKey((v) => v + 1);
      // Keep frame/photo visible at handoff to avoid a one-frame blink.
      processingFrameReveal.value = showWelcomeFrameIntro ? 1 : 0;
      setStep(4);
      recognitionOpacity.value = 0;
      rateOpacity.value = 1;
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const map: Record<number, SharedValue<number>> = {
      0: welcomeOpacity,
      1: carouselOpacity,
      2: snapOpacity,
      3: rateOpacity,
      4: recognitionOpacity,
    };

    map[step].value = withTiming(0, { duration: 300 });
    map[next].value = withDelay(200, withTiming(1, { duration: 400 }));
    setStep(next);
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') {
      try {
        await requestTrackingPermissionsAsync();
      } catch {}
    }
    advanceTo(1);
  };

  // Animated styles
  const welcomeStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
  }));
  const bottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomSlide.value }],
  }));
  const carouselFade = useAnimatedStyle(() => ({
    opacity: carouselOpacity.value,
  }));
  const snapFade = useAnimatedStyle(() => ({
    opacity: snapOpacity.value,
  }));
  const rateFade = useAnimatedStyle(() => ({
    opacity: rateOpacity.value,
  }));
  const recognitionFade = useAnimatedStyle(() => ({
    opacity: recognitionOpacity.value,
  }));
  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.value }],
  }));
  const bracketStyle = useAnimatedStyle(() => ({
    opacity: bracketAlpha.value,
    transform: [{ scale: bracketScale.value }],
  }));
  const scanStyle = useAnimatedStyle(() => ({
    opacity: scanAlpha.value,
    transform: [
      {
        translateY: interpolate(
          scanProgress.value,
          [0, 1],
          [0, VIEWFINDER_SIZE - 4],
        ),
      },
    ],
  }));
  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultAlpha.value,
  }));
  const finalImageMoveStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: finalImageTranslateY.value },
      { scale: finalImageScale.value },
    ],
  }));
  const finalContentRevealStyle = useAnimatedStyle(() => ({
    opacity: finalContentOpacity.value,
  }));
  const sharedStartWidth = SCREEN_WIDTH - Spacing.lg * 2;
  const sharedStartHeight = SCREEN_HEIGHT * 0.82;
  const sharedStartX = Spacing.lg;
  const sharedStartY = (SCREEN_HEIGHT - sharedStartHeight) / 2;
  const sharedEndWidth = SCREEN_WIDTH * 0.62;
  const sharedEndHeight = SCREEN_WIDTH * 0.82;
  const sharedEndX = (SCREEN_WIDTH - sharedEndWidth) / 2;
  const sharedEndY = (SCREEN_HEIGHT * 0.54 - sharedEndHeight) / 2;
  const sharedImageStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: interpolate(sharedImageProgress.value, [0, 1], [sharedStartX, sharedEndX]),
    top: interpolate(sharedImageProgress.value, [0, 1], [sharedStartY, sharedEndY]),
    width: interpolate(sharedImageProgress.value, [0, 1], [sharedStartWidth, sharedEndWidth]),
    height: interpolate(sharedImageProgress.value, [0, 1], [sharedStartHeight, sharedEndHeight]),
    borderRadius: interpolate(sharedImageProgress.value, [0, 1], [BorderRadius.lg, BorderRadius.md]),
  }));
  const processingBgStyle = useAnimatedStyle(() => ({
    opacity: processingBgOpacity.value,
  }));
  const shineSweepStyle = useAnimatedStyle(() => {
    const ty = interpolate(
      shineRotation.value,
      [0, 1],
      [-SHINE_SWEEP_HEIGHT, PHOTO_FRAME_HEIGHT],
    );
    return {
      transform: [{ translateY: ty }],
      opacity: processingFrameReveal.value,
    };
  });
  const processingFrameAnimStyle = useAnimatedStyle(() => ({
    opacity: processingFrameReveal.value,
    transform: [{ rotate: `${processingFrameRotate.value}deg` }],
  }));
  const welcomeFrameIntroStyle = useAnimatedStyle(() => ({
    opacity: welcomeFrameReveal.value,
  }));
  const recognitionContentStyle = useAnimatedStyle(() => ({
    opacity: recognitionContentOpacity.value,
  }));

  const tripleCards = [...PERFUMES, ...PERFUMES, ...PERFUMES];

  const dots = (active: number) => (
    <View style={st.dotsRow}>
      {[0, 1, 2].map(i => (
        <View key={i} style={[st.dot, i === active && st.dotActive]} />
      ))}
    </View>
  );

  const isRecognitionPhase = step >= 4;

  return (
    <View style={st.root}>
      <StatusBar style={step === 0 ? 'dark' : 'light'} />

      {/* ── Step 1: Perfume Flash (auto) ── */}
      <Animated.View
        style={[st.layer, carouselFade]}
        pointerEvents={step === 1 ? 'auto' : 'none'}
      >
        <View style={st.flashContainer}>
          <Image
            source={FLASH_PERFUME_IMAGES[flashImageIndex]}
            style={st.flashImage}
            resizeMode="cover"
          />
        </View>
      </Animated.View>

      {/* ── Step 2: Snap Demo ── */}
      <Animated.View
        style={[st.layer, snapFade]}
        pointerEvents={step === 2 ? 'auto' : 'none'}
      >
        <View style={[st.content, { paddingTop: insets.top + 60 }]}>
          <Text style={st.title}>Snap to Identify</Text>
          <Text style={st.subtitle}>
            Point your camera at any perfume{'\n'}and let AI do the rest
          </Text>

          <View style={st.snapArea}>
            <View style={st.vfBox}>
              <Animated.View style={[StyleSheet.absoluteFill, bracketStyle]}>
                <View style={[st.brk, st.brkTL]} />
                <View style={[st.brk, st.brkTR]} />
                <View style={[st.brk, st.brkBL]} />
                <View style={[st.brk, st.brkBR]} />
              </Animated.View>
              <Animated.View style={[st.scanLine, scanStyle]} />
              <Ionicons
                name="sparkles"
                size={48}
                color={Colors.gold}
                style={{ opacity: 0.5 }}
              />
            </View>

            <Animated.View style={[st.badge, resultStyle]}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={st.badgeText}>Identified!</Text>
            </Animated.View>
          </View>
        </View>

        <View style={[st.bottom, { paddingBottom: insets.bottom + Spacing.md }]}>
          {dots(1)}
          <TouchableOpacity
            style={st.pill}
            onPress={() => advanceTo(3)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={st.pillGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={st.pillText}>Next</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Step 3: Final welcome with one perfume ── */}
      <Animated.View
        style={[st.layer, rateFade]}
        pointerEvents={step === 3 || step === 4 ? 'auto' : 'none'}
      >
        <View style={st.finalScreen}>
          <View style={[st.finalHero, isRecognitionPhase && st.processingHero]}>
            {isRecognitionPhase && (
              <Animated.View style={[st.processingBackgroundOverlay, processingBgStyle]}>
                <LinearGradient
                  colors={['#1a1410', Colors.background, '#0c0a08']}
                  locations={[0, 0.45, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={st.particleLayer} pointerEvents="none">
                  {PARTICLE_DELAYS.map((delay, i) => (
                    <Particle key={`${recognitionPhaseKey}-${i}`} initialDelay={delay} />
                  ))}
                </View>
                <View style={st.accentLineTop} />
                <View style={st.accentLineBot} />
              </Animated.View>
            )}

            <Animated.View
              style={[
                finalImageMoveStyle,
              ]}
            >
              <Image
                source={FINAL_PERFUME_IMAGE}
                style={[st.finalPerfumeImage, (!showFinalImage || isImageTransitioning) && st.hiddenImage]}
                resizeMode="cover"
              />
            </Animated.View>

            {(showWelcomeFrameIntro || isRecognitionPhase) && (
              <Animated.View
                style={[
                  st.processingFrameWrap,
                  st.welcomeFrameWrap,
                  isRecognitionPhase ? processingFrameAnimStyle : welcomeFrameIntroStyle,
                ]}
              >
                <View style={st.frameBorderOuter}>
                  <LinearGradient
                    colors={['#dcc07a', '#c4a060', '#8a6e30']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={st.frameGradientOuter}
                  >
                    <View style={st.frameInset}>
                      <LinearGradient
                        colors={['#8a6e30', '#b8953e', '#dcc07a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={st.frameGradientInner}
                      >
                        <View style={st.photoClip}>
                          <Image source={FINAL_PERFUME_IMAGE} style={st.photoFrameImage} />
                          {isRecognitionPhase && (
                            <Animated.View style={[st.shineSweep, shineSweepStyle]} pointerEvents="none">
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
                          )}
                        </View>
                      </LinearGradient>
                    </View>
                  </LinearGradient>
                </View>
              </Animated.View>
            )}
            <View style={st.seal}>
              <Ionicons name="sparkles" size={20} color="#f7eddc" />
            </View>
          </View>
          <Animated.View
            style={[
              st.finalContent,
              isRecognitionPhase ? recognitionContentStyle : finalContentRevealStyle,
            ]}
          >
            <Text style={st.finalTitle}>
              {isRecognitionPhase ? 'Easy Photo Recognition' : `Welcome To\nPerfumeSnap`}
            </Text>
            <Text style={st.finalSubtitle}>
              {isRecognitionPhase
                ? 'Simply Snap A Picture To Get Detailed Information And Valuation'
                : 'Discover The Hidden Value Of Your Perfume Collection With A Simple Photo'}
            </Text>
            <View style={st.finalProgressRow}>
              <View style={[st.finalProgressBar, !isRecognitionPhase && st.finalProgressBarActive]} />
              <View style={[st.finalProgressBar, isRecognitionPhase && st.finalProgressBarActive]} />
              <View style={st.finalProgressBar} />
              <View style={st.finalProgressBar} />
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      {isImageTransitioning && (
        <Animated.Image
          source={FINAL_PERFUME_IMAGE}
          style={sharedImageStyle}
          resizeMode="cover"
        />
      )}

      {/* ── Welcome Overlay (white, on top – matches native splash) ── */}
      <Animated.View
        style={[st.layer, st.welcomeBg, welcomeStyle]}
        pointerEvents={step === 0 ? 'auto' : 'none'}
        onLayout={onWelcomeLayout}
      >
        <Image
          source={require('../assets/splash-icon.png')}
          style={st.logo}
          resizeMode="contain"
        />
        <Animated.View
          style={[
            st.welcomeBottom,
            { paddingBottom: insets.bottom + Spacing.md },
            bottomStyle,
          ]}
        >
          <Text style={st.tos}>
            By tapping Continue, you agree to our{' '}
            <Text
              style={st.tosLink}
              onPress={() => Linking.openURL(TERMS_URL)}
            >
              Terms of Use
            </Text>
            {'\n'}and confirm you have read our{' '}
            <Text
              style={st.tosLink}
              onPress={() => Linking.openURL(PRIVACY_URL)}
            >
              Privacy Policy
            </Text>
            .
          </Text>
          <TouchableOpacity
            style={st.continueBtn}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={st.continueTxt}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  layer: { ...StyleSheet.absoluteFillObject },
  welcomeBg: { backgroundColor: '#ffffff' },

  /* ── Welcome ── */
  logo: {
    position: 'absolute',
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    left: (SCREEN_WIDTH - LOGO_SIZE) / 2,
    top: (SCREEN_HEIGHT - LOGO_SIZE) / 2 - 78,
  },
  welcomeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  tos: {
    color: '#777',
    fontSize: FontSizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  tosLink: {
    color: '#444',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  continueBtn: {
    backgroundColor: '#9a7b4f',
    borderRadius: BorderRadius.xl,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
  },
  continueTxt: {
    color: '#fff',
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },

  /* ── Shared step layout ── */
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  bottom: { paddingHorizontal: Spacing.lg, alignItems: 'center' },
  flashContainer: {
    flex: 1,
    backgroundColor: '#0b0b0b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  flashImage: {
    width: '100%',
    height: '82%',
    borderRadius: BorderRadius.lg,
  },
  finalPerfumeImage: {
    width: SCREEN_WIDTH * 0.62,
    height: SCREEN_WIDTH * 0.82,
    borderRadius: BorderRadius.md,
  },
  hiddenImage: {
    opacity: 0,
  },
  finalScreen: {
    flex: 1,
    backgroundColor: '#e9dfcf',
  },
  finalHero: {
    overflow: 'hidden',
    height: '54%',
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  processingHero: {
    backgroundColor: Colors.background,
  },
  processingBackgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  particleLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  processingParticle: {
    position: 'absolute',
    backgroundColor: '#dcc07a',
    shadowColor: '#dcc07a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
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
  processingFrameWrap: {
    width: SCREEN_WIDTH * 0.62,
    height: SCREEN_WIDTH * 0.82,
  },
  welcomeFrameWrap: {
    position: 'absolute',
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
  shineSweep: {
    position: 'absolute',
    left: -SCREEN_WIDTH * 0.1,
    right: -SCREEN_WIDTH * 0.1,
    top: 0,
    height: SHINE_SWEEP_HEIGHT,
  },
  finalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  finalTitle: {
    color: '#5f3f24',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  finalSubtitle: {
    color: '#5b4632',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  seal: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#a67f49',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#cfb287',
  },
  finalProgressRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.xl,
  },
  finalProgressBar: {
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d5c7ad',
  },
  finalProgressBarActive: {
    backgroundColor: '#a67f49',
  },

  title: {
    color: Colors.text,
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },

  /* ── Dots ── */
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
    borderRadius: 4,
  },

  /* ── CTA pill ── */
  pill: { width: '100%', borderRadius: BorderRadius.xl, overflow: 'hidden' },
  pillGrad: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
  },
  pillText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '700' },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  /* ── Carousel ── */
  carouselWrap: {
    height: 170,
    overflow: 'hidden',
    marginHorizontal: -Spacing.lg,
    marginTop: Spacing.md,
  },
  carouselStrip: {
    flexDirection: 'row',
    paddingLeft: Spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    height: 160,
    borderRadius: BorderRadius.lg,
    marginRight: CARD_GAP,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  cardLabel: { color: '#fff', fontSize: FontSizes.sm, fontWeight: '700' },

  /* ── Snap demo ── */
  snapArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vfBox: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brk: { position: 'absolute', borderColor: Colors.primary },
  brkTL: {
    top: 0,
    left: 0,
    width: BRACKET_LEN,
    height: BRACKET_LEN,
    borderTopWidth: BRACKET_W,
    borderLeftWidth: BRACKET_W,
    borderTopLeftRadius: 8,
  },
  brkTR: {
    top: 0,
    right: 0,
    width: BRACKET_LEN,
    height: BRACKET_LEN,
    borderTopWidth: BRACKET_W,
    borderRightWidth: BRACKET_W,
    borderTopRightRadius: 8,
  },
  brkBL: {
    bottom: 0,
    left: 0,
    width: BRACKET_LEN,
    height: BRACKET_LEN,
    borderBottomWidth: BRACKET_W,
    borderLeftWidth: BRACKET_W,
    borderBottomLeftRadius: 8,
  },
  brkBR: {
    bottom: 0,
    right: 0,
    width: BRACKET_LEN,
    height: BRACKET_LEN,
    borderBottomWidth: BRACKET_W,
    borderRightWidth: BRACKET_W,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    top: 0,
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
      },
    }),
  },
  badge: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },

  /* ── Rate us ── */
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
  skip: {
    color: Colors.textMuted,
    fontSize: FontSizes.md,
    fontWeight: '500',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
