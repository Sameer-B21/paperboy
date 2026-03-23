import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Fonts } from '@/constants/theme';
import { updateUserPreferences } from '@/data/backend';
import { setOnboardingStep, setPodcastDurationMinutes } from '@/data/session';
import { usePalette } from '@/hooks/use-palette';

const MIN_MINUTES = 2;
const MAX_MINUTES = 30;

export default function DurationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const [minutes, setMinutes] = useState('8');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedMinutes = useMemo(() => Number.parseInt(minutes, 10), [minutes]);
  const isValid =
    Number.isFinite(parsedMinutes) && parsedMinutes >= MIN_MINUTES && parsedMinutes <= MAX_MINUTES;

  const handleFinish = async () => {
    if (!isValid || isSubmitting) {
      setErrorMessage(`Choose a length between ${MIN_MINUTES} and ${MAX_MINUTES} minutes.`);
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    await setPodcastDurationMinutes(parsedMinutes.toString());
    try {
      await updateUserPreferences({ podcastDurationMinutes: parsedMinutes });
    } catch {
      // ignore — local pref is saved
    }
    await setOnboardingStep('complete');
    router.replace({ pathname: '/today', params: { generate: '1' } });
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: 20,
    },
    hero: {
      marginBottom: 18,
    },
    kicker: {
      fontSize: 12,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      color: palette.secondaryText,
      fontFamily: Fonts.rounded,
      marginBottom: 8,
    },
    title: {
      fontSize: 26,
      color: palette.primaryText,
      fontFamily: Fonts.serif,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.secondaryText,
      fontFamily: Fonts.sans,
    },
    card: {
      backgroundColor: palette.card,
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: palette.border,
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 13,
      fontFamily: Fonts.rounded,
      color: palette.secondaryText,
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: palette.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 18,
      color: palette.primaryText,
      fontFamily: Fonts.sans,
    },
    helperText: {
      marginTop: 8,
      fontSize: 12,
      color: palette.secondaryText,
      fontFamily: Fonts.sans,
    },
    errorText: {
      color: '#DC2626',
      fontFamily: Fonts.sans,
      marginBottom: 12,
    },
    primaryButton: {
      backgroundColor: palette.accent,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontFamily: Fonts.rounded,
    },
  }), [palette]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={[styles.container, { paddingTop: insets.top + 18 }]}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Step 3</Text>
          <Text style={styles.title}>Pick a length</Text>
          <Text style={styles.subtitle}>
            Tell us how long you want your daily briefing to run.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>Minutes per episode</Text>
          <TextInput
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="number-pad"
            style={styles.textInput}
            maxLength={2}
          />
          <Text style={styles.helperText}>
            Recommended: {MIN_MINUTES}-{MAX_MINUTES} minutes.
          </Text>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, !isValid ? styles.primaryButtonDisabled : null]}
          onPress={handleFinish}
          disabled={!isValid || isSubmitting}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? 'Starting your brief...' : 'Create my brief'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
