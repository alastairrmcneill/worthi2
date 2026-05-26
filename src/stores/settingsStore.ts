import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Currency {
  code: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'GBP', symbol: '£', locale: 'en-GB' },
  { code: 'USD', symbol: '$', locale: 'en-US' },
  { code: 'EUR', symbol: '€', locale: 'de-DE' },
  { code: 'AUD', symbol: 'A$', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', locale: 'en-CA' },
];

export type ThemeOverride = 'dark' | 'light' | null;

interface SettingsState {
  currency: Currency;
  themeOverride: ThemeOverride;
  hasOnboarded: boolean;
  hasSeenReviewPrompt: boolean;
  setCurrency: (currency: Currency) => void;
  setThemeOverride: (override: ThemeOverride) => void;
  setHasOnboarded: (value: boolean) => void;
  setHasSeenReviewPrompt: (value: boolean) => void;
}

function detectDefaultCurrency(): Currency {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (locale.includes('GB') || locale.includes('en-GB')) return CURRENCIES[0];
    if (locale.includes('US') || locale.includes('en-US')) return CURRENCIES[1];
    if (locale.includes('AU')) return CURRENCIES[3];
    if (locale.includes('CA')) return CURRENCIES[4];
    const region = locale.split('-')[1]?.toUpperCase();
    if (['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT'].includes(region ?? '')) return CURRENCIES[2];
  } catch {
    // ignore
  }
  return CURRENCIES[0];
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: detectDefaultCurrency(),
      themeOverride: null,
      hasOnboarded: false,
      hasSeenReviewPrompt: false,
      setCurrency: (currency) => set({ currency }),
      setThemeOverride: (themeOverride) => set({ themeOverride }),
      setHasOnboarded: (hasOnboarded) => set({ hasOnboarded }),
      setHasSeenReviewPrompt: (hasSeenReviewPrompt) => set({ hasSeenReviewPrompt }),
    }),
    {
      name: 'worthi-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
