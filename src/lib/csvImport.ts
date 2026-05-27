import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync } from 'expo-file-system/legacy';
import type { NewAccount, NewEntry } from '@/types';
import type { AccountType } from '@/constants/accountTypes';
import { fromISODate } from './formatting';
import { useAccountStore } from '@/stores/accountStore';
import { track } from './analytics';

export interface ImportError {
  row: number;
  reason: string;
}

export interface ImportResult {
  accountsCreated: number;
  entriesCreated: number;
  skippedRows: number;
  errors: ImportError[];
}

const VALID_TYPES = new Set<string>([
  'current',
  'credit_card',
  'investment',
  'loan',
  'pension',
  'house',
]);

function parseBool(s: string): boolean {
  return s.trim().toLowerCase() === 'true' || s.trim() === '1';
}

function parseRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsvText(csvText: string): {
  accounts: Map<string, NewAccount>;
  entriesByName: Map<string, NewEntry[]>;
  errors: ImportError[];
} {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  const errors: ImportError[] = [];
  const accountMap = new Map<string, NewAccount>();
  const entriesByName = new Map<string, NewEntry[]>();

  if (lines.length === 0) return { accounts: accountMap, entriesByName, errors };

  const headerLine = lines[0].toLowerCase();
  const startIndex = headerLine.includes('account_name') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const rowNum = i + 1;
    const cols = parseRow(lines[i]);
    if (cols.length < 4) {
      errors.push({ row: rowNum, reason: 'Too few columns' });
      continue;
    }

    const [
      account_name,
      account_type,
      date_str,
      value_str,
      deposited_str = '',
      mortgage_balance_str = '',
      purchase_price_str = '',
      original_deposit_str = '',
      is_shared_str = '',
      ownership_pct_str = '',
    ] = cols;

    if (!account_name) {
      errors.push({ row: rowNum, reason: 'Missing account_name' });
      continue;
    }

    const type = account_type?.trim().toLowerCase();
    if (!VALID_TYPES.has(type)) {
      errors.push({ row: rowNum, reason: `Invalid account_type: "${account_type}"` });
      continue;
    }

    const dateMs = fromISODate(date_str?.trim() ?? '');
    if (!dateMs) {
      errors.push({ row: rowNum, reason: `Invalid date: "${date_str}" (expected YYYY-MM-DD)` });
      continue;
    }

    const rawValue = parseFloat(value_str);
    if (isNaN(rawValue) || rawValue < 0) {
      errors.push({ row: rowNum, reason: `Invalid value: "${value_str}"` });
      continue;
    }

    if (!accountMap.has(account_name)) {
      const isShared = parseBool(is_shared_str);
      const ownershipPct =
        type === 'house' && isShared
          ? Math.min(99, Math.max(1, parseFloat(ownership_pct_str) || 50))
          : 100;

      accountMap.set(account_name, {
        name: account_name,
        type: type as AccountType,
        isArchived: false,
        purchasePrice:
          type === 'house' ? (parseFloat(purchase_price_str) || null) : null,
        originalDeposit:
          type === 'house' ? (parseFloat(original_deposit_str) || null) : null,
        isShared: type === 'house' ? isShared : false,
        ownershipPct,
      });
    }

    const isLiability = type === 'credit_card' || type === 'loan';
    const storedValue = isLiability ? -rawValue : rawValue;
    const finalValue = type === 'house' ? rawValue : storedValue;

    const arr = entriesByName.get(account_name) ?? [];
    arr.push({
      accountId: '',
      date: dateMs,
      value: finalValue,
      deposited: type === 'investment' ? (parseFloat(deposited_str) || null) : null,
      mortgageBalance:
        type === 'house' ? (parseFloat(mortgage_balance_str) || null) : null,
    });
    entriesByName.set(account_name, arr);
  }

  return { accounts: accountMap, entriesByName, errors };
}

interface PendingImport {
  accounts: Map<string, NewAccount>;
  entriesByName: Map<string, NewEntry[]>;
  errors: ImportError[];
}

let pendingImport: PendingImport | null = null;

// `navigate` accepts `any` so we don't need to import the full router type
export async function previewCsv(navigate: (path: any) => void): Promise<void> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return;

  const fileUri = result.assets[0].uri;
  const csvText = await readAsStringAsync(fileUri);

  const { accounts, entriesByName, errors } = parseCsvText(csvText);

  let entriesTotal = 0;
  for (const entries of entriesByName.values()) entriesTotal += entries.length;

  pendingImport = { accounts, entriesByName, errors };

  navigate(
    `/(app)/import-result?mode=preview&accounts=${accounts.size}&entries=${entriesTotal}&skipped=${errors.length}&errors=${encodeURIComponent(JSON.stringify(errors))}`
  );
}

export function commitImport(navigate: (path: any) => void): void {
  if (!pendingImport) return;

  const { accounts, entriesByName, errors } = pendingImport;
  pendingImport = null;

  const store = useAccountStore.getState();
  let accountsCreated = 0;
  let entriesCreated = 0;

  for (const [name, newAccount] of accounts) {
    const created = store.addAccount(newAccount);
    accountsCreated++;

    const accountEntries = entriesByName.get(name) ?? [];
    for (const entry of accountEntries) {
      store.addEntry({ ...entry, accountId: created.id });
      entriesCreated++;
    }
  }

  track('csv_imported', {
    accounts_count: accountsCreated,
    entries_count: entriesCreated,
    skipped_count: errors.length,
  });

  navigate('/(app)');
}
