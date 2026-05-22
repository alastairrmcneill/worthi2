import type { Currency } from '@/stores/settingsStore';

export function formatCurrency(value: number, currency: Currency): string {
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyFull(value: number, currency: Currency): string {
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// "+12.3%" or "-4.5%"
export function formatPercent(value: number, decimals = 1): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

// "+£1,200" or "-£800"
export function formatCurrencySigned(value: number, currency: Currency): string {
  const abs = formatCurrency(Math.abs(value), currency);
  if (value >= 0) return `+${abs}`;
  return `-${abs}`;
}

// "1 Jan 2024"
export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ts));
}

// "1 Jan"
export function formatDateShort(ts: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(ts));
}

// "Jan 2024"
export function formatMonthYear(ts: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(ts));
}

// YYYY-MM-DD string from a unix ms timestamp
export function toISODate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Parse YYYY-MM-DD to midnight local unix ms
export function fromISODate(s: string): number | null {
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const d = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  return isNaN(d.getTime()) ? null : d.getTime();
}
