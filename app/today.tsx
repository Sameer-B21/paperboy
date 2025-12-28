import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { getLatestDailyEpisode } from '@/data/backend';

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

const brandName = 'Paperboy';

export default function TodayScreen() {
  const router = useRouter();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<
    'idle' | 'ingesting' | 'generating' | 'polling' | 'ready' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [podcastScript, setPodcastScript] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [episodeTitle, setEpisodeTitle] = useState<string>('Your Morning Brief');
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const isBusy = playbackStatus === 'ingesting' || playbackStatus === 'generating' || playbackStatus === 'polling';
  const statusText = useMemo(() => {
    if (playbackError) {
      return playbackError;
    }
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
        return "The brief hasn't arrived yet. Check back soon.";
    }
  }, [errorMessage, playbackError, playbackStatus]);

  const handlePlayPress = async () => {
    if (isBusy) {
      return;
    }
    setPlaybackError(null);

    if (!audioUrl) {
      setPlaybackError('Audio not ready yet.');
      return;
    }

    try {
      const sound = await ensureSound(audioUrl);
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

  const loadDailyEpisode = async (): Promise<string | null> => {
    setErrorMessage(null);
    setPlaybackStatus('ingesting');

    try {
      const digest = await getLatestDailyEpisode();
      if (!digest || !digest.audioUrl) {
        setPlaybackStatus('idle');
        setPodcastScript(null);
        setAudioUrl(null);
        setEpisodeTitle('Your Morning Brief');
        setErrorMessage('No daily brief yet. Check back after 7am.');
        return null;
      }
      setPodcastScript(digest.script);
      setAudioUrl(digest.audioUrl);
      setEpisodeTitle(digest.subject);
      setPlaybackStatus('ready');
      return digest.audioUrl;
    } catch (error) {
      setPlaybackStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.');
      return null;
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    void loadDailyEpisode();
  }, []);

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

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const hasEpisode = Boolean(audioUrl);
  const showEmpty = !isInitialLoading && !hasEpisode;
  const statusHeadline = hasEpisode ? 'Brief is ready' : "Paperboy hasn't arrived yet";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundBloom} />
      <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            {/* <View style={styles.logoWrap}> */}
              <Image source={require('../assets/images/paperboy-logo.png')} style={styles.logoImage} />
            {/* </View> */}
            <Text style={styles.brandText}>{brandName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Past newsletters"
              onPress={() => router.push('/archive')}
            >
              <Ionicons name="file-tray-outline" size={25} color={palette.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="options-outline" size={25} color={palette.icon} />
            </TouchableOpacity>
          </View>
        </View>
      <View
        style={styles.scrollContent}
        // showsVerticalScrollIndicator={false}
        // bounces={false}
      >
        

        <View style={styles.deliveryCard}>
          {hasEpisode ? (
            <Text style={styles.deliveryEyebrow}>DELIVERED THIS MORNING</Text>
          ) : (
            <Text style={styles.deliveryEyebrow}>NO DELIVERY YET</Text>
          )}
          <Text style={styles.deliveryDate}>{todayLabel}</Text>
          <View style={styles.divider} />

          <View style={styles.statusBadge}>
            <View style={styles.badgeIcon}>
              {isInitialLoading ? (
                <ActivityIndicator size="small" color={palette.icon} />
              ) : (
                <Ionicons name={hasEpisode ? 'newspaper-outline' : 'bicycle-outline'} size={26} color={palette.icon} />
              )}
            </View>
            <Text style={styles.badgeTitle}>{statusHeadline}</Text>
            <Text style={[styles.badgeSubtitle, errorMessage ? styles.errorText : null]}>
              {hasEpisode
                ? statusText
                : isInitialLoading
                  && 'Checking for your brief...'
                  // : "Paperboy hasn't arrived yet.\nCheck back soon."
                  }
            </Text>
          </View>

          {hasEpisode ? (
            <View style={styles.playRow}>
              <TouchableOpacity
                style={[styles.playButton, isBusy && styles.playButtonDisabled]}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Play daily briefing"
                onPress={handlePlayPress}
                disabled={isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
              <Text style={styles.playLabel}>{isPlaying ? 'Pause the brief' : 'Listen now'}</Text>
            </View>
          ) : null}
        </View>
        {hasEpisode &&
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>7-10 min</Text>
            <Text style={styles.statLabel}>DURATION</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>Calm</Text>
            <Text style={styles.statLabel}>VOICE</Text>
          </View>
        </View>}

        {/* <View style={styles.summaryCard} accessibilityRole="summary">
          <Text style={styles.summaryTitle}>{podcastScript ? "Today's script" : 'About the briefing'}</Text>
          <Text style={styles.summaryText}>
            {podcastScript ??
              "Your Morning Brief distills the day's most important headlines into a calm, seven-minute listen. Each episode blends crisp context, thoughtful insight, and an easygoing narration so you can start your day informed and grounded."}
          </Text>
          {episodeTitle ? <Text style={styles.summaryMeta}>{episodeTitle}</Text> : null}
        </View> */}
      </View>
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
    // paddingHorizontal: 22,
    paddingBottom: 80,
    justifyContent: 'center', // Center items vertically
    alignItems: 'center',    // Center items horizontally
    flex: 1,
  },
  headerRow: {
    paddingVertical: 16,
    backgroundColor: palette.card,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // logoWrap: {
  //   width: 42,
  //   height: 42,
  //   // borderRadius: 12,
  //   // backgroundColor: palette.surface,
  //   // borderWidth: 1,
  //   // borderColor: palette.border,
  //   // alignItems: 'center',
  //   // justifyContent: 'center',
  // },
  logoImage: {
    width: 42,
    height: 42,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  brandText: {
    color: palette.primaryText,
    fontSize: 20,
    fontFamily: Fonts.serif,
    letterSpacing: 0.4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    // backgroundColor: palette.surface,
    // borderWidth: 1,
    // borderColor: palette.border,
  },
  deliveryCard: {
    backgroundColor: palette.card,
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  deliveryEyebrow: {
    color: palette.secondaryText,
    fontSize: 12,
    fontFamily: Fonts.sans,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  deliveryDate: {
    marginTop: 10,
    color: palette.primaryText,
    fontSize: 26,
    fontFamily: Fonts.serif,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 18,
    marginHorizontal: 40,
  },
  statusBadge: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  badgeIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTitle: {
    color: palette.primaryText,
    fontSize: 18,
    fontFamily: Fonts.sans,
  },
  badgeSubtitle: {
    color: palette.secondaryText,
    fontSize: 14,
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },
  errorText: {
    color: '#C0392B',
  },
  playRow: {
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
    shadowColor: palette.accentDark,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  playButtonDisabled: {
    backgroundColor: '#D8C6B5',
    shadowOpacity: 0,
  },
  playLabel: {
    color: palette.secondaryText,
    fontSize: 13,
    fontFamily: Fonts.sans,
    letterSpacing: 0.3,
  },
  statsRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  statBlock: {
    alignItems: 'center',
  },
  statValue: {
    color: palette.primaryText,
    fontSize: 18,
    fontFamily: Fonts.serif,
  },
  statLabel: {
    color: palette.secondaryText,
    fontSize: 12,
    fontFamily: Fonts.sans,
    letterSpacing: 1.6,
    marginTop: 6,
  },
  statDivider: {
    width: 1,
    height: 38,
    backgroundColor: palette.border,
  },
  summaryCard: {
    marginTop: 28,
    padding: 20,
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
  },
  summaryTitle: {
    color: palette.primaryText,
    fontSize: 18,
    fontFamily: Fonts.serif,
    marginBottom: 10,
  },
  summaryText: {
    color: palette.secondaryText,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.sans,
  },
  summaryMeta: {
    marginTop: 12,
    color: palette.secondaryText,
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
});
