import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Platform,
  TextInput,
  Keyboard,
  ActivityIndicator,
  Alert,
  type KeyboardEvent,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BorderRadius, Colors, FontSizes, Spacing } from '../constants/theme';
import { exportCollection } from '../services/api';
import { getPremiumStatus } from '../services/access';

const DISMISS_THRESHOLD = 120;
const SHEET_OFFSCREEN = 480;

const SHEET_BG = '#f5ead4';
const ROW_BG = '#e8dcc4';
const INPUT_BG = '#ddd0b8';
const TEXT_DARK = '#2a1f0e';
const TEXT_MUTED = '#5c4f3f';
const SUBMIT_DISABLED = ['#d4cbb8', '#c9bea8'] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  visible: boolean;
  itemCount: number;
  itemIds?: string[];
  onClose: () => void;
};

export default function ExportSheet({ visible, itemCount, itemIds, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_OFFSCREEN);
  const keyboardLift = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const context = useSharedValue(0);

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = EMAIL_REGEX.test(email.trim());
  const label = itemIds && itemIds.length > 0
    ? `${itemIds.length} item${itemIds.length !== 1 ? 's' : ''}`
    : `${itemCount} item${itemCount !== 1 ? 's' : ''}`;

  const resetState = useCallback(() => {
    setEmail('');
    setSubmitting(false);
    keyboardLift.value = 0;
    Keyboard.dismiss();
  }, []);

  useEffect(() => {
    if (!visible) return;
    resetState();
    translateY.value = SHEET_OFFSCREEN;
    overlayOpacity.value = 0;
    translateY.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
    overlayOpacity.value = withTiming(1, { duration: 280 });
  }, [visible, resetState]);

  useEffect(() => {
    if (!visible) {
      keyboardLift.value = withTiming(0, { duration: 200 });
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      const lift = e.endCoordinates.height - insets.bottom + Spacing.md;
      keyboardLift.value = withTiming(Math.max(0, lift), {
        duration: Platform.OS === 'ios' ? e.duration : 250,
        easing: Easing.out(Easing.ease),
      });
    };
    const onHide = () => {
      keyboardLift.value = withTiming(0, { duration: Platform.OS === 'ios' ? 250 : 200 });
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible, insets.bottom]);

  const dismiss = useCallback(() => {
    Keyboard.dismiss();
    keyboardLift.value = withTiming(0, { duration: 150 });
    overlayOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SHEET_OFFSCREEN, { duration: 220 }, () => {
      runOnJS(onClose)();
      runOnJS(resetState)();
    });
  }, [onClose, resetState]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = translateY.value;
    })
    .onUpdate((e) => {
      const y = Math.max(0, context.value + e.translationY);
      translateY.value = y;
      overlayOpacity.value = interpolate(y, [0, SHEET_OFFSCREEN], [1, 0], 'clamp');
    })
    .onEnd((e) => {
      if (translateY.value > DISMISS_THRESHOLD || e.velocityY > 500) {
        overlayOpacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(SHEET_OFFSCREEN, { duration: 220 }, () => {
          runOnJS(onClose)();
          runOnJS(resetState)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
        overlayOpacity.value = withTiming(1, { duration: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value - keyboardLift.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const handleExport = useCallback(async () => {
    if (!isValid || submitting) return;

    const premium = await getPremiumStatus();
    if (!premium) {
      router.push('/sales');
      return;
    }

    setSubmitting(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await exportCollection(email.trim(), itemIds);
      setSubmitting(false);
      if (res.ok) {
        dismiss();
        setTimeout(() => {
          Alert.alert(
            'Export Requested',
            `Your collection will be emailed to ${email.trim()} within a few minutes.`,
          );
        }, 300);
      } else {
        Alert.alert('Export Failed', res.error || 'Please check your connection and try again.');
      }
    } catch {
      setSubmitting(false);
      Alert.alert('Export Failed', 'Please check your connection and try again.');
    }
  }, [isValid, submitting, email, itemIds, dismiss]);

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlayBg, overlayStyle]} />
      <Pressable style={styles.overlay} onPress={dismiss}>
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              sheetStyle,
              { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
            ]}
          >
            <Pressable>
              <View style={styles.handle} />

              <View style={styles.headerRow}>
                <Text style={styles.title}>Export</Text>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={dismiss}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color={TEXT_DARK} />
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                <Text style={styles.description}>
                  <Text style={styles.descriptionBold}>{label}</Text> will be exported and emailed
                  to you within 10 minutes.
                </Text>

                <Text style={styles.inputLabel}>Email address to receive</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.emailInput}
                    placeholder="you@example.com"
                    placeholderTextColor={TEXT_MUTED}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={!submitting}
                    returnKeyType="send"
                    onSubmitEditing={() => void handleExport()}
                  />
                  {email.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearBtn}
                      onPress={() => setEmail('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color={TEXT_MUTED} />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.exportBtnWrap,
                    (!isValid || submitting) && styles.exportBtnWrapDisabled,
                  ]}
                  activeOpacity={0.85}
                  disabled={!isValid || submitting}
                  onPress={() => void handleExport()}
                >
                  <LinearGradient
                    colors={
                      !isValid || submitting
                        ? [...SUBMIT_DISABLED]
                        : [Colors.primary, Colors.primaryDark]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.exportBtn}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text
                        style={[
                          styles.exportText,
                          (!isValid || submitting) && styles.exportTextDisabled,
                        ]}
                      >
                        Export
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    backgroundColor: 'rgba(12,10,8,0.55)',
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderColor: 'rgba(160,114,48,0.25)',
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(42,31,14,0.2)',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    minHeight: 32,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    flex: 1,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: TEXT_DARK,
    textAlign: 'center',
    ...(Platform.OS === 'ios' ? { fontFamily: 'Georgia' } : {}),
  },
  closeBtn: {
    position: 'absolute',
    right: Spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ROW_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: Spacing.lg,
  },
  description: {
    fontSize: FontSizes.md,
    color: TEXT_DARK,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  descriptionBold: {
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    color: TEXT_MUTED,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  emailInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: TEXT_DARK,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.md,
  },
  clearBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  exportBtnWrap: {
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#6b4e14',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.32,
        shadowRadius: 6,
      },
      android: { elevation: 5 },
    }),
  },
  exportBtnWrapDisabled: {
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  exportBtn: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  exportText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  exportTextDisabled: {
    color: 'rgba(42,31,14,0.45)',
  },
});
