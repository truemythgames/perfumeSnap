import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
  Keyboard,
  Dimensions,
  ActivityIndicator,
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
import { BorderRadius, Colors, FontSizes, Spacing } from '../constants/theme';
import { FeedbackCategory, submitFeedback } from '../services/api';
import { trackResultFeedback, trackResultFeedbackDetail } from '../services/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DISMISS_THRESHOLD = 120;
const SHEET_OFFSCREEN = 480;

const SHEET_BG = '#f5ead4';
const ROW_BG = '#e8dcc4';
const INPUT_BG = '#ddd0b8';
const TEXT_DARK = '#2a1f0e';
const TEXT_MUTED = '#5c4f3f';
const SUBMIT_DISABLED = ['#d4cbb8', '#c9bea8'] as const;

type FormCategory = 'incorrect' | 'feature' | 'suggestion';

type Props = {
  visible: boolean;
  perfumeName: string;
  perfumeBrand: string;
  onClose: () => void;
};

type RowConfig = {
  key: FeedbackCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  showChevron?: boolean;
};

const ROWS: RowConfig[] = [
  { key: 'like', label: 'I Like These Features', icon: 'heart-outline' },
  { key: 'incorrect', label: 'Incorrect Identification', icon: 'scan-outline', showChevron: true },
  { key: 'feature', label: 'Feature Requests', icon: 'grid-outline', showChevron: true },
  { key: 'suggestion', label: 'More Suggestions', icon: 'chatbubble-outline', showChevron: true },
];

const FORM_TITLES: Record<FormCategory, string> = {
  incorrect: 'Incorrect Identification',
  feature: 'Feature Requests',
  suggestion: 'More Suggestions',
};

const FORM_PLACEHOLDERS: Record<FormCategory, string> = {
  incorrect: 'Please describe the issue.',
  feature: 'What feature would you like to see?',
  suggestion: 'Share your suggestions with us.',
};

export default function ResultFeedbackSheet({
  visible,
  perfumeName,
  perfumeBrand,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_OFFSCREEN);
  const keyboardLift = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const slideX = useSharedValue(0);
  const context = useSharedValue(0);

  const [sheetWidth, setSheetWidth] = useState(SCREEN_WIDTH);
  const [formCategory, setFormCategory] = useState<FormCategory | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetState = useCallback(() => {
    setFormCategory(null);
    setMessage('');
    setSubmitting(false);
    slideX.value = 0;
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
    if (!visible || !formCategory) {
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
  }, [visible, formCategory, insets.bottom]);

  const dismiss = useCallback(() => {
    Keyboard.dismiss();
    keyboardLift.value = withTiming(0, { duration: 150 });
    overlayOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SHEET_OFFSCREEN, { duration: 220 }, () => {
      runOnJS(onClose)();
      runOnJS(resetState)();
    });
  }, [onClose, resetState]);

  const openForm = useCallback(
    (category: FormCategory) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFormCategory(category);
      setMessage('');
      slideX.value = withTiming(-sheetWidth, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    },
    [sheetWidth],
  );

  const goBackToMenu = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    keyboardLift.value = withTiming(0, { duration: 200 });
    slideX.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
    setFormCategory(null);
    setMessage('');
  }, []);

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

  const panelsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const handleLike = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackResultFeedback(true, perfumeName, perfumeBrand);
    const ok = await submitFeedback(perfumeName, perfumeBrand, 'like');
    dismiss();
    if (ok) {
      Alert.alert('Thank you!', 'Glad you’re enjoying PerfumeSnap.');
    } else {
      Alert.alert('Could not send feedback', 'Check your connection and try again.');
    }
  }, [dismiss, perfumeBrand, perfumeName]);

  const handleSubmitForm = useCallback(async () => {
    if (!formCategory || !message.trim() || submitting) return;
    setSubmitting(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (formCategory === 'incorrect') {
      trackResultFeedback(false, perfumeName, perfumeBrand);
    }
    trackResultFeedbackDetail(formCategory, perfumeName, perfumeBrand, message.trim().length);
    const ok = await submitFeedback(perfumeName, perfumeBrand, formCategory, message.trim());
    setSubmitting(false);
    if (!ok) {
      Alert.alert('Could not send feedback', 'Check your connection and try again.');
      return;
    }
    dismiss();
    Alert.alert('Thank you!', 'Your feedback helps us improve PerfumeSnap.');
  }, [formCategory, message, submitting, dismiss, perfumeBrand, perfumeName]);

  const handleRow = useCallback(
    (action: FeedbackCategory) => {
      if (action === 'like') {
        void handleLike();
        return;
      }
      openForm(action);
    },
    [handleLike, openForm],
  );

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlayBg, overlayStyle]} />
      <Pressable style={styles.overlay} onPress={formCategory ? goBackToMenu : dismiss}>
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              sheetStyle,
              { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
            ]}
            onLayout={(e) => setSheetWidth(e.nativeEvent.layout.width)}
          >
            <View style={styles.handle} />

            <View style={styles.panelsClip}>
                <Animated.View
                  style={[
                    styles.panelsRow,
                    { width: sheetWidth * 2 },
                    panelsStyle,
                  ]}
                >
                  {/* Menu */}
                  <View style={[styles.panel, { width: sheetWidth }]}>
                    <View style={styles.headerRow}>
                      <Text style={styles.title}>Any Feedback to Share?</Text>
                      <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={dismiss}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={18} color={TEXT_DARK} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.options}>
                      {ROWS.map((row) => (
                        <TouchableOpacity
                          key={row.key}
                          style={styles.optionRow}
                          activeOpacity={0.75}
                          onPress={() => handleRow(row.key)}
                        >
                          <Ionicons name={row.icon} size={22} color={TEXT_DARK} />
                          <Text style={styles.optionLabel}>{row.label}</Text>
                          {row.showChevron ? (
                            <Ionicons name="chevron-forward" size={20} color={TEXT_MUTED} />
                          ) : null}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Write form */}
                  <View style={[styles.panel, { width: sheetWidth }]}>
                    <View style={styles.formHeaderRow}>
                      <TouchableOpacity
                        style={styles.backChevron}
                        onPress={goBackToMenu}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="chevron-back" size={24} color={TEXT_DARK} />
                      </TouchableOpacity>
                      <Text style={styles.title} numberOfLines={2}>
                        {formCategory ? FORM_TITLES[formCategory] : ''}
                      </Text>
                      <View style={styles.backChevronSpacer} />
                    </View>

                    <TextInput
                      style={styles.textInput}
                      placeholder={formCategory ? FORM_PLACEHOLDERS[formCategory] : ''}
                      placeholderTextColor={TEXT_MUTED}
                      value={message}
                      onChangeText={setMessage}
                      multiline
                      textAlignVertical="top"
                      maxLength={2000}
                      editable={!submitting}
                    />

                    <TouchableOpacity
                      style={[
                        styles.submitBtnWrap,
                        (!message.trim() || submitting) && styles.submitBtnWrapDisabled,
                      ]}
                      activeOpacity={0.85}
                      disabled={!message.trim() || submitting}
                      onPress={() => void handleSubmitForm()}
                    >
                      <LinearGradient
                        colors={
                          !message.trim() || submitting
                            ? [...SUBMIT_DISABLED]
                            : [Colors.primary, Colors.primaryDark]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.submitBtn}
                      >
                        {submitting ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text
                            style={[
                              styles.submitText,
                              (!message.trim() || submitting) && styles.submitTextDisabled,
                            ]}
                          >
                            Submit
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>
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
  panelsClip: {
    overflow: 'hidden',
  },
  panelsRow: {
    flexDirection: 'row',
  },
  panel: {
    paddingHorizontal: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    minHeight: 32,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    minHeight: 36,
  },
  backChevron: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backChevronSpacer: {
    width: 36,
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
  options: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: ROW_BG,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.md,
  },
  optionLabel: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: TEXT_DARK,
  },
  textInput: {
    minHeight: 160,
    backgroundColor: INPUT_BG,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: TEXT_DARK,
    marginBottom: Spacing.lg,
  },
  submitBtnWrap: {
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
  submitBtnWrapDisabled: {
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  submitBtn: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  submitText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  submitTextDisabled: {
    color: 'rgba(42,31,14,0.45)',
  },
});
