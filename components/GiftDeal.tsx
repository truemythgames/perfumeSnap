import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PurchasesPackage } from 'react-native-purchases';
import DealSheet from './DealSheet';
import { dismissOfferForSession, formatCountdown, offerShouldOpen, useDealRemaining } from '../services/dealTimer';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { loadPaywall, purchasePackage, restorePurchases, type DealCopy } from '../services/subscription';

/** Floating gift above the tab bar while the one-time yearly offer is still running. */
export default function GiftDeal() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { isPremium } = usePremiumStatus();
  const remaining = useDealRemaining();
  const [deal, setDeal] = useState<{ pkg: PurchasesPackage; copy: DealCopy } | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const hover = useRef(new Animated.Value(0)).current;
  const live = !isPremium && remaining !== null && remaining > 0;

  useEffect(() => {
    if (!live || deal) return;
    let cancelled = false;
    void loadPaywall('app').then((content) => {
      if (cancelled || !content.dealPackage || !content.deal) return;
      setDeal({ pkg: content.dealPackage, copy: content.deal });
    });
    return () => {
      cancelled = true;
    };
  }, [live, deal]);

  useEffect(() => {
    if (!live || !deal || pathname === '/sales' || !offerShouldOpen()) return;
    setOpen(true);
  }, [live, deal, pathname]);

  useEffect(() => {
    if (!live || !deal) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hover, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(hover, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [live, deal, hover]);

  if (!live || !deal || pathname === '/sales') return null;

  const lift = hover.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  const claim = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (await purchasePackage(deal.pkg)) setOpen(false);
    } catch (error: any) {
      Alert.alert('Purchase failed', error?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await restorePurchases();
      if (ok) setOpen(false);
      else Alert.alert('No Subscription Found', 'We could not find an active subscription for your account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <View pointerEvents="box-none" style={[styles.anchor, { bottom: insets.bottom + 88 }]}>
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Open your one-time offer, ends in ${formatCountdown(remaining!)}`}
        >
          <Animated.View style={[styles.gift, { transform: [{ translateY: lift }] }]}>
            <Text style={styles.emoji}>🎁</Text>
          </Animated.View>
          <View style={styles.counter}>
            <Text style={styles.counterText}>{formatCountdown(remaining!)}</Text>
          </View>
        </Pressable>
      </View>
      {open ? (
        <DealSheet
          deal={deal.copy}
          busy={busy}
          onClaim={() => { void claim(); }}
          onClose={() => {
            dismissOfferForSession();
            setOpen(false);
          }}
          onRestore={() => { void restore(); }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', right: 16, zIndex: 1, alignItems: 'center' },
  gift: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2114',
    borderWidth: 3,
    borderColor: '#c8943c',
  },
  emoji: { fontSize: 28 },
  counter: {
    marginTop: -8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#c8943c',
  },
  counterText: { fontSize: 11, fontWeight: '800', color: '#0d0d0d', fontVariant: ['tabular-nums'] },
});
