import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL_PADDING = 20;
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_PADDING * 2;
const CARD_HEIGHT = CARD_WIDTH * 1.32;
const CORNER_SIZE = 36;
const CORNER_WIDTH = 3.5;
const MAX_ZOOM = 0.40;
const SLIDER_H_PAD = 56;
const TRACK_WIDTH = SCREEN_WIDTH - (SLIDER_H_PAD * 2) - 80 - 32;

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const INITIAL_ZOOM_PCT = 0.25;
  const [zoom, setZoom] = useState(MAX_ZOOM * INITIAL_ZOOM_PCT);
  const insets = useSafeAreaInsets();
  const captureScale = useSharedValue(1);
  const capturePulse = useSharedValue(0);
  const shutterDim = useSharedValue(0);
  const sliderX = useSharedValue(TRACK_WIDTH * INITIAL_ZOOM_PCT);

  useEffect(() => {
    capturePulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const captureAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureScale.value * (1 + capturePulse.value * 0.04) }],
    opacity: 0.92 + capturePulse.value * 0.08,
  }));

  const shutterStyle = useAnimatedStyle(() => ({
    opacity: shutterDim.value,
  }));

  const updateZoom = (val: number) => setZoom(val * MAX_ZOOM);
  const panStart = useSharedValue(0);

  const sliderGesture = Gesture.Pan()
    .onBegin(() => {
      panStart.value = sliderX.value;
    })
    .onUpdate((e) => {
      const raw = Math.max(0, Math.min(TRACK_WIDTH, panStart.value + e.translationX));
      sliderX.value = raw;
      runOnJS(updateZoom)(raw / TRACK_WIDTH);
    })
    .hitSlop({ top: 20, bottom: 20, left: 10, right: 10 });

  const sliderTap = Gesture.Tap()
    .onEnd((e) => {
      const raw = Math.max(0, Math.min(TRACK_WIDTH, e.x));
      sliderX.value = raw;
      runOnJS(updateZoom)(raw / TRACK_WIDTH);
    });

  const sliderComposed = Gesture.Race(sliderGesture, sliderTap);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: sliderX.value,
  }));

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          PerfumeSnap needs camera access to identify perfumes from photos.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
        shutterSound: false,
      });
      if (photo?.uri) {
        router.replace({
          pathname: '/result',
          params: { imageUri: photo.uri },
        });
      }
    } catch (err) {
      console.error('Failed to take picture:', err);
      shutterDim.value = withTiming(0, { duration: 200 });
      setCapturing(false);
    }
  };

  const pickFromLibrary = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission',
        'PerfumeSnap needs photo library access. Please enable it in Settings.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
      allowsEditing: true,
      aspect: [3, 4],
    });

    if (!result.canceled && result.assets[0]?.base64) {
      router.replace({
        pathname: '/result',
        params: {
          imageUri: result.assets[0].uri,
          imageBase64: result.assets[0].base64,
        },
      });
    }
  };

  const adjustZoom = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.max(0, Math.min(MAX_ZOOM, zoom + delta * MAX_ZOOM));
    setZoom(next);
    sliderX.value = (next / MAX_ZOOM) * TRACK_WIDTH;
  };

  return (
    <GestureHandlerRootView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.topButton} onPress={() => setTorch(!torch)}>
            <Ionicons
              name={torch ? 'flash' : 'flash-off-outline'}
              size={20}
              color={torch ? Colors.gold : Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera card */}
      <View style={styles.cameraCard}>
        <CameraView
          ref={cameraRef}
          style={styles.cameraFeed}
          facing="back"
          enableTorch={torch}
          zoom={zoom}
        />
        {/* Corner brackets + hint */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.bracketSquare}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          <Text style={styles.hintText}>Place the item in focus</Text>
        </View>
      </View>

      {/* Zoom slider */}
      <View style={styles.zoomRow}>
        <TouchableOpacity onPress={() => adjustZoom(-0.1)} style={styles.zoomButton}>
          <Ionicons name="remove" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <GestureDetector gesture={sliderComposed}>
          <View style={styles.zoomTrackHitArea}>
            <View style={styles.zoomTrack}>
              <Animated.View style={[styles.zoomFill, fillStyle]} />
            </View>
            <Animated.View style={[styles.zoomThumb, thumbStyle]} />
          </View>
        </GestureDetector>
        <TouchableOpacity onPress={() => adjustZoom(0.1)} style={styles.zoomButton}>
          <Ionicons name="add" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity style={styles.sideButton} onPress={pickFromLibrary}>
          <Ionicons name="images-outline" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        <Animated.View style={captureAnimStyle}>
          <TouchableOpacity
            onPress={takePicture}
            disabled={capturing}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.captureOuter}
            >
              <View style={styles.captureInner} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.sideButton}>
          <Ionicons name="help-outline" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {/* Shutter dim feedback over camera card */}
      <Animated.View
        style={[styles.shutterDim, shutterStyle]}
        pointerEvents="none"
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  shutterDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 100,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  hintText: {
    position: 'absolute',
    top: Spacing.md,
    left: 0,
    right: 0,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },

  cameraCard: {
    marginTop: Spacing.sm,
    marginHorizontal: CARD_HORIZONTAL_PADDING,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  cameraFeed: {
    flex: 1,
  },

  bracketSquare: {
    position: 'absolute',
    width: CARD_WIDTH - Spacing.xl * 2,
    height: CARD_WIDTH - Spacing.xl * 2,
    alignSelf: 'center',
    left: Spacing.xl,
    top: '50%',
    marginTop: -(CARD_WIDTH - Spacing.xl * 2) / 2,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: 'rgba(255,255,255,0.5)',
  },

  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl + Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomTrackHitArea: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    marginHorizontal: Spacing.md,
  },
  zoomTrack: {
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
  },
  zoomFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  zoomThumb: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    marginLeft: -16,
    borderWidth: 3,
    borderColor: Colors.background,
    top: (50 - 32) / 2,
  },

  bottomBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl + Spacing.md,
  },

  sideButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  captureOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  permissionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  permissionText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  permissionButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#fff',
  },
});
