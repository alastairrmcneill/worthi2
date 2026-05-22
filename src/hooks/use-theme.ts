import { useColorScheme } from 'react-native';
import { DARK_THEME, LIGHT_THEME, type Theme } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const themeOverride = useSettingsStore((s) => s.themeOverride);

  const isDark = themeOverride === 'dark' || (themeOverride === null && systemScheme === 'dark');
  return isDark ? DARK_THEME : LIGHT_THEME;
}

export function useIsDark(): boolean {
  const systemScheme = useColorScheme();
  const themeOverride = useSettingsStore((s) => s.themeOverride);
  return themeOverride === 'dark' || (themeOverride === null && systemScheme === 'dark');
}
