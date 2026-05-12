import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import HomeTab from '../components/HomeTab';
import CollectionTab from '../components/CollectionTab';
import { Colors } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAMERA_BTN_SIZE = 70;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SPRING_CONFIG = { damping: 22, stiffness: 250, mass: 0.8 };

export default function MainScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const translateX = useSharedValue(0);
  const insets = useSafeAreaInsets();

  const switchTab = (page: number) => {
    setActiveTab(page);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goToPage = (page: number) => {
    translateX.value = withSpring(-page * SCREEN_WIDTH, SPRING_CONFIG);
    if (page !== activeTab) switchTab(page);
  };

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const decided = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((e) => {
      const t = e.allTouches[0];
      if (t) {
        startX.value = t.absoluteX;
        startY.value = t.absoluteY;
        decided.value = false;
      }
    })
    .onTouchesMove((e, state) => {
      if (decided.value) return;
      const t = e.allTouches[0];
      if (!t) return;
      const dx = Math.abs(t.absoluteX - startX.value);
      const dy = Math.abs(t.absoluteY - startY.value);
      if (dx > 10 && dx > dy * 1.2) {
        decided.value = true;
        state.activate();
      } else if (dy > 10) {
        decided.value = true;
        state.fail();
      }
    })
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
      const base = -activeTab * SCREEN_WIDTH;
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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
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
            <CollectionTab />
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
          <View style={styles.cameraButtonWrapper}>
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
    backgroundColor: Colors.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
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
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  cameraNotch: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -(CAMERA_BTN_SIZE / 2 + 8),
    width: CAMERA_BTN_SIZE + 20,
    height: CAMERA_BTN_SIZE + 16,
    borderRadius: (CAMERA_BTN_SIZE + 20) / 2,
    backgroundColor: Colors.surfaceLight,
    paddingTop: 4,
  },
  cameraButtonWrapper: {
    borderRadius: CAMERA_BTN_SIZE / 2,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  cameraButton: {
    width: CAMERA_BTN_SIZE,
    height: CAMERA_BTN_SIZE,
    borderRadius: CAMERA_BTN_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
