import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="onboarding/connect" />
        <Stack.Screen name="onboarding/newsletters" />
        <Stack.Screen name="onboarding/voice" />
        <Stack.Screen name="onboarding/duration" />
        <Stack.Screen name="today" />
        <Stack.Screen name="archive" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="episodes/[id]" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
