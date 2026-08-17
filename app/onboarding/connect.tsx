import Ionicons from '@expo/vector-icons/Ionicons';
import * as ExpoLinking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { fetchAuthUrl, fetchUserProfile, updateUserPreferences } from '@/data/backend';
import {
  DEFAULT_DELIVERY_HOUR,
  localHourToUtcHour,
  utcHourToLocalHour,
} from '@/data/deliveryTime';
import { setAuthToken, setDeliveryHour, setOnboardingStep, setUserEmail } from '@/data/session';
import { usePalette } from '@/hooks/use-palette';

//makes sure the account has a delivery time: existing accounts sync theirs
//down for display, accounts without one get the 7 AM local default
async function syncDeliveryHour(): Promise<void> {
  try {
    const profile = await fetchUserProfile();
    if (profile.digestUtcHour === null) {
      await setDeliveryHour(DEFAULT_DELIVERY_HOUR.toString());
      await updateUserPreferences({ digestUtcHour: localHourToUtcHour(DEFAULT_DELIVERY_HOUR) });
    } else {
      await setDeliveryHour(utcHourToLocalHour(profile.digestUtcHour).toString());
    }
  } catch {
    // best effort — the server falls back to a default delivery time
  }
}

export default function ConnectScreen() {
  const params = useLocalSearchParams<{
    token?: string;
    email?: string;
    connected?: string;
    isNew?: string;
  }>();
  const { token, email, connected, isNew } = params;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const applyParams = async () => {
      if (!token || !connected) {
        return;
      }
      await setAuthToken(token);
      if (email) {
        await setUserEmail(email);
      }
      void syncDeliveryHour();
      if (isNew === '1') {
        await setOnboardingStep('newsletters');
        router.replace('/onboarding/newsletters');
        return;
      }
      await setOnboardingStep('complete');
      router.replace('/today');
    };
    void applyParams();
  }, [token, email, connected, isNew, router]);

  const handleConnectPress = async () => {
    setStatusMessage(null);
    setIsConnecting(true);
    try {
      const redirectUrl = ExpoLinking.createURL('/onboarding/connect');
      const url = await fetchAuthUrl(redirectUrl);
      await ExpoLinking.openURL(url);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to start Gmail auth.');
    } finally {
      setIsConnecting(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    backgroundOrbs: {
      ...StyleSheet.absoluteFillObject,
    },
    orbLarge: {
      position: 'absolute',
      top: -70,
      right: -110,
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: '#EEF2FF',
      opacity: 0.7,
    },
    orbSmall: {
      position: 'absolute',
      bottom: 100,
      left: -90,
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: '#E0E7FF',
      opacity: 0.6,
    },
    orbHighlight: {
      position: 'absolute',
      top: 200,
      left: 30,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#C7D2FE',
      opacity: 0.8,
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
    },
    hero: {
      marginBottom: 24,
    },
    kicker: {
      fontSize: 12,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      color: palette.secondaryText,
      fontFamily: Fonts.rounded,
      marginBottom: 10,
    },
    title: {
      fontSize: 28,
      color: palette.primaryText,
      fontFamily: Fonts.serif,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: palette.secondaryText,
      fontFamily: Fonts.sans,
    },
    card: {
      backgroundColor: palette.card,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: palette.border,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    cardText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontFamily: Fonts.rounded,
      color: palette.primaryText,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 13,
      color: palette.secondaryText,
      fontFamily: Fonts.sans,
    },
    primaryButton: {
      backgroundColor: palette.accent,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontFamily: Fonts.rounded,
    },
    statusText: {
      marginTop: 12,
      fontSize: 13,
      color: palette.secondaryText,
      fontFamily: Fonts.sans,
    },
  }), [palette]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={styles.backgroundOrbs} pointerEvents="none">
        <View style={styles.orbLarge} />
        <View style={styles.orbSmall} />
        <View style={styles.orbHighlight} />
      </View>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Welcome</Text>
          <Text style={styles.title}>Connect your Gmail</Text>
          <Text style={styles.subtitle}>
            Paperboy reads newsletters in your inbox and turns them into a daily audio brief.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="mail-outline" size={22} color={palette.icon} />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Newsletter access</Text>
              <Text style={styles.cardSubtitle}>
                We only read newsletters and label them "Podcast Sources".
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleConnectPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Connect with Google</Text>
              </>
            )}
          </TouchableOpacity>
          {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
