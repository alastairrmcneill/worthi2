import type { AccountType } from '@/constants/accountTypes';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  isArchived: boolean;
  purchasePrice: number | null;    // house only
  originalDeposit: number | null;  // house only
  isShared: boolean;               // house only
  ownershipPct: number;            // house only, 1–99
  createdAt: number;               // unix ms
}

export interface Entry {
  id: string;
  accountId: string;
  date: number;                    // unix ms, normalised to midnight local time
  value: number;                   // balance / current value / property value
  deposited: number | null;        // investment only: cumulative total deposited
  mortgageBalance: number | null;  // house only: amount owed (positive)
  createdAt: number;
}

export type NewAccount = Omit<Account, 'id' | 'createdAt'>;
export type NewEntry = Omit<Entry, 'id' | 'createdAt'>;

export interface SeriesPoint {
  ts: number;
  value: number;
}
