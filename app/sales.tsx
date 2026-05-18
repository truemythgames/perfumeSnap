import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { BorderRadius, Colors, FontSizes, Spacing } from '../constants/theme';
import { getPaywallPackages } from '../services/subscription';
import { getOrCreateUserId } from '../services/user';
import { dismissPaywallForSession } from '../services/paywall';

type PlanId = 'trial' | 'intro';

const INITIAL_REVEAL_STEP_MS = 320;
const REVEAL_ACCELERATION_FACTOR = 0.86;
const MIN_REVEAL_STEP_MS = 110;
const TERMS_URL = 'https://perfumesnap.app/terms';
const PRIVACY_URL = 'https://perfumesnap.app/privacy';
const SUBSCRIPTION_TERMS_URL = 'https://perfumesnap.app/terms';

function formatPeriod(unit: string, count: number) {
  const normalized = unit.toLowerCase();
  const base = normalized === 'day' ? 'day' : normalized === 'week' ? 'week' : normalized === 'month' ? 'month' : normalized === 'year' ? 'year' : 'period';
  return `${count} ${base}${count === 1 ? '' : 's'}`;
}

function getTrialPeriodLabel(pkg: PurchasesPackage | null) {
  const intro = pkg?.product.introPrice;
  if (!intro) return '3 days';
  return formatPeriod(intro.periodUnit, intro.periodNumberOfUnits);
}

function getIntroPeriodLabel(pkg: PurchasesPackage | null) {
  const intro = pkg?.product.introPrice;
  if (!intro) return 'Intro offer';
  return formatPeriod(intro.periodUnit, intro.periodNumberOfUnits);
}

function getAnnualRenewalText(annualPackage: PurchasesPackage | null, fallbackPackage: PurchasesPackage | null) {
  const source = annualPackage?.product ?? fallbackPackage?.product ?? null;
  if (!source) return 'then €44.99/yr(~€3.75/mo)';

  const yearlyPrice = source.pricePerYearString ?? source.priceString;
  const monthlyApprox = source.pricePerMonthString;
  if (monthlyApprox) return `then ${yearlyPrice}/yr(~${monthlyApprox}/mo)`;
  return `then ${yearlyPrice}/yr`;
}

function getIntroSummaryLabel(pkg: PurchasesPackage | null) {
  const label = getIntroPeriodLabel(pkg).toLowerCase();
  if (label.startsWith('1 month')) return 'month';
  return label;
}

export default function SalesScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('trial');
  const [showTitle, setShowTitle] = useState(false);
  const [visibleBenefitCount, setVisibleBenefitCount] = useState(0);
  const [showPricingOptions, setShowPricingOptions] = useState(false);
  const [showPriceSummary, setShowPriceSummary] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [trialPackage, setTrialPackage] = useState<PurchasesPackage | null>(null);
  const [introPackage, setIntroPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
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

  const handleRestorePurchases = async () => {
    try {
      await Purchases.restorePurchases();
    } catch (error) {
      console.warn('[PerfumeSnap] Failed restoring purchases:', error);
    }
  };

  useEffect(() => {
    const loadPaywall = async () => {
      try {
        const userId = await getOrCreateUserId();
        const packages = await getPaywallPackages(userId);
        setTrialPackage(packages.trialPackage);
        setIntroPackage(packages.introPackage);
        setAnnualPackage(packages.annualPackage);
      } finally {
        setIsLoadingPricing(false);
      }
    };
    loadPaywall();
  }, []);

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

  const trialCardSubtitle = useMemo(() => getTrialPeriodLabel(trialPackage), [trialPackage]);
  const introCardTitle = '1 month';
  const introCardSubtitle = useMemo(
    () => introPackage?.product.introPrice?.priceString ?? introPackage?.product.priceString ?? '€0.99',
    [introPackage],
  );

  const priceParts = useMemo(() => {
    if (selectedPlan === 'trial') {
      const trialLabel = getTrialPeriodLabel(trialPackage).toLowerCase();
      const renewalText = getAnnualRenewalText(annualPackage, trialPackage);
      return {
        prefix: `${trialLabel} free, then just `,
        price: renewalText.replace(/^then /, '').split('/')[0],
        suffix: '/' + (renewalText.replace(/^then /, '').split('/').slice(1).join('/')),
      };
    }

    const introPrice = introPackage?.product.introPrice?.priceString ?? introPackage?.product.priceString ?? '€0.99';
    const renewalText = getAnnualRenewalText(annualPackage, introPackage);
    const normalizedRenewal = renewalText.replace(/^then /, '');
    return {
      prefix: `1st month ${introPrice}, then `,
      price: normalizedRenewal.split('/')[0],
      suffix: '/' + (normalizedRenewal.split('/').slice(1).join('/')),
    };
  }, [selectedPlan, trialPackage, introPackage, annualPackage]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 44 },
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
              onPress={() => {
                dismissPaywallForSession();
                router.back();
              }}
              hitSlop={12}
              style={[styles.heroCancelButton, { top: insets.top + Spacing.xs }]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
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
                  <View style={styles.planRow}>
                    <TouchableOpacity
                      style={[styles.planCard, styles.planCardLeft, selectedPlan === 'trial' && styles.planCardSelected]}
                      onPress={() => setSelectedPlan('trial')}
                      activeOpacity={0.8}
                    >
                      <View>
                        <Text style={styles.planTitle}>Free</Text>
                        <Text style={styles.planSubtitle}>{trialCardSubtitle}</Text>
                      </View>
                      <View style={[styles.radio, selectedPlan === 'trial' && styles.radioActive]}>
                        {selectedPlan === 'trial' && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.planCard, styles.planCardRight, selectedPlan === 'intro' && styles.planCardSelected]}
                      onPress={() => setSelectedPlan('intro')}
                      activeOpacity={0.8}
                    >
                      <View>
                        <Text style={styles.planTitle}>{introCardTitle}</Text>
                        <Text style={styles.planSubtitle}>{introCardSubtitle}</Text>
                      </View>
                      <View style={[styles.radio, selectedPlan === 'intro' && styles.radioActive]}>
                        {selectedPlan === 'intro' && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>

              {showPriceSummary && (
                <Animated.View style={{ opacity: priceSummaryOpacity }}>
                  <Text
                    style={styles.priceSummary}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.72}
                  >
                    <Text style={styles.priceDim}>{priceParts.prefix}</Text>
                    <Text style={styles.priceHighlight}>{priceParts.price}</Text>
                    <Text style={styles.priceDim}>{priceParts.suffix}</Text>
                  </Text>
                </Animated.View>
              )}

              {showContinueButton && (
                <Animated.View style={{ opacity: continueButtonOpacity }}>
                  <TouchableOpacity style={styles.continueButton} activeOpacity={0.85}>
                    <Text style={styles.continueButtonText}>Continue</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </>
          )}
        </View>
      </ScrollView>
      <View style={[styles.legalRow, { bottom: insets.bottom + Spacing.sm }]}>
        <TouchableOpacity onPress={() => openExternalUrl(TERMS_URL)}>
          <Text style={styles.legalText}>Terms of Use</Text>
        </TouchableOpacity>
        <Text style={styles.legalSeparator}>|</Text>
        <TouchableOpacity onPress={() => openExternalUrl(PRIVACY_URL)}>
          <Text style={styles.legalText}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.legalSeparator}>|</Text>
        <TouchableOpacity onPress={() => openExternalUrl(SUBSCRIPTION_TERMS_URL)}>
          <Text style={styles.legalText}>Subscription Terms</Text>
        </TouchableOpacity>
        <Text style={styles.legalSeparator}>|</Text>
        <TouchableOpacity onPress={handleRestorePurchases}>
          <Text style={styles.legalText}>Restore</Text>
        </TouchableOpacity>
      </View>
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
    color: '#cfcfcf',
    fontSize: FontSizes.sm,
    fontWeight: '500',
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
    right: Spacing.md,
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
  planRow: {
    flexDirection: 'row',
    marginBottom: 44,
  },
  planCard: {
    flex: 1,
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
  planCardLeft: {
    marginRight: Spacing.xs,
  },
  planCardRight: {
    marginLeft: Spacing.xs,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(200,148,60,0.2)',
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
    marginTop: 8,
    marginBottom: Spacing.md,
  },
  priceHighlight: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  priceDim: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  continueButtonText: {
    color: '#0d0d0d',
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  legalRow: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    rowGap: 2,
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
