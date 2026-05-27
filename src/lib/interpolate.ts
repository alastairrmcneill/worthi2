import type { Account, Entry, SeriesPoint } from '@/types';

const DAY_MS = 86_400_000;

// Net worth contribution of a single entry for a given account
export function entryContribution(account: Account, entry: Entry): number {
  if (account.type === 'house') {
    const mortgage = entry.mortgageBalance ?? 0;
    const equity = entry.value - mortgage;
    return equity * (account.ownershipPct / 100);
  }
  return entry.value;
}

// Value at date T using step-function carry-forward: last known entry on or before T.
// Returns 0 before the first entry.
export function interpolateContribution(
  account: Account,
  entries: Entry[],
  date: number
): number {
  if (entries.length === 0) return 0;
  const sorted = entries.slice().sort((a, b) => b.date - a.date);
  const entry = sorted.find((e) => e.date <= date);
  return entry ? entryContribution(account, entry) : 0;
}

// Generate sample dates: daily for ranges ≤ 31 days, monthly + today otherwise.
function sampleDates(startMs: number, endMs: number): number[] {
  const rangeDays = (endMs - startMs) / DAY_MS;
  const dates: number[] = [];

  if (rangeDays <= 31) {
    let d = startMs;
    while (d <= endMs) {
      dates.push(d);
      d += DAY_MS;
    }
    if (dates[dates.length - 1] !== endMs) dates.push(endMs);
  } else {
    const start = new Date(startMs);
    let cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur.getTime() <= endMs) {
      dates.push(cur.getTime());
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    if (dates[dates.length - 1] !== endMs) dates.push(endMs);
  }

  return dates;
}

// Build a series for one account between startDate and endDate (step-function).
export function buildAccountSeries(
  account: Account,
  entries: Entry[],
  startDate: number,
  endDate: number
): SeriesPoint[] {
  return sampleDates(startDate, endDate).map((ts) => ({
    ts,
    value: interpolateContribution(account, entries, ts),
  }));
}

// Build total net worth series (sum across all accounts).
export function buildTotalSeries(
  accounts: Account[],
  entriesByAccount: Map<string, Entry[]>,
  startDate: number,
  endDate: number
): SeriesPoint[] {
  return sampleDates(startDate, endDate).map((ts) => {
    let total = 0;
    for (const account of accounts) {
      const entries = entriesByAccount.get(account.id) ?? [];
      total += interpolateContribution(account, entries, ts);
    }
    return { ts, value: total };
  });
}

// House account: two series — equity (user share) and total put in (deposit + principal repaid).
export function buildHouseSeries(
  account: Account,
  entries: Entry[],
  startDate: number,
  endDate: number
): { equity: SeriesPoint[]; putIn: SeriesPoint[] } {
  const sorted = entries.slice().sort((a, b) => b.date - a.date);
  const equity: SeriesPoint[] = [];
  const putIn: SeriesPoint[] = [];
  const purchasePrice = account.purchasePrice ?? 0;

  for (const ts of sampleDates(startDate, endDate)) {
    const entry = sorted.find((e) => e.date <= ts);
    if (!entry) {
      equity.push({ ts, value: 0 });
      putIn.push({ ts, value: 0 });
    } else {
      const mortgage = entry.mortgageBalance ?? 0;
      equity.push({ ts, value: (entry.value - mortgage) * (account.ownershipPct / 100) });
      putIn.push({ ts, value: purchasePrice > 0 ? (purchasePrice - mortgage) * (account.ownershipPct / 100) : 0 });
    }
  }

  return { equity, putIn };
}

// Investment account: value and deposited series separately.
export function buildInvestmentSeries(
  entries: Entry[],
  startDate: number,
  endDate: number
): { value: SeriesPoint[]; deposited: SeriesPoint[] } {
  const sorted = entries.slice().sort((a, b) => b.date - a.date);
  const value: SeriesPoint[] = [];
  const deposited: SeriesPoint[] = [];

  for (const ts of sampleDates(startDate, endDate)) {
    const entry = sorted.find((e) => e.date <= ts);
    if (!entry) {
      value.push({ ts, value: 0 });
      deposited.push({ ts, value: 0 });
    } else {
      value.push({ ts, value: entry.value });
      deposited.push({ ts, value: entry.deposited ?? 0 });
    }
  }

  return { value, deposited };
}

// Earliest date with data across a set of accounts.
export function earliestEntryDate(
  accounts: Account[],
  entriesByAccount: Map<string, Entry[]>
): number | null {
  let earliest: number | null = null;
  for (const account of accounts) {
    const entries = entriesByAccount.get(account.id) ?? [];
    for (const entry of entries) {
      if (earliest === null || entry.date < earliest) earliest = entry.date;
    }
  }
  return earliest;
}

// Normalise a JS Date to midnight local time (unix ms).
export function toDateMs(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function todayMs(): number {
  return toDateMs(new Date());
}
