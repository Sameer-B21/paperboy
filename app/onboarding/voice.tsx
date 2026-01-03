import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { API_BASE_URL } from '@/constants/api';
import { Fonts } from '@/constants/theme';
import { playPreview, stopPreviewSound } from '@/data/audioPlayer';
import { setOnboardingStep, setTtsVoice } from '@/data/session';

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
  glow: '#F0E7DA',
};

const voiceOptions = [
  { value: 'alloy', label: 'Alloy', description: 'Balanced and clear.' },
  { value: 'nova', label: 'Nova', description: 'Bright and lively.' },
  { value: 'echo', label: 'Echo', description: 'Smooth and steady.' },
  { value: 'fable', label: 'Fable', description: 'Warm and story-like.' },
  { value: 'onyx', label: 'Onyx', description: 'Deep and grounded.' },
  { value: 'shimmer', label: 'Shimmer', description: 'Soft and airy.' },
  { value: 'ash', label: 'Ash', description: 'Crisp and neutral.' },
  { value: 'sage', label: 'Sage', description: 'Calm and measured.' },
  { value: 'coral', label: 'Coral', description: 'Friendly and upbeat.' },
];

export default function VoiceSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [voice, setVoice] = useState('alloy');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewVoice, setPreviewVoice] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      void stopPreviewSound();
    };
  }, []);

  const playVoicePreview = async (nextVoice: string) => {
    setPreviewError(null);
    setIsPreviewLoading(true);
    setPreviewVoice(nextVoice);
    try {
      const uri = `${API_BASE_URL}/tts/preview?voice=${encodeURIComponent(nextVoice)}`;
      await playPreview(uri);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Unable to play voice preview.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleVoiceSelect = (nextVoice: string) => {
    setVoice(nextVoice);
    void playVoicePreview(nextVoice);
  };

  const handleContinue = async () => {
    await setTtsVoice(voice);
    await setOnboardingStep('duration');
    router.push('/onboarding/duration');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 18 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>Step 2</Text>
          <Text style={styles.title}>Choose your voice</Text>
          <Text style={styles.subtitle}>
            Pick the narrator style that feels right for your daily brief.
          </Text>
        </View>

        <View style={styles.voiceGrid}>
          {voiceOptions.map((option) => {
            const isSelected = option.value === voice;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.voiceCard, isSelected ? styles.voiceCardSelected : null]}
                onPress={() => handleVoiceSelect(option.value)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.voiceLabel}>{option.label}</Text>
                <Text style={styles.voiceDescription}>{option.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isPreviewLoading ? (
          <Text style={styles.previewText}>
            Playing {voiceOptions.find((option) => option.value === previewVoice)?.label ?? 'voice'} preview...
          </Text>
        ) : null}
        {previewError ? <Text style={styles.previewError}>{previewError}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
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
  voiceGrid: {
    gap: 12,
    marginBottom: 20,
  },
  previewText: {
    fontSize: 12,
    color: palette.secondaryText,
    fontFamily: Fonts.sans,
    marginBottom: 8,
  },
  previewError: {
    fontSize: 12,
    color: '#A34B3F',
    fontFamily: Fonts.sans,
    marginBottom: 8,
  },
  voiceCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  voiceCardSelected: {
    borderColor: palette.accent,
    shadowColor: palette.accentDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  voiceLabel: {
    fontSize: 15,
    fontFamily: Fonts.rounded,
    color: palette.primaryText,
    marginBottom: 4,
  },
  voiceDescription: {
    fontSize: 13,
    color: palette.secondaryText,
    fontFamily: Fonts.sans,
  },
  primaryButton: {
    backgroundColor: palette.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.rounded,
  },
});
