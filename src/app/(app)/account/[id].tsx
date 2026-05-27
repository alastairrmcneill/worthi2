import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { track } from '@/lib/analytics';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Platform,
  ActionSheetIOS,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useIsDark } from '@/hooks/use-theme';
import { useAccountStore } from '@/stores/accountStore';
import { useSettingsStore, type Currency } from '@/stores/settingsStore';
import { ACCOUNT_TYPES } from '@/constants/accountTypes';
import { Spacing } from '@/constants/theme';
import type { Theme } from '@/constants/theme';
import {
  formatCurrency,
  formatCurrencySigned,
  formatPercent,
  formatDate,
} from '@/lib/formatting';
import { investmentStats, houseStats, type RangeKey } from '@/lib/networth';
import {
  interpolateContribution,
  buildAccountSeries,
  buildInvestmentSeries,
  buildHouseSeries,
  todayMs,
} from '@/lib/interpolate';
import NetWorthGraph, { type ScrubInfo } from '@/components/graph/NetWorthGraph';
import RangePicker from '@/components/graph/RangePicker';
import TypePill from '@/components/accounts/TypePill';
import AddEntrySheet, { type AddEntrySheetHandle } from '@/components/sheets/AddEntrySheet';
import type { Account, Entry } from '@/types';

export default function AccountDetailScreen() {
  const theme = useTheme();
  const isDark = useIsDark();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currency = useSettingsStore((s) => s.currency);

  const isLoaded = useAccountStore((s) => s.isLoaded);
  const account = useAccountStore((s) => s.accounts.find((a) => a.id === id));
  const allEntries = useAccountStore((s) => s.entries);
  const updateAccount = useAccountStore((s) => s.updateAccount);
  const deleteAccount = useAccountStore((s) => s.deleteAccount);

  const addEntryRef = useRef<AddEntrySheetHandle>(null);
  const [range, setRange] = useState<RangeKey>('All');

  function handleRangeChange(r: RangeKey) {
    setRange(r);
    if (account) track('detail_range_changed', { range: r, account_type: account.type });
  }
  const [scrub, setScrub] = useState<ScrubInfo | null>(null);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameText, setRenameText] = useState('');

  useEffect(() => {
    if (isLoaded && !account) router.back();
  }, [isLoaded, account]);

  const accountEntries = useMemo(
    () => allEntries.filter((e) => e.accountId === id).sort((a, b) => a.date - b.date),
    [allEntries, id]
  );

  const now = todayMs();

  const startDate = useMemo(() => {
    switch (range) {
      case '1M': return now - 30 * 24 * 60 * 60 * 1000;
      case '3M': return now - 90 * 24 * 60 * 60 * 1000;
      case '6M': return now - 180 * 24 * 60 * 60 * 1000;
      case '1Y': return now - 365 * 24 * 60 * 60 * 1000;
      case 'All':
        return accountEntries.length > 0
          ? accountEntries[0].date
          : now - 30 * 24 * 60 * 60 * 1000;
    }
  }, [range, accountEntries, now]);

  const { series, series2, series2Style } = useMemo(() => {
    if (!account) return { series: [], series2: undefined, series2Style: 'dashed' as const };
    if (account.type === 'investment') {
      const { value, deposited } = buildInvestmentSeries(accountEntries, startDate, now);
      return { series: value, series2: deposited, series2Style: 'dashed' as const };
    }
    if (account.type === 'house') {
      const { equity, putIn } = buildHouseSeries(account, accountEntries, startDate, now);
      const hasPurchasePrice = (account.purchasePrice ?? 0) > 0;
      return { series: equity, series2: hasPurchasePrice ? putIn : undefined, series2Style: 'dashed' as const };
    }
    return {
      series: buildAccountSeries(account, accountEntries, startDate, now),
      series2: undefined,
      series2Style: 'dashed' as const,
    };
  }, [account, accountEntries, startDate, now]);

  const currentValue = useMemo(
    () => (account ? interpolateContribution(account, accountEntries, Date.now()) : 0),
    [account, accountEntries]
  );

  const displayValue = scrub ? scrub.value : currentValue;

  if (!isLoaded || !account) return null;

  const typeConfig = ACCOUNT_TYPES[account.type];
  const isNegative = displayValue < 0;
  const valueColor = isNegative ? theme.danger : theme.fg;
  const historyEntries = [...accountEntries].sort((a, b) => b.date - a.date);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const handleArchive = () => {
    const willArchive = !account.isArchived;
    updateAccount(account.id, { isArchived: willArchive });
    track(willArchive ? 'account_archived' : 'account_unarchived', {
      account_type: account.type,
    });
    router.back();
  };

  const handleRename = () => {
    setRenameText(account.name);
    setRenameVisible(true);
  };

  const commitRename = () => {
    const trimmed = renameText.trim();
    if (trimmed) updateAccount(account.id, { name: trimmed });
    setRenameVisible(false);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Account',
      `Delete "${account.name}" and all its entries? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            track('account_deleted', { account_type: account.type });
            deleteAccount(account.id);
            router.back();
          },
        },
      ]
    );
  };


  const showMenu = () => {
    const archiveLabel = account.isArchived ? 'Unarchive' : 'Archive';
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', archiveLabel, 'Rename', 'Delete Account'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (i) => {
          if (i === 1) handleArchive();
          else if (i === 2) handleRename();
          else if (i === 3) handleDelete();
        }
      );
    } else {
      Alert.alert(account.name, '', [
        { text: archiveLabel, onPress: handleArchive },
        { text: 'Rename', onPress: handleRename },
        { text: 'Delete Account', style: 'destructive', onPress: handleDelete },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

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

        <View style={styles.topCenter}>
          <TypePill type={account.type} />
          <Text style={[styles.topName, { color: theme.fg }]} numberOfLines={1}>
            {account.name}
          </Text>
        </View>

        <Pressable
          onPress={showMenu}
          hitSlop={8}
          style={({ pressed }) => [styles.topBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={theme.fg2} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Value */}
        <View style={styles.valueSection}>
          <Text style={[styles.valueSub, { color: theme.fg3 }]}>
            {scrub ? formatDate(scrub.ts) : typeConfig.label}
          </Text>
          <Text
            style={[styles.valueLarge, { color: valueColor }]}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {formatCurrency(displayValue, currency)}
          </Text>
          {account.type === 'house' && account.isShared && (
            <View style={[styles.sharedBadge, { backgroundColor: `${typeConfig.color}1F` }]}>
              <Text style={[styles.sharedText, { color: typeConfig.color }]}>
                {account.ownershipPct}% owned
              </Text>
            </View>
          )}
        </View>

        {/* Graph */}
        <View style={styles.graphWrap}>
          <NetWorthGraph
            series={series}
            series2={series2}
            series2Style={series2Style}
            series2Color={typeConfig.color}
            height={180}
            color={typeConfig.color}
            isDark={isDark}
            onScrub={setScrub}
            showAxis
            showCrosshair
            currencySymbol={currency.symbol}
          />
        </View>

        {/* Range picker */}
        <View style={styles.rangeRow}>
          <RangePicker value={range} onChange={handleRangeChange} />
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {account.type === 'investment' && (
            <InvestmentStats entries={accountEntries} currency={currency} theme={theme} />
          )}
          {account.type === 'house' && (
            <HouseStats account={account} entries={accountEntries} currency={currency} theme={theme} />
          )}
          {(account.type === 'current' || account.type === 'pension') && (
            <StatGrid theme={theme}>
              <StatCell label="Current Balance" value={formatCurrency(currentValue, currency)} theme={theme} />
              {accountEntries.length > 0 && (
                <StatCell
                  label="Last Updated"
                  value={formatDate(accountEntries[accountEntries.length - 1].date)}
                  theme={theme}
                />
              )}
            </StatGrid>
          )}
          {(account.type === 'credit_card' || account.type === 'loan') && (
            <StatGrid theme={theme}>
              <StatCell
                label="Amount Owed"
                value={formatCurrency(Math.abs(currentValue), currency)}
                valueColor={theme.danger}
                theme={theme}
              />
              {accountEntries.length > 0 && (
                <StatCell
                  label="Last Updated"
                  value={formatDate(accountEntries[accountEntries.length - 1].date)}
                  theme={theme}
                />
              )}
            </StatGrid>
          )}
        </View>

        {/* Add Entry */}
        <AddEntrySheet ref={addEntryRef} />

        <Pressable
          onPress={() => addEntryRef.current?.presentForAccount(account.id)}
          style={({ pressed }) => [
            styles.addEntryBtn,
            { backgroundColor: typeConfig.color },
            pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addEntryLabel}>Add Entry</Text>
        </Pressable>

        {/* History */}
        <View style={styles.historySection}>
          <Text style={[styles.historyTitle, { color: theme.fg2 }]}>History</Text>

          {historyEntries.length === 0 ? (
            <Text style={[styles.historyEmpty, { color: theme.fg3 }]}>No entries yet</Text>
          ) : (
            <View style={[styles.historyList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {historyEntries.map((entry, i) => (
                <HistoryRow
                  key={entry.id}
                  entry={entry}
                  account={account}
                  currency={currency}
                  theme={theme}
                  isLast={i === historyEntries.length - 1}
                  onEdit={() =>
                    addEntryRef.current?.presentForEdit(account.id, entry)
                  }
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Rename Modal */}
      <Modal visible={renameVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRenameVisible(false)} />
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.fg }]}>Rename Account</Text>
            <TextInput
              style={[
                styles.renameInput,
                { color: theme.fg, borderColor: theme.border, backgroundColor: theme.surface2 },
              ]}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={commitRename}
              placeholderTextColor={theme.fg3}
              placeholder="Account name"
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setRenameVisible(false)}
                style={[styles.modalBtn, { borderColor: theme.border, borderWidth: 1 }]}
              >
                <Text style={[styles.modalBtnText, { color: theme.fg2 }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={commitRename}
                style={[styles.modalBtn, { backgroundColor: theme.fg }]}
              >
                <Text style={[styles.modalBtnText, { color: theme.bg }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatGrid({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return <View style={statStyles.grid}>{children}</View>;
}

function StatCell({
  label,
  value,
  valueColor,
  theme,
}: {
  label: string;
  value: string;
  valueColor?: string;
  theme: Theme;
}) {
  return (
    <View style={statStyles.cell}>
      <Text style={[statStyles.label, { color: theme.fg3 }]}>{label}</Text>
      <Text style={[statStyles.value, { color: valueColor ?? theme.fg }]}>{value}</Text>
    </View>
  );
}

function InvestmentStats({
  entries,
  currency,
  theme,
}: {
  entries: Entry[];
  currency: Currency;
  theme: Theme;
}) {
  const stats = investmentStats(entries);
  return (
    <StatGrid theme={theme}>
      <StatCell label="Current Value" value={formatCurrency(stats.currentValue, currency)} theme={theme} />
      <StatCell label="Total Deposited" value={formatCurrency(stats.totalDeposited, currency)} theme={theme} />
      <StatCell
        label="Return"
        value={formatCurrencySigned(stats.absoluteReturn, currency)}
        valueColor={stats.absoluteReturn >= 0 ? theme.success : theme.danger}
        theme={theme}
      />
      <StatCell
        label="Return %"
        value={formatPercent(stats.percentReturn)}
        valueColor={stats.percentReturn >= 0 ? theme.success : theme.danger}
        theme={theme}
      />
    </StatGrid>
  );
}

function HouseStats({
  account,
  entries,
  currency,
  theme,
}: {
  account: Account;
  entries: Entry[];
  currency: Currency;
  theme: Theme;
}) {
  const stats = houseStats(account, entries);
  const equityLabel = account.isShared ? `Your Equity (${account.ownershipPct}%)` : 'Your Equity';
  return (
    <StatGrid theme={theme}>
      <StatCell label={equityLabel} value={formatCurrency(stats.yourEquity, currency)} theme={theme} />
      {stats.totalPutIn !== null && (
        <StatCell label="Total Put In" value={formatCurrency(stats.totalPutIn, currency)} theme={theme} />
      )}
      {stats.equityReturn !== null && (
        <StatCell
          label="Return"
          value={formatCurrencySigned(stats.equityReturn, currency)}
          valueColor={stats.equityReturn >= 0 ? theme.success : theme.danger}
          theme={theme}
        />
      )}
      {stats.returnPct !== null && (
        <StatCell
          label="Return %"
          value={formatPercent(stats.returnPct)}
          valueColor={stats.returnPct >= 0 ? theme.success : theme.danger}
          theme={theme}
        />
      )}
      <StatCell label="Property Value" value={formatCurrency(stats.currentValue, currency)} theme={theme} />
      <StatCell label="Mortgage" value={formatCurrency(stats.currentMortgage, currency)} theme={theme} />
    </StatGrid>
  );
}

function HistoryRow({
  entry,
  account,
  currency,
  theme,
  isLast,
  onEdit,
}: {
  entry: Entry;
  account: Account;
  currency: Currency;
  theme: Theme;
  isLast: boolean;
  onEdit: () => void;
}) {
  let primaryValue: string;
  let primaryColor = theme.fg;
  let secondary: string | null = null;

  if (account.type === 'credit_card' || account.type === 'loan') {
    primaryValue = formatCurrency(Math.abs(entry.value), currency);
    primaryColor = theme.danger;
  } else if (account.type === 'investment') {
    primaryValue = formatCurrency(entry.value, currency);
    if (entry.deposited != null) {
      secondary = `dep. ${formatCurrency(entry.deposited, currency)}`;
    }
  } else if (account.type === 'house') {
    primaryValue = formatCurrency(entry.value, currency);
    if (entry.mortgageBalance != null) {
      secondary = `mort. ${formatCurrency(entry.mortgageBalance, currency)}`;
    }
  } else {
    primaryValue = formatCurrency(entry.value, currency);
  }

  return (
    <Pressable
      onPress={onEdit}
      style={({ pressed }) => [
        histStyles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={histStyles.left}>
        <Text style={[histStyles.date, { color: theme.fg }]}>{formatDate(entry.date)}</Text>
        {secondary && <Text style={[histStyles.secondary, { color: theme.fg3 }]}>{secondary}</Text>}
      </View>
      <Text style={[histStyles.value, { color: primaryColor }]}>{primaryValue}</Text>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  topBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  topName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
    letterSpacing: -0.3,
    flexShrink: 1,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.lg },

  valueSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 4,
  },
  valueSub: {
    fontSize: 13,
    fontFamily: 'Geist_500Medium',
    letterSpacing: 0.1,
  },
  valueLarge: {
    fontSize: 46,
    fontWeight: '700',
    fontFamily: 'Geist_700Bold',
    letterSpacing: -2,
    lineHeight: 56,
  },
  sharedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 2,
  },
  sharedText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
  },

  graphWrap: { marginTop: Spacing.xs },

  rangeRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },

  statsCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },

  addEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: 13,
    borderRadius: 14,
  },
  addEntryLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
  },

  historySection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  historyList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  historyEmpty: {
    fontSize: 14,
    fontFamily: 'Geist_400Regular',
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },

  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
    letterSpacing: -0.3,
  },
  renameInput: {
    fontSize: 16,
    fontFamily: 'Geist_400Regular',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
  },
});

const statStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '50%',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Geist_500Medium',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'GeistMono_600SemiBold',
    letterSpacing: -0.3,
  },
});

const histStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    gap: Spacing.sm,
  },
  left: {
    flex: 1,
    gap: 3,
  },
  date: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Geist_500Medium',
  },
  secondary: {
    fontSize: 12,
    fontFamily: 'Geist_400Regular',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'GeistMono_600SemiBold',
    letterSpacing: -0.2,
  },
});
