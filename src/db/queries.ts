import type { AccountType } from '@/constants/accountTypes';
import type { Account, Entry, NewAccount, NewEntry } from '@/types';
import { getDb } from './client';

// ─── ID generation ───────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Row types (snake_case from SQLite) ──────────────────────────────────────

interface AccountRow {
  id: string;
  name: string;
  type: string;
  is_archived: number;
  purchase_price: number | null;
  original_deposit: number | null;
  is_shared: number;
  ownership_pct: number;
  created_at: number;
}

interface EntryRow {
  id: string;
  account_id: string;
  date: number;
  value: number;
  deposited: number | null;
  mortgage_balance: number | null;
  created_at: number;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function rowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type as AccountType,
    isArchived: row.is_archived === 1,
    purchasePrice: row.purchase_price,
    originalDeposit: row.original_deposit,
    isShared: row.is_shared === 1,
    ownershipPct: row.ownership_pct,
    createdAt: row.created_at,
  };
}

function rowToEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    accountId: row.account_id,
    date: row.date,
    value: row.value,
    deposited: row.deposited,
    mortgageBalance: row.mortgage_balance,
    createdAt: row.created_at,
  };
}

// ─── Account queries ──────────────────────────────────────────────────────────

export function getAllAccounts(): Account[] {
  const db = getDb();
  const rows = db.getAllSync<AccountRow>('SELECT * FROM accounts ORDER BY created_at ASC');
  return rows.map(rowToAccount);
}

export function insertAccount(account: NewAccount): Account {
  const db = getDb();
  const id = generateId();
  const now = Date.now();
  db.runSync(
    `INSERT INTO accounts (id, name, type, is_archived, purchase_price, original_deposit, is_shared, ownership_pct, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      account.name,
      account.type,
      account.isArchived ? 1 : 0,
      account.purchasePrice ?? null,
      account.originalDeposit ?? null,
      account.isShared ? 1 : 0,
      account.ownershipPct,
      now,
    ]
  );
  return { ...account, id, createdAt: now };
}

export function updateAccount(
  id: string,
  updates: Partial<Pick<Account, 'name' | 'isArchived' | 'isShared' | 'ownershipPct'>>
): void {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.isArchived !== undefined) {
    fields.push('is_archived = ?');
    values.push(updates.isArchived ? 1 : 0);
  }
  if (updates.isShared !== undefined) {
    fields.push('is_shared = ?');
    values.push(updates.isShared ? 1 : 0);
  }
  if (updates.ownershipPct !== undefined) {
    fields.push('ownership_pct = ?');
    values.push(updates.ownershipPct);
  }

  if (fields.length === 0) return;
  values.push(id);
  db.runSync(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`, values);
}

export function deleteAccount(id: string): void {
  // ON DELETE CASCADE handles entries
  getDb().runSync('DELETE FROM accounts WHERE id = ?', [id]);
}

// ─── Entry queries ────────────────────────────────────────────────────────────

export function getEntriesForAccount(accountId: string): Entry[] {
  const db = getDb();
  const rows = db.getAllSync<EntryRow>(
    'SELECT * FROM entries WHERE account_id = ? ORDER BY date ASC',
    [accountId]
  );
  return rows.map(rowToEntry);
}

export function getLastEntryForAccount(accountId: string): Entry | null {
  const db = getDb();
  const rows = db.getAllSync<EntryRow>(
    'SELECT * FROM entries WHERE account_id = ? ORDER BY date DESC LIMIT 1',
    [accountId]
  );
  return rows.length > 0 ? rowToEntry(rows[0]) : null;
}

export function getAllEntries(): Entry[] {
  const db = getDb();
  const rows = db.getAllSync<EntryRow>('SELECT * FROM entries ORDER BY account_id, date ASC');
  return rows.map(rowToEntry);
}

export function insertEntry(entry: NewEntry): Entry {
  const db = getDb();
  const id = generateId();
  const now = Date.now();
  db.runSync(
    `INSERT INTO entries (id, account_id, date, value, deposited, mortgage_balance, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      entry.accountId,
      entry.date,
      entry.value,
      entry.deposited ?? null,
      entry.mortgageBalance ?? null,
      now,
    ]
  );
  return { ...entry, id, createdAt: now };
}

export function updateEntry(
  id: string,
  updates: Partial<Pick<Entry, 'date' | 'value' | 'deposited' | 'mortgageBalance'>>
): void {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.date !== undefined) {
    fields.push('date = ?');
    values.push(updates.date);
  }
  if (updates.value !== undefined) {
    fields.push('value = ?');
    values.push(updates.value);
  }
  if (updates.deposited !== undefined) {
    fields.push('deposited = ?');
    values.push(updates.deposited ?? null);
  }
  if (updates.mortgageBalance !== undefined) {
    fields.push('mortgage_balance = ?');
    values.push(updates.mortgageBalance ?? null);
  }

  if (fields.length === 0) return;
  values.push(id);
  db.runSync(`UPDATE entries SET ${fields.join(', ')} WHERE id = ?`, values);
}

export function deleteEntry(id: string): void {
  getDb().runSync('DELETE FROM entries WHERE id = ?', [id]);
}
