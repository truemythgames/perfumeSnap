import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontSizes, Spacing } from '../constants/theme';
import { useArticles } from '../hooks/useArticles';

const CARD_WIDTH = Dimensions.get('window').width - Spacing.md * 2;
const IMAGE_HEIGHT = 140;

export default function ArticlesScreen() {
  const insets = useSafeAreaInsets();
  const { articles } = useArticles();

  useEffect(() => {
    router.prefetch('/article');
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Perfume Basics</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {articles.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleCard}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/article', params: { id: article.id } })}
          >
            {article.imageUrl ? (
              <Image
                source={{ uri: article.imageUrl }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.cardImagePlaceholder, { backgroundColor: article.color + '20' }]}>
                <Ionicons name={article.icon as any} size={28} color={article.color} />
              </View>
            )}
            <View style={styles.cardBody}>
              <View style={styles.cardMeta}>
                {article.tags.slice(0, 2).map((tag) => (
                  <Text key={tag} style={styles.cardTag}>{tag}</Text>
                ))}
                <Text style={styles.cardTime}>{article.readingTime} min</Text>
              </View>
              <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
              <Text style={styles.articleSubtitle} numberOfLines={2}>{article.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  title: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  articleCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    width: CARD_WIDTH,
  },
  cardImage: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: IMAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: Spacing.md,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTag: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs - 1,
    fontWeight: '600',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  cardTime: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs - 1,
    marginLeft: 'auto',
  },
  articleTitle: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '700',
    lineHeight: 22,
  },
  articleSubtitle: {
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    lineHeight: 18,
  },
});
