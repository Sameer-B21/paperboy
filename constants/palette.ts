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
  background: '#F6F1E9',
  card: '#FBF8F2',
  surface: '#FDFBF7',
  primaryText: '#2E2A26',
  secondaryText: '#8F877C',
  accent: '#C78B5A',
  accentDark: '#B57846',
  border: '#E7DED3',
  icon: '#6F675D',
  glow: '#F0E7DA',
};

export const darkPalette: Palette = {
  background: '#18140F',
  card: '#211C17',
  surface: '#2C261F',
  primaryText: '#F0E9DF',
  secondaryText: '#9A9088',
  accent: '#C78B5A',
  accentDark: '#B57846',
  border: '#3A332B',
  icon: '#A09088',
  glow: '#251E15',
};
