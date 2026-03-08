import { useColorScheme } from 'react-native';
import { darkPalette, lightPalette, type Palette } from '@/constants/palette';

export function usePalette(): Palette {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkPalette : lightPalette;
}
