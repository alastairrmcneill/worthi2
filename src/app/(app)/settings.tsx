import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore, CURRENCIES, type Currency } from '@/stores/settingsStore';
import { useAccountStore } from '@/stores/accountStore';
import { Spacing } from '@/constants/theme';
import { ACCOUNT_TYPES } from '@/constants/accountTypes';
import { formatCurrency } from '@/lib/formatting';
import { interpolateContribution } from '@/lib/interpolate';
import TypePill from '@/components/accounts/TypePill';
import { importCsv } from '@/lib/csvImport';
import { downloadCsvTemplate } from '@/lib/csvTemplate';
import { track } from '@/lib/analytics';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const currency = useSettingsStore((s) => s.currency);
  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const accounts = useAccountStore((s) => s.accounts);
  const entries = useAccountStore((s) => s.entries);
  const updateAccount = useAccountStore((s) => s.updateAccount);

  const archivedAccounts = accounts.filter((a) => a.isArchived);

  function handleUnarchive(id: string) {
    const acct = accounts.find((a) => a.id === id);
    if (acct) track('account_unarchived', { account_type: acct.type });
    updateAccount(id, { isArchived: false });
  }

  function currentValueFor(accountId: string) {
    const acct = accounts.find((a) => a.id === accountId);
    if (!acct) return 0;
    const acctEntries = entries.filter((e) => e.accountId === accountId);
    return interpolateContribution(acct, acctEntries, Date.now());
  }

  async function handleImport() {
    try {
      await importCsv((path: any) => router.push(path));
    } catch (e: any) {
      Alert.alert('Import Failed', e?.message ?? 'Could not import CSV');
    }
  }

  async function handleDownloadTemplate() {
    try {
      await downloadCsvTemplate();
      track('csv_template_downloaded');
    } catch (e: any) {
      Alert.alert('Download Failed', e?.message ?? 'Could not generate template');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.topBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={22} color={theme.fg} />
        </Pressable>
        <Text style={[styles.topTitle, { color: theme.fg }]}>Settings</Text>
        <View style={styles.topBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Currency */}
        <SectionHeader title="Currency" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {CURRENCIES.map((c, i) => (
            <Pressable
              key={c.code}
              onPress={() => {
              setCurrency(c);
              track('currency_changed', { currency_code: c.code });
            }}
              style={({ pressed }) => [
                styles.row,
                i < CURRENCIES.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.rowLeft}>
                <Text style={[styles.currencySymbol, { color: theme.fg }]}>{c.symbol}</Text>
                <Text style={[styles.currencyLabel, { color: theme.fg }]}>{c.code}</Text>
              </View>
              {currency.code === c.code && (
                <Ionicons name="checkmark" size={18} color={theme.fg} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Import */}
        <SectionHeader title="Data" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable
            onPress={handleImport}
            style={({ pressed }) => [
              styles.row,
              { borderBottomWidth: 1, borderBottomColor: theme.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="cloud-upload-outline" size={18} color={theme.fg2} />
              <Text style={[styles.rowLabel, { color: theme.fg }]}>Import from CSV</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.fg3} />
          </Pressable>
          <Pressable
            onPress={handleDownloadTemplate}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="download-outline" size={18} color={theme.fg2} />
              <Text style={[styles.rowLabel, { color: theme.fg }]}>Download CSV Template</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.fg3} />
          </Pressable>
        </View>

        {/* Archived accounts */}
        {archivedAccounts.length > 0 && (
          <>
            <SectionHeader title="Archived Accounts" theme={theme} />
            <View
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              {archivedAccounts.map((account, i) => (
                <View
                  key={account.id}
                  style={[
                    styles.archivedRow,
                    i < archivedAccounts.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.archivedLeft}>
                    <TypePill type={account.type} />
                    <Text style={[styles.archivedName, { color: theme.fg }]}>
                      {account.name}
                    </Text>
                    <Text style={[styles.archivedValue, { color: theme.fg3 }]}>
                      {formatCurrency(currentValueFor(account.id), currency)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleUnarchive(account.id)}
                    style={({ pressed }) => [
                      styles.unarchiveBtn,
                      { borderColor: theme.border },
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Text style={[styles.unarchiveBtnText, { color: theme.fg }]}>
                      Restore
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, theme }: { title: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <Text style={[sectionStyles.header, { color: theme.fg3 }]}>{title}</Text>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  topBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
    letterSpacing: -0.3,
  },

  scroll: { flex: 1 },
  scrollContent: {},

  card: {
    marginHorizontal: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
    width: 24,
    textAlign: 'center',
  },
  currencyLabel: {
    fontSize: 15,
    fontFamily: 'Geist_500Medium',
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: 'Geist_500Medium',
  },

  archivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: Spacing.sm,
  },
  archivedLeft: {
    flex: 1,
    gap: 4,
  },
  archivedName: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Geist_500Medium',
  },
  archivedValue: {
    fontSize: 12,
    fontFamily: 'Geist_400Regular',
  },
  unarchiveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  unarchiveBtnText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Geist_500Medium',
  },
});
