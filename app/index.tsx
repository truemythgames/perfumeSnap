import React, { useCallback, useEffect, useRef, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import HomeTab from '../components/HomeTab';
import CollectionTab, { CollectionTabHandle } from '../components/CollectionTab';
import ScanCoachmark, { type CoachmarkAnchor } from '../components/ScanCoachmark';
import { Colors, Spacing, FontSizes } from '../constants/theme';
import { trackCameraOpened, trackTabSwitch } from '../services/analytics';
import { FREE_LIMITS, getScanAllowance } from '../services/access';
import { hasSeenScanCoachmark, markScanCoachmarkSeen } from '../services/coachmark';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAMERA_BTN_SIZE = 70;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SPRING_CONFIG = { damping: 22, stiffness: 250, mass: 0.8 };
const NOTCH_OVERFLOW = CAMERA_BTN_SIZE / 2 + 8;

export default function MainScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab = params.tab === 'collection' ? 1 : 0;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editState, setEditState] = useState({ editing: false, selectedCount: 0 });
  const collectionRef = useRef<CollectionTabHandle>(null);
  const cameraAnchorRef = useRef<View>(null);
  const translateX = useSharedValue(-initialTab * SCREEN_WIDTH);
  const insets = useSafeAreaInsets();
  const [showScanCoachmark, setShowScanCoachmark] = useState(false);
  const [coachmarkAnchor, setCoachmarkAnchor] = useState<CoachmarkAnchor | null>(null);

  useEffect(() => {
    hasSeenScanCoachmark().then((seen) => {
      if (!seen) setShowScanCoachmark(true);
    });
  }, []);

  const measureCameraAnchor = useCallback(() => {
    cameraAnchorRef.current?.measureInWindow((x, y, width, height) => {
      setCoachmarkAnchor({ x, y, width, height });
    });
  }, []);

  useLayoutEffect(() => {
    if (!showScanCoachmark) return;
    const t1 = setTimeout(measureCameraAnchor, 80);
    const t2 = setTimeout(measureCameraAnchor, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [showScanCoachmark, measureCameraAnchor, activeTab, insets.bottom]);

  const dismissScanCoachmark = useCallback(() => {
    setShowScanCoachmark(false);
    void markScanCoachmarkSeen();
  }, []);

  const handleEditStateChange = useCallback(
    (state: { editing: boolean; selectedCount: number }) => setEditState(state),
    [],
  );

  const editOverlayTranslateY = useSharedValue(200);

  useEffect(() => {
    editOverlayTranslateY.value = withTiming(
      editState.editing ? 0 : 200,
      { duration: 280, easing: Easing.out(Easing.cubic) },
    );
  }, [editState.editing]);

  const editOverlayAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: editOverlayTranslateY.value }],
  }));

  const switchTab = (page: number) => {
    setActiveTab(page);
    trackTabSwitch(page === 0 ? 'home' : 'collection');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goToPage = (page: number) => {
    translateX.value = withSpring(-page * SCREEN_WIDTH, SPRING_CONFIG);
    if (page !== activeTab) switchTab(page);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      const base = -activeTab * SCREEN_WIDTH;
      const next = base + e.translationX;
      const min = -(1) * SCREEN_WIDTH;
      const max = 0;

      if (next > max) {
        translateX.value = max + (next - max) * 0.2;
      } else if (next < min) {
        translateX.value = min + (next - min) * 0.2;
      } else {
        translateX.value = next;
      }
    })
    .onEnd((e) => {
      const displacement = e.translationX;
      const velocity = e.velocityX;
      const shouldSwipe =
        Math.abs(displacement) > SWIPE_THRESHOLD ||
        Math.abs(velocity) > 600;

      let targetPage = activeTab;
      if (shouldSwipe && displacement < 0 && activeTab < 1) {
        targetPage = activeTab + 1;
      } else if (shouldSwipe && displacement > 0 && activeTab > 0) {
        targetPage = activeTab - 1;
      }

      translateX.value = withSpring(
        -targetPage * SCREEN_WIDTH,
        SPRING_CONFIG,
      );

      if (targetPage !== activeTab) {
        runOnJS(switchTab)(targetPage);
      }
    });

  const animatedPagerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleCamera = async () => {
    if (showScanCoachmark) dismissScanCoachmark();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const allowance = await getScanAllowance();
    if (!allowance.allowed) {
      Alert.alert(
        'Daily Scan Limit Reached',
        `Free plan includes ${FREE_LIMITS.dailyScans} scans per day. Unlock Premium for unlimited scans.`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Unlock', onPress: () => router.push('/sales') },
        ],
      );
      return;
    }
    trackCameraOpened();
    router.push('/camera');
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.pager, animatedPagerStyle]}>
          <View style={styles.page}>
            <HomeTab />
          </View>
          <View style={styles.page}>
            <CollectionTab ref={collectionRef} onEditStateChange={handleEditStateChange} />
          </View>
        </Animated.View>
      </GestureDetector>

      <View style={[styles.tabBar, { paddingBottom: insets.bottom || 12 }]}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => goToPage(0)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 0 ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 0 ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.tabLabel, activeTab === 0 && styles.tabLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <View style={styles.cameraNotch}>
          <View
            ref={cameraAnchorRef}
            style={[
              styles.cameraButtonWrapper,
              showScanCoachmark && styles.cameraButtonAboveCoachmark,
            ]}
            onLayout={() => {
              if (showScanCoachmark) measureCameraAnchor();
            }}
          >
            <TouchableOpacity
              onPress={handleCamera}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cameraButton}
              >
                <Ionicons name="camera" size={32} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => goToPage(1)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 1 ? 'albums' : 'albums-outline'}
            size={22}
            color={activeTab === 1 ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.tabLabel, activeTab === 1 && styles.tabLabelActive]}>
            Collection
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.editOverlay,
          { paddingBottom: insets.bottom || 12 },
          editOverlayAnimStyle,
        ]}
        pointerEvents={editState.editing ? 'auto' : 'none'}
      >
        <View style={styles.editOverlayRow}>
          <TouchableOpacity
            style={styles.editOverlayBtn}
            onPress={() => collectionRef.current?.deleteSelected()}
            disabled={editState.selectedCount === 0}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={editState.selectedCount > 0 ? Colors.error : Colors.textMuted}
            />
            <Text style={[
              styles.editOverlayText,
              { color: editState.selectedCount > 0 ? Colors.error : Colors.textMuted },
            ]}>
              Delete
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.editOverlayBtn}>
            <Ionicons name="share-outline" size={22} color={Colors.textMuted} />
            <Text style={[styles.editOverlayText, { color: Colors.textMuted }]}>
              Export
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScanCoachmark
        visible={showScanCoachmark && activeTab === 0}
        anchor={coachmarkAnchor}
        onDismiss={dismissScanCoachmark}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  pager: {
    flex: 1,
    flexDirection: 'row',
    width: SCREEN_WIDTH * 2,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#141110',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(200,148,60,0.2)',
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  cameraNotch: {
    width: CAMERA_BTN_SIZE + 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -NOTCH_OVERFLOW,
  },
  cameraButtonWrapper: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  cameraButtonAboveCoachmark: {
    zIndex: 210,
    ...Platform.select({
      android: { elevation: 210 },
    }),
  },
  cameraButton: {
    width: CAMERA_BTN_SIZE,
    height: CAMERA_BTN_SIZE,
    borderRadius: CAMERA_BTN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#141110',
  },
  editOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#141110',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(200,148,60,0.2)',
    paddingTop: Spacing.md,
    zIndex: 50,
  },
  editOverlayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xl,
  },
  editOverlayBtn: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    minWidth: 72,
  },
  editOverlayText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
