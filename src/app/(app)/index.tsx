import React, { useState, useMemo, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import { track } from '@/lib/analytics';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';
import { useAccountStore } from '@/stores/accountStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ACCOUNT_TYPES, TYPE_ORDER, type AccountType } from '@/constants/accountTypes';
import { HOME_GRAPH_COLOR, Spacing } from '@/constants/theme';
import { formatCurrency, formatDate } from '@/lib/formatting';
import {
  currentNetWorth,
  filteredNetWorth,
  buildHomeSeries,
  rangeStartDate,
  type RangeKey,
} from '@/lib/networth';
import { interpolateContribution, todayMs } from '@/lib/interpolate';
import NetWorthGraph, { type ScrubInfo } from '@/components/graph/NetWorthGraph';
import RangePicker from '@/components/graph/RangePicker';
import FilterChip from '@/components/accounts/FilterChip';
import AccountCard from '@/components/accounts/AccountCard';
import AddAccountSheet, { type AddAccountSheetHandle } from '@/components/sheets/AddAccountSheet';

type Filter = AccountType | 'all';

export default function HomeScreen() {
  const theme = useTheme();
  const isDark = useIsDark();
  const router = useRouter();
  const currency = useSettingsStore((s) => s.currency);

  const hasSeenReviewPrompt = useSettingsStore((s) => s.hasSeenReviewPrompt);
  const setHasSeenReviewPrompt = useSettingsStore((s) => s.setHasSeenReviewPrompt);

  const accounts = useAccountStore((s) => s.accounts);
  const entries = useAccountStore((s) => s.entries);
  const isLoaded = useAccountStore((s) => s.isLoaded);

  const addAccountRef = useRef<AddAccountSheetHandle>(null);
  const [range, setRange] = useState<RangeKey>('6M');
  const [filter, setFilter] = useState<Filter>('all');

  function handleRangeChange(r: RangeKey) {
    setRange(r);
    track('home_range_changed', { range: r });
  }

  function handleFilterChange(f: Filter) {
    setFilter(f);
    track('home_filter_changed', { filter: f });
  }
  const [scrub, setScrub] = useState<ScrubInfo | null>(null);

  const activeAccounts = useMemo(
    () => accounts.filter((a) => !a.isArchived),
    [accounts]
  );

  const entriesMap = useMemo(() => {
    const map = new Map<string, typeof entries[number][]>();
    for (const entry of entries) {
      const arr = map.get(entry.accountId) ?? [];
      arr.push(entry);
      map.set(entry.accountId, arr);
    }
    return map;
  }, [entries]);

  const now = todayMs();
  const startDate = useMemo(
    () => rangeStartDate(range, activeAccounts, entriesMap),
    [range, activeAccounts, entriesMap]
  );

  const series = useMemo(
    () => buildHomeSeries(activeAccounts, entriesMap, filter, startDate, now),
    [activeAccounts, entriesMap, filter, startDate, now]
  );

  const netWorth = useMemo(
    () =>
      filter === 'all'
        ? currentNetWorth(activeAccounts, entriesMap)
        : filteredNetWorth(activeAccounts, entriesMap, filter),
    [activeAccounts, entriesMap, filter]
  );

  const displayValue = scrub ? scrub.value : netWorth;
  const displayLabel = scrub
    ? formatDate(scrub.ts)
    : filter === 'all'
    ? 'Net Worth'
    : ACCOUNT_TYPES[filter].label;

  // Sorted account list: by absolute value desc
  const sortedAccounts = useMemo(() => {
    return [...activeAccounts].sort((a, b) => {
      const va = Math.abs(interpolateContribution(a, entriesMap.get(a.id) ?? [], Date.now()));
      const vb = Math.abs(interpolateContribution(b, entriesMap.get(b.id) ?? [], Date.now()));
      return vb - va;
    });
  }, [activeAccounts, entriesMap]);

  const filteredAccounts = useMemo(
    () =>
      filter === 'all'
        ? sortedAccounts
        : sortedAccounts.filter((a) => a.type === filter),
    [sortedAccounts, filter]
  );

  const isPositive = displayValue >= 0;
  const graphColor =
    filter === 'all' ? HOME_GRAPH_COLOR : ACCOUNT_TYPES[filter as AccountType].color;

  const isEmpty = activeAccounts.length === 0;

  if (!isLoaded) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={[styles.appName, { color: theme.fg }]}>Worthi</Text>
        <Pressable
          onPress={() => router.push('/(app)/settings')}
          style={({ pressed }) => [
            styles.settingsBtn,
            pressed && { opacity: 0.6 },
          ]}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={18} color={theme.fg2} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Net worth header */}
        <View style={styles.header}>
          <Text style={[styles.headerLabel, { color: theme.fg3 }]}>{displayLabel}</Text>
          <Text
            style={[
              styles.headerValue,
              { color: isPositive ? theme.fg : theme.danger },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatCurrency(displayValue, currency)}
          </Text>
        </View>

        {/* Graph */}
        <View style={styles.graphWrap}>
          {isEmpty ? (
            <View style={[styles.emptyGraph, { borderColor: theme.border }]}>
              <View style={[styles.emptyGraphLine, { backgroundColor: theme.border }]} />
            </View>
          ) : (
            <NetWorthGraph
              series={series}
              height={180}
              color={graphColor}
              isDark={isDark}
              onScrub={setScrub}
              showAxis
              showCrosshair
            />
          )}
        </View>

        {/* Range picker */}
        <View style={styles.rangeRow}>
          <RangePicker value={range} onChange={handleRangeChange} />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          <FilterChip
            type="all"
            label="All"
            active={filter === 'all'}
            onPress={() => handleFilterChange('all')}
          />
          {TYPE_ORDER.map((type) => (
            <FilterChip
              key={type}
              type={type}
              label={ACCOUNT_TYPES[type].short}
              active={filter === type}
              onPress={() => handleFilterChange(type)}
            />
          ))}
        </ScrollView>

        {/* Account list or empty state */}
        {isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.fg }]}>No accounts yet</Text>
            <Text style={[styles.emptySub, { color: theme.fg3 }]}>
              Tap + to add your first account
            </Text>
          </View>
        ) : (
          <View style={styles.accountList}>
            {filteredAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                entries={entriesMap.get(account.id) ?? []}
              />
            ))}
            {filteredAccounts.length === 0 && (
              <Text style={[styles.emptyFilter, { color: theme.fg3 }]}>
                No {ACCOUNT_TYPES[filter as AccountType]?.label} accounts
              </Text>
            )}
          </View>
        )}

        {/* Bottom padding for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <AddAccountSheet ref={addAccountRef} />

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          addAccountRef.current?.present();
        }}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.fg },
          pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
        ]}
      >
        <Ionicons name="add" size={28} color={theme.bg} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Geist_700Bold',
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xl },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 2,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Geist_500Medium',
    letterSpacing: 0.1,
  },
  headerValue: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'Geist_700Bold',
    letterSpacing: -2,
    lineHeight: 58,
  },

  graphWrap: {
    marginTop: Spacing.xs,
  },
  emptyGraph: {
    height: 180,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGraphLine: {
    width: '80%',
    height: 1,
  },

  rangeRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },

  chipsScroll: { marginTop: Spacing.sm },
  chipsRow: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
    flexDirection: 'row',
  },

  accountList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },

  emptyState: {
    paddingTop: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Geist_400Regular',
  },
  emptyFilter: {
    fontSize: 14,
    fontFamily: 'Geist_400Regular',
    textAlign: 'center',
    paddingTop: Spacing.xl,
  },

  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
