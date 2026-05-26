import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ACCOUNT_TYPES, type AccountType } from '@/constants/accountTypes';
import type { Account, Entry } from '@/types';
import TypePill from './TypePill';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { formatCurrency, formatPercent } from '@/lib/formatting';
import { interpolateContribution } from '@/lib/interpolate';
import { investmentStats } from '@/lib/networth';

interface Props {
  account: Account;
  entries: Entry[];
}

export default function AccountCard({ account, entries }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const currency = useSettingsStore((s) => s.currency);
  const typeConfig = ACCOUNT_TYPES[account.type];

  const value = interpolateContribution(account, entries, Date.now());
  const isNegative = value < 0;

  // Return % for investments
  let returnPct: number | null = null;
  if (account.type === 'investment') {
    const stats = investmentStats(entries);
    if (stats.totalDeposited > 0) returnPct = stats.percentReturn;
  }

  // Equity gain % for house
  if (account.type === 'house' && account.originalDeposit && account.originalDeposit > 0) {
    const latestEntry = entries.slice().sort((a, b) => b.date - a.date)[0];
    if (latestEntry) {
      const equity = (latestEntry.value - (latestEntry.mortgageBalance ?? 0)) * (account.ownershipPct / 100);
      const initialEquity = (account.originalDeposit ?? 0) * (account.ownershipPct / 100);
      if (initialEquity > 0) returnPct = ((equity - initialEquity) / initialEquity) * 100;
    }
  }

  const displayValue = formatCurrency(value, currency);
  const valueColor = isNegative ? theme.danger : theme.fg;

  return (
    <Pressable
      onPress={() => router.push(`/(app)/account/${account.id}`)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.left}>
        <View style={styles.topRow}>
          <TypePill type={account.type} />
          {account.type === 'house' && account.isShared && (
            <View style={[styles.sharedBadge, { backgroundColor: `${typeConfig.color}1F` }]}>
              <Text style={[styles.sharedText, { color: typeConfig.color }]}>
                {account.ownershipPct}% owned
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.name, { color: theme.fg }]} numberOfLines={1}>
          {account.name}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.value, { color: valueColor }]} numberOfLines={1}>
          {displayValue}
        </Text>
        {returnPct !== null && (
          <Text
            style={[
              styles.returnPct,
              { color: returnPct >= 0 ? theme.success : theme.danger },
            ]}
          >
            {formatPercent(returnPct)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  pressed: { opacity: 0.75 },
  left: { flex: 1, gap: 6, marginRight: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Geist_500Medium',
  },
  right: { alignItems: 'flex-end', gap: 3 },
  value: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'GeistMono_600SemiBold',
    letterSpacing: -0.3,
  },
  returnPct: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
  },
  sharedBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  sharedText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
    letterSpacing: 0.2,
  },
});
