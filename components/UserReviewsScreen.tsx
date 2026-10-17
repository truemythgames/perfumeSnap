import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Spacing, FontSizes, BorderRadius } from '../constants/theme';

const RATE_US_BG = require('../assets/images/rate-us-bg.png');

const REVIEWS = [
  {
    name: 'Maya L.',
    quote: 'I snapped a bottle I had forgotten the name of. It identified it instantly and the price matched what I paid.',
  },
  {
    name: 'James R.',
    quote: 'The valuation feels like having a dealer in my pocket. I finally know what the collection is worth.',
  },
  {
    name: 'Elena V.',
    quote: 'Saved three scents in a minute. The suggestions actually match what I like to wear.',
  },
];

type Props = {
  onContinue: () => void;
};

function Stars() {
  return (
    <View style={styles.starsRow}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Ionicons key={i} name="star" size={14} color="#d4a54a" />
      ))}
    </View>
  );
}

export default function UserReviewsScreen({ onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const titleSlide = useSharedValue(0);
  const card0 = useSharedValue(0);
  const card1 = useSharedValue(0);
  const card2 = useSharedValue(0);
  const cardSlides = [card0, card1, card2];

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) });
    titleSlide.value = withDelay(
      100,
      withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) }),
    );
    cardSlides.forEach((slide, index) => {
      slide.value = withDelay(
        180 + index * 90,
        withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) }),
      );
    });
  }, [card0, card1, card2, opacity, titleSlide]);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleSlide.value,
    transform: [{ translateX: interpolate(titleSlide.value, [0, 1], [40, 0]) }],
  }));
  const cardStyles = [
    useAnimatedStyle(() => ({
      opacity: card0.value,
      transform: [{ translateY: interpolate(card0.value, [0, 1], [16, 0]) }],
    })),
    useAnimatedStyle(() => ({
      opacity: card1.value,
      transform: [{ translateY: interpolate(card1.value, [0, 1], [16, 0]) }],
    })),
    useAnimatedStyle(() => ({
      opacity: card2.value,
      transform: [{ translateY: interpolate(card2.value, [0, 1], [16, 0]) }],
    })),
  ];

  return (
    <Animated.View
      style={[styles.overlay, fade, { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.lg }]}
      pointerEvents="auto"
    >
      <Image source={RATE_US_BG} style={styles.bgImage} resizeMode="cover" />
      <View style={styles.bgOverlay} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>Loved by Collectors</Text>
          <Text style={styles.subtitle}>A few words from people using PerfumeSnap.</Text>
        </Animated.View>
        {REVIEWS.map((review, index) => (
          <Animated.View key={review.name} style={[styles.card, cardStyles[index]]}>
            <Stars />
            <Text style={styles.quote}>{review.quote}</Text>
            <Text style={styles.name}>{review.name}</Text>
          </Animated.View>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.continue}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onContinue();
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.continueTxt}>Continue</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 1000,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 32,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  card: {
    backgroundColor: 'rgba(22,18,16,0.88)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(212,165,74,0.28)',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  quote: {
    color: '#f2ece4',
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  name: {
    marginTop: 12,
    color: '#d4a54a',
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  continue: {
    backgroundColor: '#9a7b4f',
    borderRadius: BorderRadius.xl,
    paddingVertical: 18,
    marginHorizontal: 24,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  continueTxt: {
    color: '#fff',
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
});
