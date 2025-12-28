import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { getEpisode } from '@/data/backend';


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

export default function EpisodeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [episode, setEpisode] = useState<{
    id: string;
    subject: string;
    summary: string | null;
    script: string | null;
    status: string;
    audioUrl: string | null;
    createdAt: string;
    progressLabel?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    const loadEpisode = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const detail = await getEpisode(id);
        setEpisode(detail);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load brief.');
      } finally {
        setIsLoading(false);
      }
    };
    void loadEpisode();
  }, [id]);

  const handlePlayPress = async () => {

    setPlaybackError(null);

    if (!episode?.audioUrl) {
      setPlaybackError('Audio not ready yet.');
      return;
    }
    try {

      const sound = await ensureSound(episode.audioUrl);
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      setPlaybackError(error instanceof Error ? error.message : 'Unable to play audio.');
    }
  };

  useEffect(() => {
    void Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    return () => {
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
        soundRef.current = null;
        audioUrlRef.current = null;
      }
    };
  }, []);

  const ensureSound = async (uri: string) => {
    if (soundRef.current && audioUrlRef.current === uri) {
      return soundRef.current;
    }
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      setIsPlaying(false);
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false },
      (status) => {
        if (!status.isLoaded) {
          return;
        }
        setIsPlaying(status.isPlaying);
      }
    );
    soundRef.current = sound;
    audioUrlRef.current = uri;
    return sound;
  };

  if (!episode) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backgroundGlow} />
        <View style={styles.backgroundBloom} />
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>{isLoading ? 'Loading brief...' : 'Brief not found'}</Text>
          <Text style={styles.notFoundText}>
            {errorMessage ?? 'Pick another date from the archive list.'}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={palette.primaryText} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progressWidth = episode.status === 'completed' ? '100%' : '45%';
  const dateLabel = new Date(episode.createdAt).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundBloom} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoWrap}>
              <Image source={require('../../assets/images/icon.png')} style={styles.logoImage} />
            </View>
            <Text style={styles.brandText}>NewsletterPodcaster</Text>
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color={palette.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.dateText}>{dateLabel}</Text>
          <Text style={styles.title}>{episode.subject}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>{episode.status}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Auto</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Warm voice</Text>
            </View>
          </View>

          <View style={styles.playSection}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.skipButton}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Skip back 10 seconds"
              >
                <Ionicons name="play-back" size={18} color={palette.primaryText} />
                <Text style={styles.skipLabel}>10s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.playButton}
                activeOpacity={0.9}
                accessibilityRole="button"
                onPress={handlePlayPress}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipButton}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Skip forward 10 seconds"
              >
                <Ionicons name="play-forward" size={18} color={palette.primaryText} />
                <Text style={styles.skipLabel}>10s</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.playHint}>
              {isPlaying ? 'Playing...' : 'Press play to ease into the day'}
            </Text>
            {playbackError ? <Text style={styles.errorText}>{playbackError}</Text> : null}
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${parseFloat(progressWidth)}%` || 0 }]} />
            </View>
            <Text style={styles.progressLabel}>{episode.progressLabel}</Text>
          </View>
        </View>

        <View style={styles.summaryCard} accessibilityRole="summary">
          <Text style={styles.summaryTitle}>Script</Text>
          <Text style={styles.summaryText}>{episode.script ?? episode.summary ?? 'Processing...'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  backgroundGlow: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: palette.glow,
    opacity: 0.7,
  },
  backgroundBloom: {
    position: 'absolute',
    top: 140,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#EFE3D3',
    opacity: 0.5,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  brandText: {
    color: palette.primaryText,
    fontSize: 20,
    fontFamily: Fonts.serif,
    letterSpacing: 0.4,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  heroCard: {
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 22,
    gap: 16,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  dateText: {
    color: palette.secondaryText,
    fontSize: 14,
    fontFamily: Fonts.serif,
    letterSpacing: 0.4,
  },
  title: {
    color: palette.primaryText,
    fontSize: 26,
    fontFamily: Fonts.serif,
    letterSpacing: 0.4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  metaPill: {
    backgroundColor: palette.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  metaText: {
    color: palette.secondaryText,
    fontSize: 13,
    fontFamily: Fonts.sans,
    letterSpacing: 0.1,
  },
  playSection: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%',
    marginTop: 4,
  },
  skipButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  skipLabel: {
    color: palette.primaryText,
    fontSize: 11,
    fontFamily: Fonts.sans,
    letterSpacing: 0.2,
  },
  playButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
    shadowColor: palette.accentDark,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  playHint: {
    color: palette.secondaryText,
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  errorText: {
    color: '#C0392B',
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  progressBlock: {
    gap: 8,
    paddingTop: 6,
  },
  progressBar: {
    height: 4,
    borderRadius: 999,
    backgroundColor: palette.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.accent,
  },
  progressLabel: {
    color: palette.secondaryText,
    fontSize: 13,
    fontFamily: Fonts.sans,
    letterSpacing: 0.2,
  },
  summaryCard: {
    marginTop: 20,
    padding: 22,
    backgroundColor: palette.surface,
    borderRadius: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  summaryTitle: {
    color: palette.primaryText,
    fontSize: 18,
    fontFamily: Fonts.serif,
    letterSpacing: 0.4,
  },
  summaryText: {
    color: palette.secondaryText,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.sans,
  },
  notFoundContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  notFoundTitle: {
    color: palette.primaryText,
    fontSize: 24,
    fontFamily: Fonts.serif,
  },
  notFoundText: {
    color: palette.secondaryText,
    fontSize: 15,
    fontFamily: Fonts.sans,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  backButtonText: {
    color: palette.primaryText,
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
});
