import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { usePalette } from '@/hooks/use-palette';

export function PaperLoader({ text }: { text?: string }) {
  const palette = usePalette();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Animated.View style={{ opacity }}>
        <Ionicons name="newspaper-outline" size={48} color={palette.secondaryText} />
      </Animated.View>
      {text ? (
        <Text style={[styles.text, { color: palette.secondaryText }]}>{text}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
});
