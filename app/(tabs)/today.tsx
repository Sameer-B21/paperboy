import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { getLatestDailyEpisode } from '@/data/backend';

const palette = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  primaryText: '#0F172A',
  secondaryText: '#94A3B8',
  accent: '#F6A34D',
  accentShadow: '#E18A28',
  pill: '#EEF2F6',
};

export default function TodayScreen() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<
    'idle' | 'ingesting' | 'generating' | 'polling' | 'ready' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [podcastScript, setPodcastScript] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [episodeTitle, setEpisodeTitle] = useState<string>('Your Morning Brief');

  const isBusy = playbackStatus === 'ingesting' || playbackStatus === 'generating' || playbackStatus === 'polling';
  const statusText = useMemo(() => {
    if (errorMessage) {
      return errorMessage;
    }
    switch (playbackStatus) {
      case 'ingesting':
        return 'Syncing your inbox...';
      case 'generating':
        return 'Building your daily script...';
      case 'polling':
        return 'Finalizing the audio transcript...';
      case 'ready':
        return 'Your briefing is ready to play.';
      default:
        return 'Your daily brief will appear here once it is ready.';
    }
  }, [errorMessage, playbackStatus]);

  const handlePlayPress = async () => {
    if (isBusy) {
      return;
    }
    if (playbackStatus !== 'ready') {
      await loadDailyEpisode();
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const loadDailyEpisode = async () => {
    setErrorMessage(null);
    setPlaybackStatus('ingesting');

    try {
      const digest = await getLatestDailyEpisode();
      if (!digest) {
        setPlaybackStatus('idle');
        setPodcastScript(null);
        setAudioUrl(null);
        setEpisodeTitle('Your Morning Brief');
        setErrorMessage('No daily brief yet. Check back after 7am.');
        return;
      }
      setPodcastScript(digest.script);
      setAudioUrl(digest.audioUrl);
      setEpisodeTitle(digest.subject);
      setPlaybackStatus('ready');
    } catch (error) {
      setPlaybackStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.');
    }
  };

  useEffect(() => {
    void loadDailyEpisode();
  }, []);
  
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>Company Logo</Text>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={22} color={palette.secondaryText} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.dateText}>{todayLabel}</Text>
          <Text style={styles.title}>{episodeTitle}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>7 min</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Medium</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Calm voice</Text>
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
                disabled={isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#ffffff" />
                )}
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
            <Text style={[styles.statusText, errorMessage ? styles.errorText : null]}>{statusText}</Text>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '32%' }]} />
            </View>
            <Text style={styles.progressLabel}>Light briefing · no rush</Text>
          </View>
        </View>
        <View style={styles.summaryCard} accessibilityRole="summary">
          <Text style={styles.summaryTitle}>{podcastScript ? 'Generated script' : 'About the podcast'}</Text>
          <Text style={styles.summaryText}>
            {podcastScript ??
              "Your Morning Brief is a gentle, story-driven podcast that distills the day's most important headlines into a calm seven-minute listen. Each episode blends crisp context, thoughtful insight, and an easygoing narration so you can start your day informed and grounded. Expect a balanced mix of global news, culture, and smart takeaways designed to help you feel prepared without feeling overwhelmed."}
          </Text>
          {audioUrl ? (
            <Text style={styles.audioHint}>Audio ready at {audioUrl.replace(/^https?:\/\//, '')}</Text>
          ) : null}
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
  scrollContent: {
    paddingTop: 26,
    paddingHorizontal: 22,
    paddingBottom: 80,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  greeting: {
    color: palette.secondaryText,
    fontSize: 15,
    fontFamily: Fonts.sans,
    letterSpacing: 0.2,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#EFF4FB',
  },
  heroCard: {
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 22,
    gap: 16,
    elevation: 4,
  },
  dateText: {
    color: palette.secondaryText,
    fontSize: 14,
    fontFamily: Fonts.sans,
    letterSpacing: 0.3,
  },
  title: {
    color: palette.primaryText,
    fontSize: 26,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  metaPill: {
    backgroundColor: palette.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  metaText: {
    color: '#475569',
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
    backgroundColor: palette.pill,
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
    shadowColor: palette.accentShadow,
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
  statusText: {
    color: palette.secondaryText,
    fontSize: 13,
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
  },
  progressBlock: {
    gap: 8,
    paddingTop: 6,
  },
  progressBar: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
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
    backgroundColor: palette.card,
    borderRadius: 18,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  summaryTitle: {
    color: palette.primaryText,
    fontSize: 18,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  summaryText: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.sans,
  },
  audioHint: {
    color: palette.secondaryText,
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
});
