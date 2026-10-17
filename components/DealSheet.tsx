import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Spacing } from '../constants/theme';
import { formatCountdown, startDealTimer, useDealRemaining } from '../services/dealTimer';
import type { DealCopy } from '../services/subscription';

const { height: SCREEN_H } = Dimensions.get('window');

type Props = {
  deal: DealCopy;
  busy: boolean;
  onClaim: () => void;
  /** The sheet's own × leaves the paywall. */
  onClose: () => void;
  onRestore: () => void;
};

export default function DealSheet({ deal, busy, onClaim, onClose, onRestore }: Props) {
  const insets = useSafeAreaInsets();
  const rise = useRef(new Animated.Value(SCREEN_H)).current;
  const dim = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const remaining = useDealRemaining();

  useEffect(() => {
    void startDealTimer();
    Animated.parallel([
      Animated.spring(rise, { toValue: 0, damping: 20, stiffness: 140, useNativeDriver: true }),
      Animated.timing(dim, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [rise, dim, pulse]);

  const sealScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <View style={[StyleSheet.absoluteFill, styles.layer]} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Offer">
        <Animated.View style={[styles.backdrop, { opacity: dim }]} />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, 16) + 8, transform: [{ translateY: rise }] },
        ]}
      >
        <View style={styles.grabber} />
        <Pressable onPress={onClose} disabled={busy} hitSlop={14} style={styles.close} accessibilityLabel="Close">
          <Text style={styles.closeText}>×</Text>
        </Pressable>
        <Text style={styles.kicker}>ONE-TIME OFFER</Text>
        <Text style={styles.title}>Wait, a better deal</Text>
        <Text style={styles.sub}>Your whole year, for less.</Text>
        {remaining !== null && remaining > 0 ? (
          <View style={styles.timer}>
            <Text style={styles.timerLabel}>Offer ends in</Text>
            <Text style={styles.timerValue}>{formatCountdown(remaining)}</Text>
          </View>
        ) : null}
        <View style={styles.cardWrap}>
          <Animated.View style={[styles.seal, { transform: [{ scale: sealScale }] }]}>
            <Text style={styles.sealEmoji}>🎁</Text>
          </Animated.View>
          <View style={styles.card}>
            {deal.discount ? (
              <View style={styles.discountRow}>
                <Text style={styles.discountText}>Here's</Text>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{deal.discount}</Text>
                </View>
                <Text style={styles.discountText}>just for you</Text>
              </View>
            ) : (
              <Text style={styles.discountText}>Limited-time price</Text>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.price}>{deal.perWeek}</Text>
              <Text style={styles.priceUnit}>/week</Text>
            </View>
            {deal.discount ? <Text style={styles.lowest}>LOWEST PRICE WE OFFER</Text> : null}
          </View>
        </View>
        <Text style={styles.commit}>No commitment, cancel anytime</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Claim my offer"
          onPress={onClaim}
          disabled={busy}
          style={[styles.btn, busy && styles.btnBusy]}
        >
          {busy ? <ActivityIndicator color="#0d0d0d" /> : <Text style={styles.btnText}>Claim my offer</Text>}
        </Pressable>
        <Text style={styles.billed}>{deal.billed}</Text>
        <Pressable onPress={onRestore} disabled={busy}>
          <Text style={styles.restore}>Restore</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { zIndex: 30 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.94)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    alignItems: 'center',
  },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  close: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1c1c',
  },
  closeText: { fontSize: 20, lineHeight: 22, color: '#aaa' },
  kicker: {
    marginTop: 18,
    fontSize: FontSizes.xs,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.primary,
  },
  title: {
    marginTop: 6,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  sub: { marginTop: 6, fontSize: 15, lineHeight: 21, color: 'rgba(255,255,255,0.62)', textAlign: 'center' },
  timer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(200,148,60,0.16)',
  },
  timerLabel: { fontSize: 13, color: Colors.primary },
  timerValue: { fontSize: 15, fontWeight: '800', color: Colors.primary, fontVariant: ['tabular-nums'] },
  cardWrap: { alignSelf: 'stretch', alignItems: 'center', marginTop: 36 },
  seal: {
    position: 'absolute',
    top: -26,
    zIndex: 2,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2114',
    borderWidth: 3,
    borderColor: '#111',
  },
  sealEmoji: { fontSize: 24 },
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: 38,
    paddingBottom: 20,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(200,148,60,0.12)',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  discountRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 8 },
  discountText: { fontSize: 15, color: 'rgba(255,255,255,0.7)' },
  pill: {
    backgroundColor: '#1a140c',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  price: { fontSize: 48, lineHeight: 56, fontWeight: '700', color: '#fff' },
  priceUnit: { marginLeft: 4, fontSize: 17, color: 'rgba(255,255,255,0.6)' },
  lowest: { marginTop: 8, fontSize: 11, fontWeight: '800', letterSpacing: 1.6, color: Colors.primary },
  commit: { marginTop: 20, fontSize: 14, fontWeight: '600', color: Colors.primary },
  btn: {
    alignSelf: 'stretch',
    height: 56,
    marginTop: 14,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  btnBusy: { opacity: 0.7 },
  btnText: { fontSize: 17, fontWeight: '800', color: '#0d0d0d' },
  billed: { marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  restore: { marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.55)' },
});
