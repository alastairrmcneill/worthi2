export type AccountType = 'current' | 'credit_card' | 'investment' | 'loan' | 'pension' | 'house';

export interface AccountTypeConfig {
  label: string;
  short: string;
  color: string;
  glyph: string;
  sign: 1 | -1;
  description: string;
}

export const ACCOUNT_TYPES: Record<AccountType, AccountTypeConfig> = {
  current: {
    label: 'Current Account',
    short: 'Current',
    color: '#3B82F6',
    glyph: '🏦',
    sign: 1,
    description: 'Balance you can spend.',
  },
  credit_card: {
    label: 'Credit Card',
    short: 'Credit',
    color: '#F43F5E',
    glyph: '💳',
    sign: -1,
    description: 'Owed on credit cards.',
  },
  investment: {
    label: 'Investment',
    short: 'Invest',
    color: '#10B981',
    glyph: '📈',
    sign: 1,
    description: 'Tracks deposits + return.',
  },
  loan: {
    label: 'Loan',
    short: 'Loan',
    color: '#F97316',
    glyph: '🏛',
    sign: -1,
    description: 'Owed on a loan.',
  },
  pension: {
    label: 'Pension',
    short: 'Pension',
    color: '#8B5CF6',
    glyph: '🏛',
    sign: 1,
    description: 'Retirement value.',
  },
  house: {
    label: 'House',
    short: 'House',
    color: '#14B8A6',
    glyph: '🏠',
    sign: 1,
    description: 'Property + mortgage.',
  },
};

export const TYPE_ORDER: AccountType[] = [
  'current',
  'investment',
  'house',
  'pension',
  'credit_card',
  'loan',
];
