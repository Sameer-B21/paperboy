import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { listNewsletters } from '@/data/backend';
import {
  clearOnboardingStep,
  clearPodcastDurationMinutes,
  clearTtsVoice,
  clearUserEmail,
  clearUserId,
  getPodcastDurationMinutes,
  getTtsVoice,
  getUserEmail,
  getUserId,
  setUserEmail,
  setUserId,
} from '@/data/session';
import { useRequireUser } from '@/hooks/use-require-user';
import { usePalette } from '@/hooks/use-palette';

export default function SettingsScreen() {
  const params = useLocalSearchParams<{ userId?: string; email?: string; connected?: string }>();
  const { userId, email, connected } = params;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  useRequireUser({ allowUserId: userId });

  const [userEmail, setUserEmailState] = useState('');
  const [ttsVoice, setTtsVoiceState] = useState('alloy');
  const [durationMinutes, setDurationMinutes] = useState('8');
  const [activeNewsletterCount, setActiveNewsletterCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const loadSession = useCallback(async () => {
    const [storedEmail, storedVoice, storedDuration, storedUserId] = await Promise.all([
      getUserEmail(),
      getTtsVoice(),
      getPodcastDurationMinutes(),
      getUserId(),
    ]);
    if (storedEmail) setUserEmailState(storedEmail);
    if (storedVoice) setTtsVoiceState(storedVoice);
    if (storedDuration) setDurationMinutes(storedDuration);
    if (storedUserId) setIsConnected(true);
  }, []);

  const loadNewsletterCount = useCallback(async () => {
    try {
      const data = await listNewsletters();
      setActiveNewsletterCount(data.filter((n) => n.selected).length);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const applyParams = async () => {
      if (userId) await setUserId(userId);
      if (email) await setUserEmail(email);
    };
    void applyParams().then(loadSession).then(loadNewsletterCount);
  }, [userId, email, connected]);

  useFocusEffect(
    useCallback(() => {
      void loadSession();
      void loadNewsletterCount();
    }, [loadSession, loadNewsletterCount])
  );

  const handleLogout = async () => {
    await clearUserId();
    await clearUserEmail();
    await clearTtsVoice();
    await clearOnboardingStep();
    await clearPodcastDurationMinutes();
    router.replace('/onboarding/connect');
  };

  const voiceLabel = ttsVoice.charAt(0).toUpperCase() + ttsVoice.slice(1);
  const durationLabel = `${durationMinutes} min`;
  const sourcesLabel =
    activeNewsletterCount > 0
      ? `${activeNewsletterCount} active newsletter${activeNewsletterCount === 1 ? '' : 's'}`
      : 'No newsletters selected';

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
    sectionLabel: {
      color: palette.secondaryText,
      fontSize: 11,
      fontFamily: Fonts.sans,
      fontWeight: '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: palette.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.border,
      marginBottom: 28,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 14,
    },
    iconBubble: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
      alignItems: 'center',
      justifyContent: 'center',
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
    rowSubtitle: {
      color: palette.secondaryText,
      fontSize: 13,
      fontFamily: Fonts.sans,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: palette.border,
      marginLeft: 66,
    },
    logoutButton: {
      marginTop: 4,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#E0B6A4',
      backgroundColor: '#F5E7E0',
      alignItems: 'center',
    },
    logoutText: {
      color: '#B4544A',
      fontSize: 15,
      fontFamily: Fonts.sans,
      fontWeight: '600',
    },
  }), [palette]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.push('/today')}
        >
          <Ionicons name="chevron-back" size={25} color={palette.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconBubble}>
              <Ionicons name="person-outline" size={18} color={palette.icon} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Email</Text>
              <Text style={styles.rowSubtitle} numberOfLines={1}>{userEmail || '—'}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Sources</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => router.push('/newsletters')}
          >
            <View style={styles.iconBubble}>
              <Ionicons name="mail-outline" size={18} color={palette.icon} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Manage Sources</Text>
              <Text style={styles.rowSubtitle}>{sourcesLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.secondaryText} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Delivery Preferences</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => router.push('/voice')}
          >
            <View style={styles.iconBubble}>
              <Ionicons name="mic-outline" size={18} color={palette.icon} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Voice Style</Text>
              <Text style={styles.rowSubtitle}>{voiceLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.secondaryText} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => router.push('/duration')}
          >
            <View style={styles.iconBubble}>
              <Ionicons name="time-outline" size={18} color={palette.icon} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Delivery Length</Text>
              <Text style={styles.rowSubtitle}>{durationLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.secondaryText} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Podcast</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => router.push('/today?generate=1')}
          >
            <View style={styles.iconBubble}>
              <Ionicons name="refresh-outline" size={18} color={palette.icon} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Generate New Podcast</Text>
              <Text style={styles.rowSubtitle}>Create a fresh episode from your latest newsletters</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.secondaryText} />
          </TouchableOpacity>
        </View>

        {isConnected ? (
          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
