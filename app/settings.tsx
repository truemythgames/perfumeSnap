import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Alert,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSizes, Spacing, BorderRadius } from '../constants/theme';
import { deleteAccount } from '../services/api';
import { clearAllLocalUserData } from '../services/localReset';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { restorePurchases } from '../services/subscription';
import { CURRENCIES, getPreferredCurrency, setPreferredCurrency, getCurrencyByCode, CurrencyOption } from '../services/currency';

const APP_STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/app/id6770087818',
  android: 'https://play.google.com/store/apps/details?id=app.perfumeSnap',
}) || '';

interface SettingsRow {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  value?: string;
}

function RowItem({ icon, label, onPress, destructive, value }: SettingsRow) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <Ionicons
        name={icon as any}
        size={20}
        color={destructive ? Colors.error : Colors.textSecondary}
      />
      <Text style={[styles.rowLabel, destructive && { color: Colors.error }]}>
        {label}
      </Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [currency, setCurrency] = useState('USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const { isPremium: premium } = usePremiumStatus();

  useEffect(() => {
    getPreferredCurrency().then(setCurrency);
  }, []);

  const handleMembershipStatus = () => {
    if (premium) {
      Alert.alert('Premium', 'You have an active Premium membership.');
    } else {
      router.push('/sales');
    }
  };

  const handleRestore = async () => {
    const restored = await restorePurchases();
    if (restored) {
      Alert.alert('Restored', 'Your Premium membership has been restored.');
    } else {
      Alert.alert('No Purchase Found', 'We couldn\'t find an active subscription to restore.');
    }
  };

  const filteredCurrencies = useMemo(() => {
    if (!currencySearch.trim()) return CURRENCIES;
    const q = currencySearch.toLowerCase();
    return CURRENCIES.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.symbol.includes(q),
    );
  }, [currencySearch]);

  const selectCurrency = (code: string) => {
    setCurrency(code);
    setPreferredCurrency(code);
    setShowCurrencyPicker(false);
    setCurrencySearch('');
  };

  const handleEncourage = () => {
    if (APP_STORE_URL) Linking.openURL(APP_STORE_URL);
  };

  const handleContact = () => {
    Linking.openURL('mailto:contact@perfumesnap.app');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              await clearAllLocalUserData();
              Alert.alert(
                'Done',
                'Your account and all data have been deleted. You can set up PerfumeSnap again from scratch.',
              );
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete account. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://perfumesnap.com/privacy');
  };

  const handleTerms = () => {
    Linking.openURL('https://perfumesnap.com/terms');
  };

  const handleAppInfo = () => {
    Alert.alert('PerfumeSnap', 'Version: 1.0.0');
  };


  const handleTellFriends = () => {
    const message = 'Check out PerfumeSnap - identify any perfume just by taking a photo! ' + APP_STORE_URL;
    Linking.openURL(`sms:&body=${encodeURIComponent(message)}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Membership */}
        <Text style={styles.sectionTitle}>Membership</Text>
        <View style={styles.card}>
          <RowItem
            icon="diamond-outline"
            label="My Membership"
            value={premium ? 'Premium' : 'Free'}
            onPress={handleMembershipStatus}
          />
          <View style={styles.divider} />
          <RowItem icon="refresh-outline" label="Restore Purchase" onPress={handleRestore} />
        </View>

        {/* General Settings */}
        <Text style={styles.sectionTitle}>General Settings</Text>
        <View style={styles.card}>
          <RowItem
            icon="cash-outline"
            label="Preferred Currency"
            value={getCurrencyByCode(currency)?.code}
            onPress={() => setShowCurrencyPicker(true)}
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.card}>
          <RowItem icon="thumbs-up-outline" label="Encourage Us" onPress={handleEncourage} />
          <View style={styles.divider} />
          <RowItem icon="chatbox-outline" label="Contact Us" onPress={handleContact} />
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <RowItem icon="log-out-outline" label="Delete Account" onPress={handleDeleteAccount} destructive />
        </View>

        {/* Legal */}
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.card}>
          <RowItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={handlePrivacyPolicy} />
          <View style={styles.divider} />
          <RowItem icon="document-text-outline" label="Terms of Use" onPress={handleTerms} />
        </View>

        {/* About the App */}
        <Text style={styles.sectionTitle}>About the App</Text>
        <View style={styles.card}>
          <RowItem icon="information-circle-outline" label="App Info" onPress={handleAppInfo} />
          <View style={styles.divider} />
          <RowItem icon="link-outline" label="Tell Friends" onPress={handleTellFriends} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <TouchableOpacity
              onPress={() => { setShowCurrencyPicker(false); setCurrencySearch(''); }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search currency..."
              placeholderTextColor={Colors.textMuted}
              value={currencySearch}
              onChangeText={setCurrencySearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {currencySearch.length > 0 && (
              <TouchableOpacity onPress={() => setCurrencySearch('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredCurrencies}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }: { item: CurrencyOption }) => (
              <TouchableOpacity
                style={styles.currencyRow}
                activeOpacity={0.7}
                onPress={() => selectCurrency(item.code)}
              >
                <Text style={styles.currencySymbol}>{item.symbol}</Text>
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencyCode}>{item.code}</Text>
                  <Text style={styles.currencyName}>{item.name}</Text>
                </View>
                {currency === item.code && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.modalDivider} />}
            contentContainerStyle={styles.currencyList}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  rowLabel: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: '500',
    color: Colors.text,
  },
  rowValue: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md + 20 + Spacing.md,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm + 2 : Spacing.xs,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    paddingVertical: Spacing.xs,
  },
  currencyList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  currencySymbol: {
    width: 36,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  currencyName: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  modalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
});
