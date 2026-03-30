import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_BASE_URL } from '@/constants/api';
import { Fonts } from '@/constants/theme';
import { playPreview, stopPreviewSound } from '@/data/audioPlayer';
import { getTtsVoice, setTtsVoice } from '@/data/session';
import { usePalette } from '@/hooks/use-palette';

const voiceOptions = [
  { value: 'en-US-Chirp3-HD-Leda', label: 'Leda', description: 'Expressive and realistic high-definition female voice.' },
  { value: 'en-US-Chirp3-HD-Charon', label: 'Charon', description: 'Expressive and realistic high-definition male voice.' },
  { value: 'en-US-Chirp3-HD-Kore', label: 'Kore', description: 'Alternative high-definition female voice.' },
  { value: 'en-US-Journey-F', label: 'Journey (Female)', description: 'Conversational and warm female voice.' },
  { value: 'en-US-Journey-D', label: 'Journey (Male)', description: 'Conversational and friendly male voice.' },
];

export default function VoiceSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const [voice, setVoice] = useState('en-US-Chirp3-HD-Leda');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewVoice, setPreviewVoice] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    getTtsVoice().then((stored) => {
      if (stored) setVoice(stored);
    });
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

  const handleSelect = async (nextVoice: string) => {
    setVoice(nextVoice);
    await setTtsVoice(nextVoice);
    void playVoicePreview(nextVoice);
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
    previewText: {
      color: palette.secondaryText,
      fontSize: 13,
      fontFamily: Fonts.sans,
      marginBottom: 12,
      textAlign: 'center',
    },
    previewError: {
      color: '#DC2626',
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
    rowSubtitle: {
      color: palette.secondaryText,
      fontSize: 13,
      fontFamily: Fonts.sans,
      marginTop: 2,
    },
  }), [palette]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={25} color={palette.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Style</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isPreviewLoading ? (
          <Text style={styles.previewText}>
            Playing {voiceOptions.find((o) => o.value === previewVoice)?.label ?? 'voice'} preview...
          </Text>
        ) : null}
        {previewError ? <Text style={styles.previewError}>{previewError}</Text> : null}

        <View style={styles.listCard}>
          {voiceOptions.map((option, index) => {
            const isSelected = voice === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.row,
                  index === voiceOptions.length - 1 ? styles.rowLast : null,
                ]}
                activeOpacity={0.7}
                onPress={() => handleSelect(option.value)}
              >
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>{option.label}</Text>
                  <Text style={styles.rowSubtitle}>{option.description}</Text>
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
