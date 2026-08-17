import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { updateUserPreferences } from '@/data/backend';
import {
  DEFAULT_DELIVERY_HOUR,
  formatHourLabel,
  localHourToUtcHour,
} from '@/data/deliveryTime';
import { getDeliveryHour, setDeliveryHour } from '@/data/session';
import { usePalette } from '@/hooks/use-palette';

const hourOptions = Array.from({ length: 24 }, (_, hour) => hour);

export default function DeliveryTimeSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const [selectedHour, setSelectedHour] = useState(DEFAULT_DELIVERY_HOUR);

  useEffect(() => {
    getDeliveryHour().then((stored) => {
      const parsed = stored === null ? Number.NaN : Number.parseInt(stored, 10);
      if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 23) {
        setSelectedHour(parsed);
      }
    });
  }, []);

  const handleSelect = async (hour: number) => {
    setSelectedHour(hour);
    await setDeliveryHour(hour.toString());
    try {
      await updateUserPreferences({ digestUtcHour: localHourToUtcHour(hour) });
    } catch {
      // ignore — local pref is saved, backend will get it on the next change
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 22,
      paddingBottom: 16,
      backgroundColor: palette.card,
      marginBottom: 8,
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      color: palette.primaryText,
      fontSize: 20,
      fontFamily: Fonts.serif,
      letterSpacing: 0.4,
    },
    headerSpacer: {
      width: 36,
    },
    scrollContent: {
      paddingHorizontal: 22,
      paddingBottom: 48,
      paddingTop: 16,
    },
    helperText: {
      color: palette.secondaryText,
      fontSize: 13,
      fontFamily: Fonts.sans,
      marginBottom: 12,
      textAlign: 'center',
    },
    listCard: {
      backgroundColor: palette.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 14,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowContent: {
      flex: 1,
    },
    rowTitle: {
      color: palette.primaryText,
      fontSize: 15,
      fontFamily: Fonts.sans,
      fontWeight: '600',
    },
  }), [palette]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={25} color={palette.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Time</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.helperText}>
          Your daily episode is ready around this time each morning (or evening).
        </Text>

        <View style={styles.listCard}>
          {hourOptions.map((hour, index) => {
            const isSelected = selectedHour === hour;
            return (
              <TouchableOpacity
                key={hour}
                style={[styles.row, index === hourOptions.length - 1 ? styles.rowLast : null]}
                activeOpacity={0.7}
                onPress={() => void handleSelect(hour)}
              >
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>{formatHourLabel(hour)}</Text>
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={22} color={palette.accent} />
                ) : (
                  <Ionicons name="ellipse-outline" size={22} color={palette.border} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
