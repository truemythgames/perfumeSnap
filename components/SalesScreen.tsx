import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { BorderRadius, Colors, FontSizes, Spacing } from '../constants/theme';
import DealSheet from './DealSheet';
import { dealExpired, dismissOfferForSession, offerShouldOpen, startDealTimer, useDealEndsAt } from '../services/dealTimer';
import {
  loadPaywall,
  purchasePackage,
  restorePurchases,
  type PaywallPlan,
} from '../services/subscription';
import { getOrCreateUserId } from '../services/user';
import { dismissPaywallForSession } from '../services/paywall';

type SalesSource = 'onboarding' | 'app';

type SalesScreenProps = {
  /** When set, this paywall is an onboarding step and does not navigate. */
  onDismiss?: () => void;
  /** Onboarding sells the two quarterly plans. The in-app page sells weekly and quarterly. */
  source?: SalesSource;
};

/** Closing the onboarding deal with its own × declines it for the rest of this launch. */
let onboardingDealDeclined = false;
const APP_DEAL_SEEN_KEY = 'perfumesnap_upgrade_deal_seen';

const INITIAL_REVEAL_STEP_MS = 220;
const REVEAL_ACCELERATION_FACTOR = 0.82;
const MIN_REVEAL_STEP_MS = 80;
const TERMS_URL = 'https://perfumesnap.app/terms';
const PRIVACY_URL = 'https://perfumesnap.app/privacy';
const SUBSCRIPTION_TERMS_URL = 'https://perfumesnap.app/terms';

export default function SalesScreen({ onDismiss, source = 'app' }: SalesScreenProps) {
  const leave = () => {
    if (onDismiss) onDismiss();
    else router.back();
  };
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<PaywallPlan[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dealPackage, setDealPackage] = useState<PaywallPlan['pkg'] | null>(null);
  const [dealCopy, setDealCopy] = useState<Awaited<ReturnType<typeof loadPaywall>>['deal']>(null);
  const [dealOpen, setDealOpen] = useState(false);
  const [dealSeen, setDealSeen] = useState(source === 'app');
  const [showTitle, setShowTitle] = useState(false);
  const [visibleBenefitCount, setVisibleBenefitCount] = useState(0);
  const [showPricingOptions, setShowPricingOptions] = useState(false);
  const [showPriceSummary, setShowPriceSummary] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const pricingOptionsOpacity = useRef(new Animated.Value(0)).current;
  const priceSummaryOpacity = useRef(new Animated.Value(0)).current;
  const continueButtonOpacity = useRef(new Animated.Value(0)).current;
  const benefitOpacities = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0)),
  ).current;

  const fadeIn = (value: Animated.Value) => {
    Animated.timing(value, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const openExternalUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn('[PerfumeSnap] Failed opening legal link:', error);
    }
  };

  const openDeal = () => {
    setDealOpen(true);
    void startDealTimer();
  };

  const dealEndsAt = useDealEndsAt();
  useEffect(() => {
    if (!dealPackage || !dealCopy || dealEndsAt === null || !offerShouldOpen()) return;
    setDealOpen(true);
  }, [dealPackage, dealCopy, dealEndsAt]);

  const closePaywall = () => {
    if (isPurchasing) return;
    if (source === 'onboarding') {
      if (dealPackage && dealCopy && !onboardingDealDeclined && !dealExpired()) {
        openDeal();
        return;
      }
      leave();
      return;
    }
    if (dealPackage && dealCopy && !dealSeen && !dealExpired()) {
      setDealSeen(true);
      void SecureStore.setItemAsync(APP_DEAL_SEEN_KEY, '1').catch(() => undefined);
      openDeal();
      return;
    }
    dismissPaywallForSession();
    leave();
  };

  const declineDeal = () => {
    dismissOfferForSession();
    if (source === 'onboarding') onboardingDealDeclined = true;
    else dismissPaywallForSession();
    leave();
  };

  const handlePurchase = async (pkg?: PaywallPlan['pkg'] | null) => {
    const selected = pkg ?? plans.find((plan) => plan.id === selectedId)?.pkg ?? plans[0]?.pkg;
    if (!selected) {
      Alert.alert('Unavailable', 'This plan is not available right now. Please try again later.');
      return;
    }
    setIsPurchasing(true);
    try {
      const active = await purchasePackage(selected);
      if (active) leave();
    } catch (error: any) {
      if (error?.userCancelled) return;
      Alert.alert('Purchase failed', error?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const restored = await restorePurchases();
      if (restored) {
        Alert.alert('Restored', 'Your premium access has been restored.');
        leave();
      } else {
        Alert.alert('No Subscription Found', 'We could not find an active subscription for your account.');
      }
    } catch (error) {
      console.warn('[PerfumeSnap] Failed restoring purchases:', error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (source === 'app') {
      SecureStore.getItemAsync(APP_DEAL_SEEN_KEY)
        .then((seen) => { if (!cancelled) setDealSeen(seen === '1'); })
        .catch(() => { if (!cancelled) setDealSeen(false); });
    }
    const load = async () => {
      try {
        const userId = await getOrCreateUserId();
        const content = await loadPaywall(source, userId);
        if (cancelled) return;
        setPlans(content.plans);
        setSelectedId(content.plans[0]?.id ?? null);
        setDealPackage(content.dealPackage);
        setDealCopy(content.deal);
      } finally {
        if (!cancelled) setIsLoadingPricing(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [source]);

  const benefits = useMemo(() => [
    'Start with a free trial',
    'Identify perfumes in one snap',
    'Get accurate market value in seconds',
    'Organize and track your collection',
    'Unlock unlimited perfume scans and insights',
  ], []);

  useEffect(() => {
    setShowTitle(false);
    setVisibleBenefitCount(0);
    setShowPricingOptions(false);
    setShowPriceSummary(false);
    setShowContinueButton(false);
    titleOpacity.setValue(0);
    pricingOptionsOpacity.setValue(0);
    priceSummaryOpacity.setValue(0);
    continueButtonOpacity.setValue(0);
    benefitOpacities.forEach((opacity) => opacity.setValue(0));
    const timers: ReturnType<typeof setTimeout>[] = [];

    let cumulativeDelay = 0;
    let currentStepDelay = INITIAL_REVEAL_STEP_MS;
    const nextDelay = () => {
      cumulativeDelay += currentStepDelay;
      currentStepDelay = Math.max(MIN_REVEAL_STEP_MS, currentStepDelay * REVEAL_ACCELERATION_FACTOR);
      return cumulativeDelay;
    };

    const titleTimer = setTimeout(() => {
      setShowTitle(true);
      titleOpacity.setValue(0);
      requestAnimationFrame(() => fadeIn(titleOpacity));
    }, nextDelay());
    timers.push(titleTimer);

    benefits.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleBenefitCount(index + 1);
        benefitOpacities[index]?.setValue(0);
        requestAnimationFrame(() => fadeIn(benefitOpacities[index]));
      }, nextDelay());
      timers.push(timer);
    });

    const optionsTimer = setTimeout(() => {
      setShowPricingOptions(true);
      pricingOptionsOpacity.setValue(0);
      requestAnimationFrame(() => fadeIn(pricingOptionsOpacity));
    }, nextDelay());
    timers.push(optionsTimer);

    const summaryTimer = setTimeout(() => {
      setShowPriceSummary(true);
      priceSummaryOpacity.setValue(0);
      requestAnimationFrame(() => fadeIn(priceSummaryOpacity));
    }, nextDelay());
    timers.push(summaryTimer);

    const buttonTimer = setTimeout(() => {
      setShowContinueButton(true);
      continueButtonOpacity.setValue(0);
      requestAnimationFrame(() => fadeIn(continueButtonOpacity));
    }, nextDelay());
    timers.push(buttonTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [benefits]);

  const selected = plans.find((plan) => plan.id === selectedId) ?? plans[0];
  const continueLabel = source === 'onboarding'
    ? (selected?.due ? 'Try for free' : `Redeem 30 days for ${selected?.price ?? ''}`.trim())
    : 'Continue';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrapper}>
          <ImageBackground
            source={require('../assets/sales-hero.jpg')}
            resizeMode="cover"
            style={styles.heroImage}
            imageStyle={styles.heroImageInner}
          >
            <TouchableOpacity
              onPress={closePaywall}
              hitSlop={12}
              style={[styles.heroCancelButton, { top: insets.top + Spacing.xs }]}
            >
              <Text style={styles.cancelText}>×</Text>
            </TouchableOpacity>
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)', '#000']}
              locations={[0.25, 0.75, 1]}
              style={styles.heroGradient}
            />
          </ImageBackground>
        </View>

        <View style={styles.content}>
          {showTitle && (
            <Animated.View style={{ opacity: titleOpacity }}>
              <Text style={styles.title}>Unlock PerfumeSnap</Text>
            </Animated.View>
          )}

          <View style={styles.benefitsList}>
            {benefits.slice(0, visibleBenefitCount).map((benefit, index) => (
              <Animated.View style={{ opacity: benefitOpacities[index] }} key={benefit}>
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-sharp" size={20} color="#fff" />
                  <Text
                    style={styles.benefitText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                  >
                    {benefit}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {showPricingOptions && (
            <>
              <Animated.View style={{ opacity: pricingOptionsOpacity }}>
                {isLoadingPricing ? (
                  <View style={styles.pricingLoader}>
                    <ActivityIndicator color={Colors.primary} />
                  </View>
                ) : (
                  <View style={styles.planList}>
                    {plans.length === 0 ? (
                      <Text style={styles.emptyPlans}>Plans are not available right now. Check your connection and try again.</Text>
                    ) : null}
                    {plans.map((plan) => {
                      const on = plan.id === selected?.id;
                      return (
                        <TouchableOpacity
                          key={plan.id}
                          style={[styles.planCard, on && styles.planCardSelected]}
                          onPress={() => setSelectedId(plan.id)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.planCopy}>
                            <Text style={styles.planTitle}>{plan.price}</Text>
                            <Text style={styles.planSubtitle}>{plan.due ? '3 day trial' : '30-Day trial'}</Text>
                          </View>
                          <View style={[styles.radio, on && styles.radioActive]}>
                            {on ? <View style={styles.radioDot} /> : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </Animated.View>

              {showContinueButton && (
                <Animated.View style={{ opacity: continueButtonOpacity }}>
                  <TouchableOpacity
                    style={styles.continueButton}
                    activeOpacity={0.85}
                    onPress={() => { void handlePurchase(); }}
                    disabled={isPurchasing || !selected}
                  >
                    {isPurchasing ? (
                      <ActivityIndicator color="#0d0d0d" />
                    ) : (
                      <Text style={styles.continueButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                        {continueLabel}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.priceSummary}>{selected?.note || ' '}</Text>
                  <View style={styles.legalRow}>
                    <TouchableOpacity onPress={() => openExternalUrl(TERMS_URL)}>
                      <Text style={styles.legalText}>Terms</Text>
                    </TouchableOpacity>
                    <Text style={styles.legalSeparator}>·</Text>
                    <TouchableOpacity onPress={() => openExternalUrl(PRIVACY_URL)}>
                      <Text style={styles.legalText}>Privacy</Text>
                    </TouchableOpacity>
                    <Text style={styles.legalSeparator}>·</Text>
                    <TouchableOpacity onPress={() => openExternalUrl(SUBSCRIPTION_TERMS_URL)}>
                      <Text style={styles.legalText}>Subscription Terms</Text>
                    </TouchableOpacity>
                    <Text style={styles.legalSeparator}>·</Text>
                    <TouchableOpacity onPress={handleRestorePurchases}>
                      <Text style={styles.legalText}>Restore</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </>
          )}
        </View>
      </ScrollView>
      {dealOpen && dealCopy ? (
        <DealSheet
          deal={dealCopy}
          busy={isPurchasing}
          onClaim={() => { void handlePurchase(dealPackage); }}
          onClose={declineDeal}
          onRestore={() => { void handleRestorePurchases(); }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '400',
  },
  heroWrapper: {
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: 331,
    justifyContent: 'flex-end',
  },
  heroCancelButton: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 2,
  },
  heroImageInner: {
    borderRadius: 0,
  },
  heroGradient: {
    height: '65%',
  },
  content: {
    marginTop: -20,
    paddingHorizontal: Spacing.md,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: 0.2,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  benefitsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  pricingLoader: {
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 44,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  benefitText: {
    color: '#ededed',
    fontSize: FontSizes.sm,
    fontWeight: '500',
    flex: 1,
    lineHeight: 19,
  },
  planList: {
    gap: 10,
    marginBottom: 20,
  },
  emptyPlans: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginVertical: Spacing.lg,
    fontSize: FontSizes.sm,
  },
  planCard: {
    minHeight: 86,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090909',
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(200,148,60,0.2)',
  },
  planCopy: {
    flex: 1,
    marginRight: Spacing.sm,
    gap: 2,
  },
  planTitle: {
    color: '#fff',
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  planSubtitle: {
    color: '#d5d5d5',
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(200,148,60,0.22)',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  priceSummary: {
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 12,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.55)',
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#0d0d0d',
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    rowGap: 6,
  },
  legalText: {
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    fontSize: FontSizes.xs,
  },
  legalSeparator: {
    color: 'rgba(255,255,255,0.4)',
    marginHorizontal: 6,
    fontSize: FontSizes.xs,
  },
});
