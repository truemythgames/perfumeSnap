import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SHEET_CREAM = '#f5ead4';
const TEXT_DARK = '#2a1f0e';

export type CoachmarkAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Props = {
  visible: boolean;
  anchor: CoachmarkAnchor | null;
  onDismiss: () => void;
};

export default function ScanCoachmark({ visible, anchor, onDismiss }: Props) {
  const overlayOpacity = useSharedValue(0);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    if (!visible || !anchor) return;
    overlayOpacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [visible, anchor]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  if (!visible || !anchor) return null;

  const pad = 10;
  const holeX = anchor.x - pad;
  const holeY = anchor.y - pad;
  const holeW = anchor.width + pad * 2;
  const holeH = anchor.height + pad * 2;
  const holeCX = holeX + holeW / 2;
  const holeCY = holeY + holeH / 2;
  const holeR = Math.max(holeW, holeH) / 2;

  const tooltipBottom = SCREEN_HEIGHT - holeY + Spacing.md + 12;
  const ringLeft = holeCX - holeR;
  const ringTop = holeCY - holeR;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]} pointerEvents="box-none">
        {/* Dim regions around spotlight hole */}
        <Pressable style={[styles.dim, { top: 0, left: 0, right: 0, height: holeY }]} onPress={onDismiss} />
        <Pressable
          style={[styles.dim, { top: holeY + holeH, left: 0, right: 0, bottom: 0 }]}
          onPress={onDismiss}
        />
        <Pressable
          style={[styles.dim, { top: holeY, left: 0, width: holeX, height: holeH }]}
          onPress={onDismiss}
        />
        <Pressable
          style={[styles.dim, { top: holeY, left: holeX + holeW, right: 0, height: holeH }]}
          onPress={onDismiss}
        />

        {/* Pulsing ring on scan button */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            ringStyle,
            {
              left: ringLeft,
              top: ringTop,
              width: holeR * 2,
              height: holeR * 2,
              borderRadius: holeR,
            },
          ]}
        />

        {/* Tooltip */}
        <View style={[styles.tooltipWrap, { bottom: tooltipBottom }]} pointerEvents="none">
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>Tap here to identify your perfume</Text>
          </View>
          <View style={styles.caret} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  dim: {
    position: 'absolute',
    backgroundColor: 'rgba(8,6,5,0.78)',
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 14,
      },
      android: { elevation: 12 },
    }),
  },
  tooltipWrap: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
  },
  tooltip: {
    backgroundColor: SHEET_CREAM,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(160,114,48,0.35)',
    maxWidth: 320,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  tooltipText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: TEXT_DARK,
    textAlign: 'center',
    lineHeight: 22,
    ...(Platform.OS === 'ios' ? { fontFamily: 'Georgia' } : {}),
  },
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: SHEET_CREAM,
    marginTop: -1,
  },
});
