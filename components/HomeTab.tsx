import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { isApiConfigured } from '../services/api';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import { trackCameraOpened } from '../services/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ARTICLES = [
  {
    id: '1',
    title: 'Fragrance Families Explained',
    subtitle: 'Floral, Oriental, Woody & Fresh',
    icon: 'flower-outline' as const,
    color: '#c8943c',
    bgColor: '#c8943c18',
  },
  {
    id: '2',
    title: 'Understanding Perfume Notes',
    subtitle: 'Top, heart & base notes decoded',
    icon: 'musical-notes-outline' as const,
    color: '#b87a3a',
    bgColor: '#b87a3a18',
  },
  {
    id: '3',
    title: 'How to Apply Perfume',
    subtitle: 'Pulse points & lasting tips',
    icon: 'water-outline' as const,
    color: '#d4a44a',
    bgColor: '#d4a44a18',
  },
  {
    id: '4',
    title: 'EDP vs EDT vs Cologne',
    subtitle: 'Concentration & longevity guide',
    icon: 'flask-outline' as const,
    color: '#a07230',
    bgColor: '#a0723018',
  },
  {
    id: '5',
    title: 'Storing Your Fragrances',
    subtitle: 'Keep your scents fresh for years',
    icon: 'cube-outline' as const,
    color: '#c4884a',
    bgColor: '#c4884a18',
  },
];

export default function HomeTab() {
  const apiReady = isApiConfigured();
  const insets = useSafeAreaInsets();

  const heroScale = useSharedValue(1.3);
  const heroOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);
  const buttonOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(40);
  const contentOpacity = useSharedValue(0);
  const articlesProgress = useSharedValue(0);

  useEffect(() => {
    heroScale.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
    heroOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    });

    buttonScale.value = withDelay(
      500,
      withSpring(1, { damping: 14, stiffness: 200 }),
    );
    buttonOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 500 }),
    );

    contentTranslateY.value = withDelay(
      300,
      withSpring(0, { damping: 20, stiffness: 180 }),
    );
    contentOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 600 }),
    );

    articlesProgress.value = withDelay(
      700,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }),
    );
  }, []);

  const heroAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
    opacity: heroOpacity.value,
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonOpacity.value,
  }));

  const contentAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
    opacity: contentOpacity.value,
  }));

  const makeArticleStyle = (index: number) =>
    useAnimatedStyle(() => {
      const stagger = index * 0.12;
      const progress = articlesProgress.value;
      return {
        opacity: interpolate(progress, [stagger, stagger + 0.3], [0, 1], 'clamp'),
        transform: [
          {
            translateY: interpolate(
              progress,
              [stagger, stagger + 0.3],
              [30, 0],
              'clamp',
            ),
          },
        ],
      };
    });

  const handleCamera = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission',
        'PerfumeSnap needs camera access to identify perfumes. Please enable it in Settings.',
      );
      return;
    }
    trackCameraOpened();
    router.push('/camera');
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top },
      ]}
      showsVerticalScrollIndicator={false}
      bounces
    >
      {/* Hero Image */}
      <Animated.View style={[styles.heroContainer, heroAnimStyle]}>
        <Image
          source={require('../assets/hero.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(12,10,8,0.6)', Colors.background]}
          locations={[0, 0.6, 1]}
          style={styles.heroOverlay}
        />
      </Animated.View>

      {/* Identify Button */}
      <Animated.View style={[styles.identifySection, buttonAnimStyle]}>
        <TouchableOpacity
          style={styles.identifyButton}
          onPress={handleCamera}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.identifyGradient}
          >
            <View style={styles.identifyIconCircle}>
              <Ionicons name="scan" size={26} color="#fff" />
            </View>
            <View style={styles.identifyTextBlock}>
              <Text style={styles.identifyTitle}>Identify Perfume</Text>
              <Text style={styles.identifyDesc}>
                Take a photo or use your camera
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="rgba(255,255,255,0.6)"
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {!apiReady && (
        <View style={styles.apiBanner}>
          <Ionicons name="key-outline" size={16} color={Colors.gold} />
          <Text style={styles.apiBannerText}>
            Set EXPO_PUBLIC_API_URL in .env to connect to the server
          </Text>
        </View>
      )}

      {/* Perfume Basics Section */}
      <Animated.View style={[styles.basicsSection, contentAnimStyle]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Perfume Basics</Text>
          <Text style={styles.sectionSubtitle}>
            Learn the essentials of fragrance
          </Text>
        </View>

        {ARTICLES.slice(0, 2).map((article, index) => (
          <Animated.View key={article.id} style={makeArticleStyle(index)}>
            <TouchableOpacity
              style={styles.articleCard}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.articleIcon,
                  { backgroundColor: article.bgColor },
                ]}
              >
                <Ionicons
                  name={article.icon}
                  size={22}
                  color={article.color}
                />
              </View>
              <View style={styles.articleText}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleSubtitle}>
                  {article.subtitle}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </Animated.View>
        ))}

        <TouchableOpacity style={styles.readMore} activeOpacity={0.7}>
          <Text style={styles.readMoreText}>Read more</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.footerLine} />
        <Text style={styles.footerText}>PerfumeSnap</Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },

  heroContainer: {
    height: 320,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },

  identifySection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  identifyButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: { elevation: 10 },
    }),
  },
  identifyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  identifyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  identifyTextBlock: {
    flex: 1,
  },
  identifyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#fff',
  },
  identifyDesc: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },

  apiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.gold + '15',
    borderColor: Colors.gold + '30',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  apiBannerText: {
    fontSize: FontSizes.xs,
    color: Colors.gold,
    flex: 1,
  },

  basicsSection: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  articleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  articleTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  articleSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  readMoreText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.primary,
  },

  footer: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    gap: Spacing.sm,
  },
  footerLine: {
    width: 40,
    height: 1,
    backgroundColor: Colors.border,
  },
  footerText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 1,
  },
});
