import type { Account, Entry, SeriesPoint } from '@/types';

// Net worth contribution of a single entry for a given account
export function entryContribution(account: Account, entry: Entry): number {
  if (account.type === 'house') {
    const mortgage = entry.mortgageBalance ?? 0;
    const equity = entry.value - mortgage;
    return equity * (account.ownershipPct / 100);
  }
  return entry.value;
}

// Value at date T for a single account, linearly interpolated between entries.
// Returns 0 before the first entry; carries last value forward after the last entry.
export function interpolateContribution(
  account: Account,
  entries: Entry[],
  date: number
): number {
  if (entries.length === 0) return 0;

  const sorted = entries.slice().sort((a, b) => a.date - b.date);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (date < first.date) return 0;
  if (date >= last.date) return entryContribution(account, last);

  // Find the two entries that bracket `date`
  let lo = sorted[0];
  let hi = sorted[1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].date <= date && sorted[i + 1].date > date) {
      lo = sorted[i];
      hi = sorted[i + 1];
      break;
    }
  }

  const t = (date - lo.date) / (hi.date - lo.date);
  const vLo = entryContribution(account, lo);
  const vHi = entryContribution(account, hi);
  return vLo + (vHi - vLo) * t;
}

// Build a uniform series of points for one account between startDate and endDate.
export function buildAccountSeries(
  account: Account,
  entries: Entry[],
  startDate: number,
  endDate: number,
  numPoints = 80
): SeriesPoint[] {
  const range = endDate - startDate;
  const points: SeriesPoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const ts = startDate + (range * i) / (numPoints - 1);
    points.push({ ts, value: interpolateContribution(account, entries, ts) });
  }
  return points;
}

// Build a uniform series for total net worth (sum across all accounts).
export function buildTotalSeries(
  accounts: Account[],
  entriesByAccount: Map<string, Entry[]>,
  startDate: number,
  endDate: number,
  numPoints = 80
): SeriesPoint[] {
  const range = endDate - startDate;
  const points: SeriesPoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const ts = startDate + (range * i) / (numPoints - 1);
    let total = 0;
    for (const account of accounts) {
      const entries = entriesByAccount.get(account.id) ?? [];
      total += interpolateContribution(account, entries, ts);
    }
    points.push({ ts, value: total });
  }
  return points;
}

// For a house account: build two series — equity (user share) and full property value.
export function buildHouseSeries(
  account: Account,
  entries: Entry[],
  startDate: number,
  endDate: number,
  numPoints = 80
): { equity: SeriesPoint[]; propertyValue: SeriesPoint[] } {
  const range = endDate - startDate;
  const sorted = entries.slice().sort((a, b) => a.date - b.date);
  const equity: SeriesPoint[] = [];
  const propertyValue: SeriesPoint[] = [];

  for (let i = 0; i < numPoints; i++) {
    const ts = startDate + (range * i) / (numPoints - 1);

    if (sorted.length === 0 || ts < sorted[0].date) {
      equity.push({ ts, value: 0 });
      propertyValue.push({ ts, value: 0 });
      continue;
    }

    const last = sorted[sorted.length - 1];
    if (ts >= last.date) {
      const mortgage = last.mortgageBalance ?? 0;
      equity.push({ ts, value: (last.value - mortgage) * (account.ownershipPct / 100) });
      propertyValue.push({ ts, value: last.value });
      continue;
    }

    let lo = sorted[0];
    let hi = sorted[1];
    for (let j = 0; j < sorted.length - 1; j++) {
      if (sorted[j].date <= ts && sorted[j + 1].date > ts) {
        lo = sorted[j];
        hi = sorted[j + 1];
        break;
      }
    }

    const t = (ts - lo.date) / (hi.date - lo.date);
    const interpValue = lo.value + (hi.value - lo.value) * t;
    const interpMortgage = (lo.mortgageBalance ?? 0) + ((hi.mortgageBalance ?? 0) - (lo.mortgageBalance ?? 0)) * t;

    equity.push({ ts, value: (interpValue - interpMortgage) * (account.ownershipPct / 100) });
    propertyValue.push({ ts, value: interpValue });
  }

  return { equity, propertyValue };
}

// For an investment account: build value and deposited series separately.
export function buildInvestmentSeries(
  entries: Entry[],
  startDate: number,
  endDate: number,
  numPoints = 80
): { value: SeriesPoint[]; deposited: SeriesPoint[] } {
  const range = endDate - startDate;
  const sorted = entries.slice().sort((a, b) => a.date - b.date);
  const value: SeriesPoint[] = [];
  const deposited: SeriesPoint[] = [];

  for (let i = 0; i < numPoints; i++) {
    const ts = startDate + (range * i) / (numPoints - 1);

    if (sorted.length === 0 || ts < sorted[0].date) {
      value.push({ ts, value: 0 });
      deposited.push({ ts, value: 0 });
      continue;
    }

    const last = sorted[sorted.length - 1];
    if (ts >= last.date) {
      value.push({ ts, value: last.value });
      deposited.push({ ts, value: last.deposited ?? 0 });
      continue;
    }

    let lo = sorted[0];
    let hi = sorted[1];
    for (let j = 0; j < sorted.length - 1; j++) {
      if (sorted[j].date <= ts && sorted[j + 1].date > ts) {
        lo = sorted[j];
        hi = sorted[j + 1];
        break;
      }
    }

    const t = (ts - lo.date) / (hi.date - lo.date);
    value.push({ ts, value: lo.value + (hi.value - lo.value) * t });
    deposited.push({
      ts,
      value: (lo.deposited ?? 0) + ((hi.deposited ?? 0) - (lo.deposited ?? 0)) * t,
    });
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
