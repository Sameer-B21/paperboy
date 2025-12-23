import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const palette = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  accent: '#F6A34D',
  secondaryText: '#94A3B8',
  mutedAccent: '#FFF4E6',
};


export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        // sceneContainerStyle: { backgroundColor: palette.background },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.secondaryText,
        // tabBarActiveBackgroundColor: palette.mutedAccent,
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: palette.card,
          borderTopWidth: 0,
          height: 70,
          // marginHorizontal: 18,
          // marginBottom: 18,
          // paddingHorizontal: 18,
          // paddingVertical: 10,
          // paddingTop: 10,
          // borderRadius: 22,
          // shadowColor: '#0F172A',
          // shadowOpacity: colorScheme === 'dark' ? 0.35 : 0.08,
          // shadowRadius: 20,
          // shadowOffset: { width: 0, height: 10 },
          // elevation: 8,
        },
        tabBarItemStyle: {
          // borderRadius: 14,
          alignSelf: 'center',
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.sans,
          fontSize: 11,
          marginBottom: 4,
        },
      }}>
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="magnifyingglass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
