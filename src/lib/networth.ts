import type { Account, Entry, SeriesPoint } from '@/types';
import type { AccountType } from '@/constants/accountTypes';
import { interpolateContribution, buildTotalSeries, earliestEntryDate, todayMs } from './interpolate';

export type RangeKey = '1M' | '3M' | '6M' | '1Y' | 'All';

export function rangeStartDate(range: RangeKey, allAccounts: Account[], entriesByAccount: Map<string, Entry[]>): number {
  const now = todayMs();
  switch (range) {
    case '1M': return now - 30 * 24 * 60 * 60 * 1000;
    case '3M': return now - 90 * 24 * 60 * 60 * 1000;
    case '6M': return now - 180 * 24 * 60 * 60 * 1000;
    case '1Y': return now - 365 * 24 * 60 * 60 * 1000;
    case 'All': {
      const earliest = earliestEntryDate(allAccounts, entriesByAccount);
      return earliest ?? now - 30 * 24 * 60 * 60 * 1000;
    }
  }
}

// Current net worth — sum of all account contributions at now (includes archived, last value carried forward).
export function currentNetWorth(
  accounts: Account[],
  entriesByAccount: Map<string, Entry[]>
): number {
  const now = Date.now();
  return accounts.reduce((sum, account) => {
    const entries = entriesByAccount.get(account.id) ?? [];
    return sum + interpolateContribution(account, entries, now);
  }, 0);
}

// Filtered net worth — sum for accounts matching one or more types (empty = all). Includes archived.
export function filteredNetWorth(
  accounts: Account[],
  entriesByAccount: Map<string, Entry[]>,
  types: AccountType[]
): number {
  const now = Date.now();
  const typeSet = new Set(types);
  return accounts
    .filter((a) => typeSet.size === 0 || typeSet.has(a.type))
    .reduce((sum, account) => {
      const entries = entriesByAccount.get(account.id) ?? [];
      return sum + interpolateContribution(account, entries, now);
    }, 0);
}

// Latest entry contribution for a single account (for display on account card).
export function accountCurrentValue(account: Account, entries: Entry[]): number {
  const now = Date.now();
  return interpolateContribution(account, entries, now);
}

// Build series for home graph — all accounts combined or filtered by types (empty = all).
export function buildHomeSeries(
  accounts: Account[],
  entriesByAccount: Map<string, Entry[]>,
  types: AccountType[],
  startDate: number,
  endDate: number
): SeriesPoint[] {
  const typeSet = new Set(types);
  const filtered = typeSet.size === 0 ? accounts : accounts.filter((a) => typeSet.has(a.type));
  return buildTotalSeries(filtered, entriesByAccount, startDate, endDate);
}

// Investment return stats.
export function investmentStats(entries: Entry[]): {
  totalDeposited: number;
  currentValue: number;
  absoluteReturn: number;
  percentReturn: number;
} {
  if (entries.length === 0) {
    return { totalDeposited: 0, currentValue: 0, absoluteReturn: 0, percentReturn: 0 };
  }
  const latest = entries.slice().sort((a, b) => b.date - a.date)[0];
  const currentValue = latest.value;
  const totalDeposited = latest.deposited ?? 0;
  const absoluteReturn = currentValue - totalDeposited;
  const percentReturn = totalDeposited > 0 ? (absoluteReturn / totalDeposited) * 100 : 0;
  return { totalDeposited, currentValue, absoluteReturn, percentReturn };
}

// House stats.
export function houseStats(account: Account, entries: Entry[]): {
  purchasePrice: number;
  originalDeposit: number;
  currentValue: number;
  currentMortgage: number;
  fullEquity: number;
  yourEquity: number;
  equityGain: number;
} {
  const purchasePrice = account.purchasePrice ?? 0;
  const originalDeposit = account.originalDeposit ?? 0;

  if (entries.length === 0) {
    return { purchasePrice, originalDeposit, currentValue: 0, currentMortgage: 0, fullEquity: 0, yourEquity: 0, equityGain: 0 };
  }

  const latest = entries.slice().sort((a, b) => b.date - a.date)[0];
  const currentValue = latest.value;
  const currentMortgage = latest.mortgageBalance ?? 0;
  const fullEquity = currentValue - currentMortgage;
  const yourEquity = fullEquity * (account.ownershipPct / 100);
  const initialEquity = originalDeposit * (account.ownershipPct / 100);
  const equityGain = yourEquity - initialEquity;

  return { purchasePrice, originalDeposit, currentValue, currentMortgage, fullEquity, yourEquity, equityGain };
}
