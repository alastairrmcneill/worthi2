import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('worthi.db');
  }
  return _db;
}

export function initializeDb(): void {
  const db = getDb();
  db.execSync('PRAGMA journal_mode = WAL;');
  db.execSync('PRAGMA foreign_keys = ON;');

  db.execSync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      is_archived INTEGER NOT NULL DEFAULT 0,
      purchase_price REAL,
      original_deposit REAL,
      is_shared INTEGER NOT NULL DEFAULT 0,
      ownership_pct REAL NOT NULL DEFAULT 50,
      created_at INTEGER NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      date INTEGER NOT NULL,
      value REAL NOT NULL,
      deposited REAL,
      mortgage_balance REAL,
      created_at INTEGER NOT NULL
    );
  `);

  db.execSync(
    'CREATE INDEX IF NOT EXISTS entries_account_date ON entries(account_id, date);'
  );
}
