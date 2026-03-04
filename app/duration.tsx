import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { updateUserPreferences } from '@/data/backend';
import { getPodcastDurationMinutes, setPodcastDurationMinutes } from '@/data/session';

const palette = {
  background: '#F6F1E9',
  card: '#FBF8F2',
  surface: '#FDFBF7',
  primaryText: '#2E2A26',
  secondaryText: '#8F877C',
  accent: '#C78B5A',
  accentDark: '#B57846',
  border: '#E7DED3',
  icon: '#6F675D',
};

const MIN_MINUTES = 5;
const MAX_MINUTES = 30;

export default function DurationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [minutes, setMinutes] = useState('8');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getPodcastDurationMinutes().then((stored) => {
      if (stored) setMinutes(stored);
    });
  }, []);

  const parsedMinutes = useMemo(() => Number.parseInt(minutes, 10), [minutes]);
  const isValid =
    Number.isFinite(parsedMinutes) && parsedMinutes >= MIN_MINUTES && parsedMinutes <= MAX_MINUTES;

  const handleSave = async () => {
    if (!isValid || isSaving) return;
    setIsSaving(true);
    await setPodcastDurationMinutes(parsedMinutes.toString());
    try {
      await updateUserPreferences({ podcastDurationMinutes: parsedMinutes });
    } catch {
      // ignore — local pref is saved, backend will retry on next generate
    }
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => router.back(), 600);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={25} color={palette.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Length</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Minutes per episode</Text>
          <TextInput
            value={minutes}
            onChangeText={(v) => { setMinutes(v); setSaved(false); }}
            keyboardType="number-pad"
            style={styles.input}
            maxLength={2}
          />
          <Text style={styles.helper}>Choose between {MIN_MINUTES} and {MAX_MINUTES} minutes.</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (!isValid || isSaving) ? styles.saveButtonDisabled : null]}
          onPress={handleSave}
          disabled={!isValid || isSaving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveButtonText}>
            {saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  content: {
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 18,
    marginBottom: 16,
  },
  label: {
    color: palette.secondaryText,
    fontSize: 13,
    fontFamily: Fonts.sans,
    marginBottom: 10,
  },
  input: {
    backgroundColor: palette.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 22,
    color: palette.primaryText,
    fontFamily: Fonts.sans,
  },
  helper: {
    marginTop: 8,
    fontSize: 12,
    color: palette.secondaryText,
    fontFamily: Fonts.sans,
  },
  saveButton: {
    backgroundColor: palette.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
});
