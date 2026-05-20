import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BorderRadius, Colors, FontSizes, Spacing } from '../constants/theme';
import { useArticles } from '../hooks/useArticles';
import { getArticleById } from '../constants/articles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 300;

export default function ArticleScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const { articles } = useArticles();

  const article = useMemo(() => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    return id ? getArticleById(articles, id) : null;
  }, [params.id, articles]);

  if (!article) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Article</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Article not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const scrollY = useSharedValue(0);

  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  }, []);

  const backBgStyle = useAnimatedStyle(() => {
    const threshold = HERO_HEIGHT - 60;
    const p = interpolate(scrollY.value, [threshold - 30, threshold], [0, 1], Extrapolation.CLAMP);
    const r = Math.round(p * 240);
    const g = Math.round(p * 232);
    const b = Math.round(p * 218);
    const a = 0.5 + p * 0.5;
    return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})` };
  });

  const backIconWhiteStyle = useAnimatedStyle(() => {
    const threshold = HERO_HEIGHT - 60;
    const p = interpolate(scrollY.value, [threshold - 30, threshold], [0, 1], Extrapolation.CLAMP);
    return { opacity: 1 - p };
  });

  const backIconDarkStyle = useAnimatedStyle(() => {
    const threshold = HERO_HEIGHT - 60;
    const p = interpolate(scrollY.value, [threshold - 30, threshold], [0, 1], Extrapolation.CLAMP);
    return { opacity: p };
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        bounces
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Hero Image */}
        {article.imageUrl ? (
          <View style={styles.heroWrap}>
            <Image source={{ uri: article.imageUrl }} style={styles.heroImage} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(12,10,8,0.3)', 'rgba(12,10,8,0.0)', 'rgba(12,10,8,0.85)', Colors.background]}
              locations={[0, 0.3, 0.75, 1]}
              style={styles.heroGradient}
            />
          </View>
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: article.color + '20' }]}>
            <Ionicons name={article.icon as any} size={48} color={article.color} />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.meta}>
            {article.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            <Text style={styles.readTime}>{article.readingTime} min read</Text>
          </View>

          <Text style={styles.heading}>{article.title}</Text>
          <Text style={styles.subheading}>{article.subtitle}</Text>

          {article.sections.map((section, idx) => {
            if (section.type === 'heading') {
              return (
                <Text key={idx} style={styles.sectionHeading}>
                  {section.text}
                </Text>
              );
            }
            if (section.type === 'subheading') {
              return (
                <Text key={idx} style={styles.sectionSubheading}>
                  {section.text}
                </Text>
              );
            }
            if (section.type === 'list' && section.items) {
              return (
                <View key={idx} style={styles.listWrap}>
                  {section.items.map((item, i) => (
                    <View key={i} style={styles.listItem}>
                      <View style={[styles.bullet, { backgroundColor: article.color }]} />
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              );
            }
            return (
              <Text key={idx} style={styles.paragraph}>
                {section.text}
              </Text>
            );
          })}
        </View>

      </ScrollView>

      {/* Sticky back button — outside ScrollView */}
      <View style={[styles.backRow, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Animated.View style={[styles.heroBackButton, backBgStyle]}>
            <Animated.View style={[StyleSheet.absoluteFill, styles.heroBackIconWrap, backIconWhiteStyle]}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, styles.heroBackIconWrap, backIconDarkStyle]}>
              <Ionicons name="arrow-back" size={24} color="#2a1f0e" />
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(200,148,60,0.2)',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  heroWrap: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroPlaceholder: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
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
  content: {
    paddingHorizontal: Spacing.lg,
    marginTop: -20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  tag: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs - 1,
    fontWeight: '600',
  },
  readTime: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs - 1,
    marginLeft: 'auto',
  },
  heading: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  subheading: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    marginTop: 6,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  sectionHeading: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionSubheading: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  paragraph: {
    color: Colors.text,
    fontSize: FontSizes.md,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  listWrap: {
    marginBottom: Spacing.md,
    gap: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
  },
  listText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    lineHeight: 24,
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  backLink: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backLinkText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
});
