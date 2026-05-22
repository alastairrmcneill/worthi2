import { create } from 'zustand';
import type { Account, Entry, NewAccount, NewEntry } from '@/types';
import { initializeDb } from '@/db/client';
import * as q from '@/db/queries';

interface AccountStoreState {
  accounts: Account[];
  entries: Entry[];
  isLoaded: boolean;

  initialize: () => void;
  addAccount: (account: NewAccount) => Account;
  updateAccount: (id: string, updates: Partial<Pick<Account, 'name' | 'isArchived' | 'isShared' | 'ownershipPct'>>) => void;
  deleteAccount: (id: string) => void;
  addEntry: (entry: NewEntry) => Entry;
  updateEntry: (id: string, updates: Partial<Pick<Entry, 'date' | 'value' | 'deposited' | 'mortgageBalance'>>) => void;
  deleteEntry: (id: string) => void;

  // Selectors (derived from state — use these in components)
  entriesForAccount: (accountId: string) => Entry[];
  entriesByAccount: () => Map<string, Entry[]>;
}

export const useAccountStore = create<AccountStoreState>((set, get) => ({
  accounts: [],
  entries: [],
  isLoaded: false,

  initialize() {
    initializeDb();
    const accounts = q.getAllAccounts();
    const entries = q.getAllEntries();
    set({ accounts, entries, isLoaded: true });
  },

  addAccount(account) {
    const created = q.insertAccount(account);
    set((s) => ({ accounts: [...s.accounts, created] }));
    return created;
  },

  updateAccount(id, updates) {
    q.updateAccount(id, updates);
    set((s) => ({
      accounts: s.accounts.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  },

  deleteAccount(id) {
    q.deleteAccount(id);
    set((s) => ({
      accounts: s.accounts.filter((a) => a.id !== id),
      entries: s.entries.filter((e) => e.accountId !== id),
    }));
  },

  addEntry(entry) {
    const created = q.insertEntry(entry);
    set((s) => ({ entries: [...s.entries, created] }));
    return created;
  },

  updateEntry(id, updates) {
    q.updateEntry(id, updates);
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
  },

  deleteEntry(id) {
    q.deleteEntry(id);
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
  },

  entriesForAccount(accountId) {
    return get().entries.filter((e) => e.accountId === accountId);
  },

  entriesByAccount() {
    const map = new Map<string, Entry[]>();
    for (const entry of get().entries) {
      const arr = map.get(entry.accountId) ?? [];
      arr.push(entry);
      map.set(entry.accountId, arr);
    }
    return map;
  },
}));
