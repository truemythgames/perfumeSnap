import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { identifyPerfume, getApiUrl, PerfumeResult } from '../services/api';
import LoadingOverlay from '../components/LoadingOverlay';
import NoteChip from '../components/NoteChip';
import InfoRow from '../components/InfoRow';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ResultScreen() {
  const { imageUri, imageBase64 } = useLocalSearchParams<{
    imageUri: string;
    imageBase64: string;
  }>();
  const [result, setResult] = useState<PerfumeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (imageBase64) {
      identify();
    }
  }, [imageBase64]);

  const identify = async () => {
    setLoading(true);
    setError(null);
    console.log('[PerfumeSnap] API URL:', getApiUrl());
    try {
      const perfume = await identifyPerfume(imageBase64!);
      if (!perfume.identified) {
        setError('Could not identify this perfume. Try a clearer photo of the bottle or label.');
      } else {
        setResult(perfume);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={18} color={Colors.gold} />
        );
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <Ionicons key={i} name="star-half" size={18} color={Colors.gold} />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={18} color={Colors.textMuted} />
        );
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} blurRadius={20} />
        )}
        <LoadingOverlay />
      </View>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={[Colors.background, '#12151c']} style={{ flex: 1 }}>
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Identification Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.retryButton} onPress={identify}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.backText}>Take New Photo</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!result) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.heroImage} />
          )}
          <LinearGradient
            colors={['transparent', Colors.background]}
            style={styles.heroGradient}
          />
          <SafeAreaView style={styles.heroOverlay}>
            <TouchableOpacity
              style={styles.heroBackButton}
              onPress={() => router.replace('/')}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>
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

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{result.description}</Text>
        </View>

        {/* Fragrance Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fragrance Notes</Text>

          <View style={styles.notesGroup}>
            <Text style={styles.notesLabel}>🌟 Top Notes</Text>
            <View style={styles.chipRow}>
              {result.topNotes.map((note, i) => (
                <NoteChip key={i} label={note} color={Colors.accent} />
              ))}
            </View>
          </View>

          <View style={styles.notesGroup}>
            <Text style={styles.notesLabel}>💜 Heart Notes</Text>
            <View style={styles.chipRow}>
              {result.heartNotes.map((note, i) => (
                <NoteChip key={i} label={note} color={Colors.primary} />
              ))}
            </View>
          </View>

          <View style={styles.notesGroup}>
            <Text style={styles.notesLabel}>🌲 Base Notes</Text>
            <View style={styles.chipRow}>
              {result.baseNotes.map((note, i) => (
                <NoteChip key={i} label={note} color={Colors.gold} />
              ))}
            </View>
          </View>
        </View>

        {/* Details */}
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

        {/* Occasions & Seasons */}
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

        {/* Similar Perfumes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Similar Perfumes</Text>
          <View style={styles.card}>
            {result.similarPerfumes.map((perfume, i) => (
              <View key={i} style={styles.similarItem}>
                <Text style={styles.similarIcon}>🔸</Text>
                <Text style={styles.similarText}>{perfume}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Scan Again Button */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.9,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  heroBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.lg,
    marginTop: Spacing.sm,
  },
  mainInfo: {
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.xl,
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
