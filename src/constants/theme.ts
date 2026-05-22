export interface Theme {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  fg: string;
  fg2: string;
  fg3: string;
  accent: string;
  danger: string;
  success: string;
  sheetBg: string;
  overlay: string;
}

export const DARK_THEME: Theme = {
  bg: '#0B0B12',
  surface: '#15151D',
  surface2: '#1C1C26',
  border: 'rgba(255,255,255,0.08)',
  fg: '#FAFAF7',
  fg2: 'rgba(250,250,247,0.62)',
  fg3: 'rgba(250,250,247,0.38)',
  accent: '#FAFAF7',
  danger: '#F43F5E',
  success: '#10B981',
  sheetBg: '#15151D',
  overlay: 'rgba(0,0,0,0.55)',
};

export const LIGHT_THEME: Theme = {
  bg: '#F4F2EE',
  surface: '#FFFFFF',
  surface2: '#FBF9F5',
  border: 'rgba(0,0,0,0.07)',
  fg: '#0E0E14',
  fg2: 'rgba(14,14,20,0.62)',
  fg3: 'rgba(14,14,20,0.40)',
  accent: '#0E0E14',
  danger: '#E11D48',
  success: '#059669',
  sheetBg: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.35)',
};

export const HOME_GRAPH_COLOR = '#7EB6FF';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
