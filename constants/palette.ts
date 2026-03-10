export type Palette = {
  background: string;
  card: string;
  surface: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  accentDark: string;
  border: string;
  icon: string;
  glow: string;
};

export const lightPalette: Palette = {
  background: '#FAFAFA',
  card: '#FFFFFF',
  surface: '#F4F4F5',
  primaryText: '#09090B',
  secondaryText: '#71717A',
  accent: '#4F46E5',
  accentDark: '#4338CA',
  border: '#E4E4E7',
  icon: '#52525B',
  glow: '#EEF2FF',
};

export const darkPalette: Palette = {
  background: '#09090B',
  card: '#18181B',
  surface: '#27272A',
  primaryText: '#FAFAFA',
  secondaryText: '#A1A1AA',
  accent: '#6366F1',
  accentDark: '#4F46E5',
  border: '#3F3F46',
  icon: '#71717A',
  glow: '#1E1B4B',
};
