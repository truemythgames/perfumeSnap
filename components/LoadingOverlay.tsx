import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, FontSizes, Spacing } from '../constants/theme';

const MESSAGES = [
  'Analyzing fragrance bottle...',
  'Identifying brand and name...',
  'Detecting fragrance notes...',
  'Checking market data...',
  'Preparing your results...',
];

export default function LoadingOverlay() {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [messageIndex, setMessageIndex] = React.useState(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
      <View style={styles.container}>
        <Animated.View
          style={[styles.spinner, { transform: [{ rotate: rotation }] }]}
        >
          <View style={styles.spinnerInner} />
        </Animated.View>
        <Animated.Text
          style={[styles.emoji, { transform: [{ scale: pulseAnim }] }]}
        >
          🌸
        </Animated.Text>
        <Text style={styles.title}>Identifying Perfume</Text>
        <Text style={styles.message}>{MESSAGES[messageIndex]}</Text>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: Colors.primary,
    borderRightColor: Colors.accent,
    position: 'absolute',
  },
  spinnerInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
  },
  emoji: {
    fontSize: 44,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
});
